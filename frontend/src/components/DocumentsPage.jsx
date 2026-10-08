import React, { useState } from "react";
import { FileText, Upload, Search, Trash2, Eye, CheckCircle2, Calendar, HardDrive } from "lucide-react";
import DocumentModal from "./DocumentModal";

export default function DocumentsPage({
  documents,
  activeDocId,
  onSetActiveDoc,
  onDeleteDoc,
  onGoUpload,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocForModal, setSelectedDocForModal] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);

  const filteredDocs = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="docs-container">
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Document Library</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {documents.length} document{documents.length !== 1 ? "s" : ""} indexed in vector store
          </p>
        </div>

        <button onClick={onGoUpload} className="btn btn-primary">
          <Upload size={14} /> Upload New PDF
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: "relative", marginBottom: "1.25rem" }}>
        <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "0.75rem", color: "var(--text-muted)" }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search indexed documents by filename..."
          className="input-text"
          style={{ paddingLeft: "2.5rem" }}
        />
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <FileText size={36} color="var(--text-subtle)" style={{ margin: "0 auto 0.5rem" }} />
          <p style={{ fontWeight: 600 }}>No matching documents found</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Try searching another filename or upload a PDF.</p>
        </div>
      ) : (
        <div>
          {filteredDocs.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div key={doc.id} className={`doc-card ${isActive ? "active" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", overflow: "hidden" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary-text)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h3 style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.name}
                      </h3>
                      {isActive && <span className="badge badge-indigo">Active Scope</span>}
                    </div>
                    <div style={{ display: "flex", gap: "0.85rem", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      <span style={{ color: "var(--emerald)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <CheckCircle2 size={11} /> {doc.chunks} chunks
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <HardDrive size={11} /> {doc.size || "2.4 MB"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Calendar size={11} /> {doc.addedAt || "2026-08-01"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", items: "center", gap: "0.5rem", flexShrink: 0 }}>
                  <button onClick={() => setSelectedDocForModal(doc)} className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "0.35rem 0.65rem" }}>
                    <Eye size={13} /> Chunks
                  </button>

                  {!isActive && (
                    <button onClick={() => onSetActiveDoc(doc.id)} className="btn btn-secondary" style={{ fontSize: "0.7rem", padding: "0.35rem 0.65rem" }}>
                      Set Active
                    </button>
                  )}

                  {!doc.isDefault && (
                    <button onClick={() => setDocToDelete(doc)} className="btn-icon" title="Delete document">
                      <Trash2 size={15} color="var(--rose)" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Chunks Modal */}
      {selectedDocForModal && (
        <DocumentModal
          doc={selectedDocForModal}
          onClose={() => setSelectedDocForModal(null)}
          onSetActive={onSetActiveDoc}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {docToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "380px", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Delete Document?</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Are you sure you want to remove <strong>{docToDelete.name}</strong> from your vector index?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button onClick={() => setDocToDelete(null)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={() => {
                  onDeleteDoc(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
