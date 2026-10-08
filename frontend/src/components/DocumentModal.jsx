import React from "react";
import { X, FileText, Layers, CheckCircle2 } from "lucide-react";

export default function DocumentModal({ doc, onClose, onSetActive }) {
  if (!doc) return null;

  const chunks = doc.chunksData || [
    { id: 1, page: 1, text: "Sample vector chunk extracted from the primary document section." },
    { id: 2, page: 2, text: "Secondary segment detailing domain specs and configuration guidelines." },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{doc.name}</h3>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                {doc.size || "2.4 MB"} • {doc.chunks || chunks.length} Chunks Indexed
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Chunks Body */}
        <div className="modal-body">
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Indexed Text Segments ({chunks.length} Total)
          </div>

          {chunks.map((chunk, idx) => (
            <div
              key={chunk.id || idx}
              style={{
                padding: "0.75rem",
                backgroundColor: "var(--bg-card-subtle)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                marginBottom: "0.5rem",
                fontSize: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", color: "var(--primary-text)", fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Layers size={12} /> Chunk #{chunk.id || idx + 1}
                </span>
                <span style={{ color: "var(--text-subtle)", fontFamily: "monospace" }}>Page {chunk.page || 1}</span>
              </div>
              <p style={{ color: "var(--text-main)" }}>"{chunk.text}"</p>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-subtle)" }}>Ready for search vector queries</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onClose} className="btn btn-secondary">Close</button>
            <button
              onClick={() => {
                onSetActive(doc.id);
                onClose();
              }}
              className="btn btn-primary"
            >
              <CheckCircle2 size={14} /> Set Active Scope
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
