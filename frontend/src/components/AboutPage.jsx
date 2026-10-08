import React from "react";
import { Sparkles, Layers, FileText, Bot, ShieldCheck, Database, User2 } from "lucide-react";

export default function AboutPage() {
  const steps = [
    {
      num: "01",
      title: "PDF Parsing & Ingestion",
      desc: "Raw text content, page boundaries, and formatting structures are parsed directly from your uploaded PDF file.",
      icon: FileText,
    },
    {
      num: "02",
      title: "Semantic Chunk Segmenter",
      desc: "Document text is split into contiguous segments with 50-token overlapping windows to retain context across sentence breaks.",
      icon: Layers,
    },
    {
      num: "03",
      title: "Vector Embedding Index",
      desc: "Each chunk is transformed into a dense 1536-dimensional vector embedding and stored in a high-speed local vector database.",
      icon: Database,
    },
    {
      num: "04",
      title: "Grounded Answer Synthesis",
      desc: "Retrieved chunks are injected into the LLM system prompt, ensuring answers are 100% grounded and verifiable with exact citations.",
      icon: Bot,
    },

  ];

  return (
    <div style={{ maxWidth: "850px", margin: "0 auto", padding: "2rem 1.5rem", overflowY: "auto", width: "100%" }}>
      {/* Hero Header Card */}
      <div className="card" style={{ background: "var(--gradient-brand)", color: "#ffffff", marginBottom: "2rem", border: "none" }}>
        <div className="badge badge-purple" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#ffffff", marginBottom: "0.75rem" }}>
          <Sparkles size={12} /> DocSense RAG Architecture
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Intelligent Document Intelligence & Vector Retrieval
        </h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.9, lineHeight: 1.6 }}>
          DocSense AI bridges PDF document parsing with generative AI. By searching relevant context chunks before generating responses, it delivers grounded answers without hallucination.
        </p>
      </div>

      {/* RAG Workflow Grid */}
      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Layers size={18} color="var(--primary)" /> How Retrieval-Augmented Generation Works
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {steps.map((s, idx) => {
          const StepIcon = s.icon;
          return (
            <div key={idx} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", backgroundColor: "var(--primary-light)", color: "var(--primary-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <StepIcon size={18} />
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-subtle)", fontFamily: "monospace" }}>Step {s.num}</span>
              </div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem" }}>{s.title}</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Tech Stack*/}
      <div className="card">
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={18} color="var(--emerald)" /> Tech Stack & Local Privacy
        </h3>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Built with React 19, Vite 8, and Pure Vanilla CSS. All vector processing runs in browser memory or via Python backend to keep documents safe and private.
        </p>
      </div>
      <br></br>
      {/*Footer Card*/}
      <div className="card">
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <User2 size={18} color="var(--emerald)" /> About My Owner
        </h3>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>Made By Naveen Varadharajan</p>
      </div>

    </div>
  );
}
