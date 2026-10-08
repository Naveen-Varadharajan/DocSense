# backend/app/main.py
import os
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

from .database import engine, Base, get_db, SessionLocal
from .models import Document
from .rag import process_document, search_documents, synthesize_direct_answer, get_chunks_for_document

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Restore existing documents from DB into memory on startup
    db = SessionLocal()
    try:
        docs = db.query(Document).all()
        for doc in docs:
            if doc.file_path and os.path.exists(doc.file_path):
                print(f"Restoring document {doc.id} from {doc.file_path} into memory...")
                process_document(doc.file_path, doc.id)
    except Exception as e:
        print("Failed to restore documents:", e)
    finally:
        db.close()
    yield

app = FastAPI(
    title="DocSense AI Backend",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Pydantic models ----------
class QueryRequest(BaseModel):
    question: str
    document_id: Optional[str] = "doc-1"
    top_k: int = 3
    similarity_threshold: float = 0.75
    model: Optional[str] = None

class Answer(BaseModel):
    text: str
    citations: List[int] = []

class Source(BaseModel):
    id: str
    page: int
    snippet: str
    score: float

class QueryResponse(BaseModel):
    answer: Answer
    chunks_analyzed: int
    sources: List[Source]


# ---------- Endpoints ----------
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "DocSense AI backend running"}


@app.get("/api/documents")
async def get_documents(db: Session = Depends(get_db)):
    """Return all indexed documents from SQLite."""
    docs = db.query(Document).order_by(Document.upload_date.desc()).all()
    results = []
    for d in docs:
        results.append({
            "id": d.id,
            "name": d.filename,
            "size": f"{d.file_size_mb:.2f} MB",
            "pages": d.pages,
            "chunks": d.chunks,
            "status": d.status,
            "addedAt": d.upload_date.strftime("%Y-%m-%d") if d.upload_date else ""
        })
    return results


@app.get("/api/chunks")
async def get_chunks(doc_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Inspect in-memory chunks for a specific document or all documents.

    Query params:
      - doc_id  : Filter by document ID (e.g. doc-abc123). Omit to list all.

    Each chunk entry contains:
      document_id, chunk_index, page, text (first 200 chars shown as preview)
    """
    # Resolve doc_id from document name if it looks like a name (not doc-xxx)
    resolved_id = doc_id
    if doc_id and not doc_id.startswith("doc-"):
        doc = db.query(Document).filter(Document.filename.ilike(f"%{doc_id}%")).first()
        if doc:
            resolved_id = doc.id
        else:
            return {"error": f"No document found matching name '{doc_id}'"}

    chunks = get_chunks_for_document(resolved_id)

    return {
        "total_chunks": len(chunks),
        "filter": resolved_id or "all",
        "chunks": [
            {
                "document_id": c.get("document_id"),
                "chunk_index": c.get("chunk_index"),
                "page": c.get("page"),
                "preview": c.get("text", "")[:200] + ("..." if len(c.get("text", "")) > 200 else "")
            }
            for c in chunks
        ]
    }


@app.post("/api/query", response_model=QueryResponse)
async def query_endpoint(payload: QueryRequest, db: Session = Depends(get_db)):
    """Receive a question, perform vector retrieval, and return synthesized answer with analyzed chunk count."""
    try:
        doc_id = payload.document_id

        # 1. Search index for relevant chunks
        sources = search_documents(
            query=payload.question, 
            top_k=payload.top_k, 
            document_id=doc_id if doc_id and doc_id != "doc-1" else None
        )

        # 2. Synthesize clean, relevant answer
        answer_text = synthesize_direct_answer(
            query=payload.question,
            sources=sources
        )

        return {
            "answer": {"text": answer_text, "citations": []},
            "chunks_analyzed": len(sources),
            "sources": sources
        }
    except Exception as exc:
        print("Query error:", exc)
        raise HTTPException(status_code=500, detail=f"RAG processing error: {exc}")


@app.post("/api/upload")
async def upload_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Accept a PDF, save to disk, extract text, generate embeddings,
    save metadata to DB, and add chunks to the index.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        file_size_mb = len(content) / (1024 * 1024)

        # Process document (extract text page-by-page, chunk, and embed)
        rag_stats = process_document(file_path, doc_id)
        
        # Save metadata to DB
        db_doc = Document(
            id=doc_id,
            filename=file.filename,
            file_path=file_path,
            status="Indexed",
            pages=rag_stats.get("pages", 0),
            chunks=rag_stats.get("chunks", 0),
            file_size_mb=file_size_mb
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        response = {
            "id": db_doc.id,
            "name": db_doc.filename,
            "size": f"{db_doc.file_size_mb:.2f} MB",
            "pages": db_doc.pages,
            "chunks": db_doc.chunks,
            "status": db_doc.status
        }
        return JSONResponse(content=response)
        
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, db: Session = Depends(get_db)):
    """Delete a document from DB and remove uploaded file."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return {"status": "ok", "message": "Document not found or already deleted"}
    
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass
            
    db.delete(doc)
    db.commit()
    return {"status": "ok", "deleted_id": doc_id}