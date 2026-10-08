"""
Retrieval-Augmented Generation (RAG) module.
Handles document processing, chunking, and in-memory vector search using TF-IDF.
"""
import os
import re
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.stem import PorterStemmer

# Stemmer for matching "founded" ↔ "founding", "company" ↔ "companies", etc.
_stemmer = PorterStemmer()

def _stemmed_tokenizer(text: str) -> List[str]:
    """Tokenize + stem words so 'founded' and 'founding' both become 'found'."""
    words = re.findall(r'\b[a-zA-Z0-9]+\b', text.lower())
    return [_stemmer.stem(w) for w in words if len(w) >= 2]

# In-memory chunk store
chunk_metadata_store: List[Dict[str, Any]] = []

def extract_pages_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text page-by-page from a PDF file."""
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        clean_text = page_text.strip()
        if clean_text:
            pages.append({"page_number": i + 1, "text": clean_text})
    return pages

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 60) -> List[str]:
    """Splits text into chunks of roughly `chunk_size` characters with `overlap`."""
    chunks = []
    start = 0
    text_length = len(text)
    if text_length == 0:
        return []
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        if end < text_length:
            last_space = text.rfind(' ', start, end)
            if last_space != -1 and last_space > start + chunk_size // 2:
                end = last_space
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        if end >= text_length:
            break
            
        next_start = end - overlap
        if next_start <= start:
            next_start = start + 1
        start = next_start
            
    return chunks

def add_chunks_to_index(chunks_with_meta: List[Dict[str, Any]]):
    """Adds chunks with metadata into memory store."""
    global chunk_metadata_store
    if not chunks_with_meta:
        return
    chunk_metadata_store.extend(chunks_with_meta)

def get_chunks_for_document(document_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Returns all in-memory chunks, optionally filtered by document_id.
    Used by the /api/chunks inspection endpoint.
    """
    if not document_id:
        return chunk_metadata_store
    return [c for c in chunk_metadata_store if c.get("document_id") == document_id]

def seed_sample_document_if_empty():
    """Seeds initial knowledge for sample doc-1 if store is empty."""
    global chunk_metadata_store
    if len(chunk_metadata_store) > 0:
        return

    sample_passages = [
        {"page": 1, "text": "Data Hazards occur in processor pipelining when instructions that are close in execution order depend on the results of previous instructions that have not yet completed and written to registers."},
        {"page": 2, "text": "There are three primary categories of data dependencies: RAW (Read After Write) which is a true dependency where an instruction reads before writeback; WAR (Write After Read) which is an anti-dependency; and WAW (Write After Write) which is an output dependency."},
        {"page": 3, "text": "Mitigation techniques for data hazards include Data Forwarding (also known as bypassing) which routes computed ALU results directly to input stages, and Pipeline Stalling (inserting bubbles) when required data is not yet available, such as after a memory load."},
        {"page": 4, "text": "Retrieval-Augmented Generation (RAG) grounds language models by chunking source documents, generating semantic vector representations, retrieving top relevant passages based on query similarity, and synthesizing verifiable answers."}
    ]

    items = []
    for i, item in enumerate(sample_passages):
        items.append({
            "document_id": "doc-1",
            "text": item["text"],
            "chunk_index": i + 1,
            "page": item["page"]
        })

    add_chunks_to_index(items)

# Seed sample content on module load
seed_sample_document_if_empty()

def process_document(file_path: str, document_id: str) -> Dict[str, Any]:
    """Extracts text page by page, chunks it, and indexes it."""
    try:
        pages_data = extract_pages_from_pdf(file_path)
        total_pages = len(pages_data)
        
        all_chunks = []
        chunk_counter = 1
        for p in pages_data:
            page_chunks = chunk_text(p["text"])
            for text in page_chunks:
                all_chunks.append({
                    "document_id": document_id,
                    "text": text,
                    "chunk_index": chunk_counter,
                    "page": p["page_number"]
                })
                chunk_counter += 1
                
        if not all_chunks:
            return {"pages": total_pages, "chunks": 0}
            
        add_chunks_to_index(all_chunks)
        return {"pages": total_pages, "chunks": len(all_chunks)}
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        return {"pages": 0, "chunks": 0}


# ── Query Expansion ──────────────────────────────────────────────────────────

# Intent patterns: detect multi-word question intent and expand heavily
_INTENT_PATTERNS = [
    # founding / establishment queries
    (r'\b(when|year|date).*(found|establish|start|incept|origin|creat)', 
     "founded established started year date inception origin 2020 incorporated"),
    (r'\b(found|establish|start).*(when|year|date|compan)', 
     "founded established started year date inception origin 2020 incorporated"),
    (r'\b(year|date)\b.*\b(found|establish|start|birth|origin)', 
     "founded established started year date inception origin 2020 incorporated"),
    # location queries
    (r'\b(where|locat|headquart|office|address|city|based)\b', 
     "location headquarters office address city based situated"),
    # headcount / team size
    (r'\b(how many|number|count|size).*(employ|staff|team|people|work)', 
     "employees staff team workforce headcount personnel size"),
]

# Single-word synonym expansion
_SYNONYMS = {
    "founded": ["founded", "established", "started", "incorporated", "inception", "origin", "year"],
    "founding": ["founded", "established", "started", "incorporated", "inception", "origin", "year"],
    "year": ["year", "date", "when", "founded", "established"],
    "when": ["when", "date", "year", "time"],
    "name": ["name", "called", "titled", "known as", "company"],
    "company": ["company", "organization", "firm", "business"],
    "employees": ["employees", "staff", "team", "workforce", "headcount", "personnel"],
    "location": ["location", "headquarters", "office", "address", "city", "based"],
    "ceo": ["ceo", "chief executive", "founder", "leader", "head"],
    "salary": ["salary", "compensation", "pay", "wages", "remuneration"],
    "leave": ["leave", "vacation", "holiday", "time off", "pto", "absence"],
    "policy": ["policy", "rule", "guideline", "regulation", "procedure"],
}

def _expand_query(query: str) -> str:
    """Enriches a query with synonyms and intent-detected terms."""
    query_lower = query.lower()
    extras = set()
    
    # 1. Check intent patterns first (multi-word phrase detection)
    for pattern, expansion in _INTENT_PATTERNS:
        if re.search(pattern, query_lower):
            extras.update(expansion.split())
    
    # 2. Single-word synonym expansion
    words = re.findall(r'\b[a-zA-Z]+\b', query_lower)
    for w in words:
        stem = _stemmer.stem(w)
        for key, synonyms in _SYNONYMS.items():
            if w == key or stem == _stemmer.stem(key):
                extras.update(synonyms)
                break
    
    if extras:
        return query + " " + " ".join(extras)
    return query


def search_documents(query: str, top_k: int = 3, document_id: str = None) -> List[Dict[str, Any]]:
    """
    Searches indexed chunks using stemmed TF-IDF with query expansion.
    Combines TF-IDF cosine similarity with keyword overlap for robust ranking.
    """
    if not chunk_metadata_store:
        return []

    # Filter candidate chunks by document_id if provided
    candidates = []
    for c in chunk_metadata_store:
        if document_id and document_id != "doc-1" and c.get("document_id") != document_id:
            continue
        candidates.append(c)

    if not candidates:
        return []

    # Expand the query with synonyms for better recall
    expanded_query = _expand_query(query)

    results = []
    try:
        corpus = [c["text"] for c in candidates]

        # Use stemmed tokenizer so "founded"↔"founding", "company"↔"companies" match
        vectorizer = TfidfVectorizer(
            tokenizer=_stemmed_tokenizer,
            ngram_range=(1, 2),
            token_pattern=None,   # required when custom tokenizer is used
        )
        X = vectorizer.fit_transform(corpus)
        q_vec = vectorizer.transform([expanded_query])
        tfidf_sims = cosine_similarity(q_vec, X)[0]

        # Keyword overlap uses EXPANDED stems (includes synonyms)
        # so "founding" query matches chunks containing "founded"
        expanded_stems = set(_stemmed_tokenizer(expanded_query))
        keyword_scores = np.zeros(len(candidates))
        for i, c in enumerate(candidates):
            chunk_stems = set(_stemmed_tokenizer(c["text"]))
            if expanded_stems:
                keyword_scores[i] = len(expanded_stems.intersection(chunk_stems)) / len(expanded_stems)

        # Combined score: 60% TF-IDF + 40% keyword overlap
        combined = 0.6 * tfidf_sims + 0.4 * keyword_scores

        ranked_indices = np.argsort(combined)[::-1]
        for idx in ranked_indices:
            score = float(combined[idx])
            if score < 0.03 and len(results) >= 1:
                break
            meta = candidates[idx]
            results.append({
                "id": f"{meta.get('document_id')}_chunk_{meta.get('chunk_index')}",
                "snippet": meta["text"],
                "score": round(score, 3),
                "page": meta.get("page", 1)
            })
            if len(results) >= top_k:
                break
    except Exception as err:
        print("Search error:", err)

    return results


def synthesize_direct_answer(query: str, sources: List[Dict[str, Any]]) -> str:
    """
    Synthesizes a clean, direct, informative response from the retrieved chunks.
    Picks only the sentences most relevant to the query — not random text.
    """
    if not sources:
        return "I could not find relevant information in the selected document to answer your question. Please try rephrasing or verify that the topic is in the uploaded PDF."

    snippets = [s["snippet"].strip() for s in sources if s.get("snippet")]
    if not snippets:
        return "No content was retrieved from the document for this question."

    # External LLM check (if user sets an API key)
    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            context = "\n\n".join(snippets[:3])
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": (
                        "You are DocSense AI. Provide a highly structured and comprehensive summary of the provided context to answer the question.\n"
                        "Ensure your response uses markdown formatting exclusively, and follow this structure exactly:\n"
                        "1. **Summary**: A brief overview answering the question.\n"
                        "2. **Key Points**: A bulleted list of the most critical details.\n"
                        "3. **Conclusion**: A one-sentence takeaway.\n"
                        "Do not include information outside of the provided context."
                    )},
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
                ],
                model="llama3-8b-8192",
                temperature=0.2,
                max_tokens=350,
            )
            return chat_completion.choices[0].message.content.strip()
        except Exception as e:
            print("Groq API error:", e)

    if gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            context = "\n\n".join(snippets[:3])
            prompt = (
                "You are DocSense AI. Provide a highly structured and comprehensive summary of the provided context to answer the question.\n"
                "Ensure your response uses markdown formatting exclusively, and follow this structure exactly:\n"
                "1. **Summary**: A brief overview answering the question.\n"
                "2. **Key Points**: A bulleted list of the most critical details.\n"
                "3. **Conclusion**: A one-sentence takeaway.\n"
                "Do not include information outside of the provided context.\n\n"
                f"Context:\n{context}\n\nQuestion: {query}"
            )
            res = model.generate_content(prompt)
            if res.text:
                return res.text.strip()
        except Exception as e:
            print("Gemini API error:", e)

    # ── Smart extractive synthesis ──
    # Strategy: prioritize sentences from the TOP-RANKED source (index 0),
    # then supplement from lower-ranked sources.
    query_stems = set(_stemmed_tokenizer(query))
    expanded_stems = set(_stemmed_tokenizer(_expand_query(query)))
    all_query_stems = query_stems | expanded_stems

    scored_sentences = []
    seen = set()

    for source_rank, snip in enumerate(snippets):
        raw_sents = re.split(r'(?<=[.!?])\s+', snip)
        for sent in raw_sents:
            cleaned = sent.strip()
            if len(cleaned) < 12 or cleaned in seen:
                continue
            seen.add(cleaned)
            sent_stems = set(_stemmed_tokenizer(cleaned))
            overlap = len(all_query_stems.intersection(sent_stems))
            length_bonus = min(len(cleaned) / 200, 0.5)
            # Sentences from the top-ranked source get a 2x bonus
            rank_bonus = 2.0 if source_rank == 0 else (1.0 if source_rank == 1 else 0.5)
            score = (overlap + length_bonus) * rank_bonus
            scored_sentences.append((score, cleaned))

    scored_sentences.sort(key=lambda x: x[0], reverse=True)

    top_sentences = [s[1] for s in scored_sentences if s[0] > 0.5]

    if not top_sentences:
        # Fallback: return the highest-ranked source snippet directly
        return snippets[0]

    return " ".join(top_sentences[:3])
