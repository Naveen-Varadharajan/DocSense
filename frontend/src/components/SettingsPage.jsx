import React from "react";
import { AI_MODELS } from "../data/initialData";
import { RotateCcw, Check, Sparkles, Sliders } from "lucide-react";

export default function SettingsPage({
  settings,
  onUpdateSettings,
  onResetSettings,
}) {
  return (
    <div style={{ maxWidth: "850px", margin: "0 auto", padding: "2rem 1.5rem", overflowY: "auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>RAG & Model Configuration</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Fine-tune retrieval parameters, vector search metrics, and AI system prompt.
          </p>
        </div>

        <button onClick={onResetSettings} className="btn btn-outline">
          <RotateCcw size={14} /> Reset Defaults
        </button>
      </div>

      <div className="settings-grid">
        {/* Search Parameters Card */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-color)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "1rem" }}>
            <Sliders size={16} color="var(--primary)" />
            <span>Search & Retrieval Settings</span>
          </div>

          {/* Toggle: Citation Display */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 600 }}>Show source citations</p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Display source document chunks underneath each answer</p>
            </div>
            <button
              onClick={() => onUpdateSettings({ showSources: !settings.showSources })}
              className={`toggle-switch ${settings.showSources ? "active" : ""}`}
              aria-label="Toggle source citations"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {/* Slider: Top-K Chunks */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              <span>Chunks to retrieve (Top-K)</span>
              <span className="badge badge-indigo">{settings.chunkCount} chunks</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={settings.chunkCount}
              onChange={(e) => onUpdateSettings({ chunkCount: Number(e.target.value) })}
              className="range-slider"
            />
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Number of highest-scoring passages passed into prompt context
            </p>
          </div>

          {/* Slider: Similarity Threshold */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              <span>Minimum Similarity Threshold</span>
              <span className="badge badge-indigo">{settings.similarityThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={settings.similarityThreshold}
              onChange={(e) => onUpdateSettings({ similarityThreshold: Number(e.target.value) })}
              className="range-slider"
            />
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Filter out low-scoring chunks below this cosine similarity threshold
            </p>
          </div>

          {/* Distance Metric */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>Vector Distance Metric</label>
            <select
              value={settings.distanceMetric}
              onChange={(e) => onUpdateSettings({ distanceMetric: e.target.value })}
              className="select-box"
            >
              <option value="Cosine Similarity">Cosine Similarity (Recommended)</option>
              <option value="Euclidean Distance">Euclidean Distance (L2)</option>
              <option value="Dot Product">Inner Dot Product</option>
            </select>
          </div>
        </div>

        {/* AI Model & Persona Card */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-color)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "1rem" }}>
            <Sparkles size={16} color="var(--purple)" />
            <span>AI Model & System Persona</span>
          </div>

          {/* AI Model Selector */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Select LLM Provider</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {AI_MODELS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onUpdateSettings({ model: m.id })}
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid",
                    borderColor: settings.model === m.id ? "var(--primary)" : "var(--border-color)",
                    backgroundColor: settings.model === m.id ? "var(--primary-light)" : "var(--bg-input)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{m.name}</span>
                      <span className="badge badge-purple">{m.badge}</span>
                    </div>
                    <p style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{m.description}</p>
                  </div>
                  {settings.model === m.id && <Check size={14} color="var(--primary)" />}
                </div>
              ))}
            </div>
          </div>

          {/* System Prompt Persona */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>System Prompt Instruction</label>
            <textarea
              rows={3}
              value={settings.systemPrompt}
              onChange={(e) => onUpdateSettings({ systemPrompt: e.target.value })}
              className="textarea-box"
              style={{ fontFamily: "monospace" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
