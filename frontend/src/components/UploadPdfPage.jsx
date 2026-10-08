import React, { useState, useRef, useEffect } from "react";
import { FileUp, Upload, FileText, CheckCircle2, Sparkles, Layers } from "lucide-react";
import { uploadPdfFile } from "../services/apiService";

export default function UploadPdfPage({ onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileDetails, setFileDetails] = useState(null);
  const intervalRef = useRef(null);

  const steps = [
    { label: "Extracting text structure & pages", icon: FileText },
    { label: "Generating overlapping text chunks", icon: Layers },
    { label: "Computing vector embeddings", icon: Sparkles },
    { label: "Indexing vectors into database", icon: CheckCircle2 },
  ];

  useEffect(() => () => clearInterval(intervalRef.current), []);

  async function startUpload(file) {
    if (!file) return;

    const fileName = typeof file === "string" ? file : file.name;
    const fileSizeMB = typeof file === "object" && file.size ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : "1.5 MB";

    setFileDetails({
      name: fileName,
      size: fileSizeMB,
      pages: 1,
      chunks: 1,
    });

    setUploading(true);
    setProgress(15);
    setCurrentStep(0);

    // Animate progress steps while uploading
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        const next = p + 10;
        if (next >= 25 && next < 50) setCurrentStep(1);
        if (next >= 50 && next < 75) setCurrentStep(2);
        if (next >= 75) setCurrentStep(3);
        return next;
      });
    }, 150);

    try {
      const serverResult = await uploadPdfFile(file);
      clearInterval(intervalRef.current);
      setCurrentStep(3);
      setProgress(100);

      const finalDetails = {
        id: serverResult.id || "doc-" + Date.now(),
        name: serverResult.name || fileName,
        size: serverResult.size || fileSizeMB,
        pages: serverResult.pages || 1,
        chunks: serverResult.chunks || 1,
        status: serverResult.status || "Indexed",
      };

      setFileDetails(finalDetails);

      setTimeout(() => {
        onUploadComplete(finalDetails);
        setUploading(false);
      }, 500);
    } catch (err) {
      clearInterval(intervalRef.current);
      setUploading(false);
      console.error("Upload error:", err);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
  }

  return (
    <div className="upload-container">
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Upload PDF Document</h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Drag and drop your PDF below to parse, chunk, embed, and index into your vector database.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`dropzone ${dragOver ? "active" : ""}`}
      >
        <input
          type="file"
          accept=".pdf"
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          onChange={handleFileSelect}
        />

        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <FileUp size={26} />
        </div>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem" }}>
          Drag and drop your PDF file here
        </h3>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          Supports PDF documents up to 50 MB
        </p>

        <button className="btn btn-primary" pointerEvents="none">
          <Upload size={14} /> Browse Local File
        </button>
      </div>

      {uploading && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{fileDetails?.name}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {fileDetails?.size} • {fileDetails?.pages ? `${fileDetails.pages} pages` : "Processing"}
              </p>
            </div>
            <span className="badge badge-indigo">{progress}%</span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="pipeline-grid">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isDone = progress >= (idx + 1) * 25;
              const isCurrent = progress >= idx * 25 && progress < (idx + 1) * 25;

              return (
                <div
                  key={idx}
                  className="pipeline-step"
                  style={{
                    borderColor: isDone ? "var(--emerald)" : isCurrent ? "var(--primary)" : "var(--border-color)",
                    backgroundColor: isDone ? "var(--emerald-bg)" : isCurrent ? "var(--primary-light)" : "transparent",
                    color: isDone ? "var(--emerald)" : isCurrent ? "var(--primary-text)" : "var(--text-muted)",
                  }}
                >
                  <StepIcon size={14} />
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
