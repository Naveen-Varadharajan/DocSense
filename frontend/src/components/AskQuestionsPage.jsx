import React, { useState } from "react";
import { SAMPLE_PROMPTS } from "../data/initialData";
import { answerToPlainText } from "../utils/ragEngine";
import {
  Send,
  User,
  Bot,
  CheckCircle2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Trash2,
  Download,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  RotateCw,
} from "lucide-react";

function AnswerBody({ answer }) {
  if (!answer) return null;

  // Handle plain string answers
  if (typeof answer === "string") {
    return (
      <div className="answer-body">
        <p style={{ lineHeight: "1.65", margin: 0, whiteSpace: "pre-line" }}>{answer}</p>
      </div>
    );
  }

  // Handle { text: "..." } answers
  if (answer.text && !answer.intro && !answer.items) {
    return (
      <div className="answer-body">
        <p style={{ lineHeight: "1.65", margin: 0, whiteSpace: "pre-line" }}>{answer.text}</p>
      </div>
    );
  }

  // Handle structured answers
  return (
    <div className="answer-body">
      {answer.text && <p style={{ lineHeight: "1.65", marginBottom: "0.6rem", whiteSpace: "pre-line" }}>{answer.text}</p>}
      {answer.intro && <p style={{ marginBottom: "0.5rem", lineHeight: "1.6" }}>{answer.intro}</p>}
      {answer.listIntro && <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{answer.listIntro}</p>}
      {answer.items && answer.items.length > 0 && (
        <div className="answer-list">
          {answer.items.map((it, i) => (
            <div key={i} className="answer-item">
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)", marginTop: "0.45rem", flexShrink: 0 }} />
              <div>
                <strong>{it.label}: </strong>
                <span>{it.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {answer.outro && <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>{answer.outro}</p>}
    </div>
  );
}

function ChatMessage({
  msg,
  feedbackState,
  onFeedback,
  onCopy,
  copied,
  onRegenerate,
}) {
  if (msg.role === "user") {
    return (
      <div className="message-row user">
        <div className="user-bubble">
          <p>{msg.text}</p>
          <span style={{ fontSize: "0.65rem", opacity: 0.8, display: "block", textAlign: "right", marginTop: "0.25rem", fontFamily: "monospace" }}>
            {msg.time}
          </span>
        </div>
        <div className="btn-icon" style={{ backgroundColor: "var(--bg-surface)", borderRadius: "50%" }}>
          <User size={16} />
        </div>
      </div>
    );
  }

  const chunksCount = msg.chunksAnalyzed ?? (msg.sources ? msg.sources.length : 0);

  return (
    <div className="message-row">
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-md)",
          background: "var(--gradient-brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          flexShrink: 0,
        }}
      >
        <Bot size={18} />
      </div>

      <div style={{ flex: 1, maxWidth: "780px" }}>
        <div className="assistant-card">
          <AnswerBody answer={msg.answer} />

          {/* Action Footer: Number of chunks analyzed and actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "var(--emerald)", fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>{chunksCount} chunk{chunksCount !== 1 ? "s" : ""} analyzed</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
              <span style={{ fontSize: "0.65rem", color: "var(--text-subtle)", fontFamily: "monospace" }}>{msg.time}</span>

              <button onClick={() => onCopy(msg.id, answerToPlainText(msg.answer))} className="btn-icon" title="Copy text">
                {copied ? <Check size={14} color="var(--emerald)" /> : <Copy size={14} />}
              </button>

              <button onClick={() => onFeedback(msg.id, "up")} className="btn-icon" style={{ color: feedbackState === "up" ? "var(--primary)" : "inherit" }} title="Helpful answer">
                <ThumbsUp size={14} />
              </button>

              <button onClick={() => onFeedback(msg.id, "down")} className="btn-icon" style={{ color: feedbackState === "down" ? "var(--rose)" : "inherit" }} title="Not helpful">
                <ThumbsDown size={14} />
              </button>

              {onRegenerate && (
                <button onClick={() => onRegenerate(msg.promptText)} className="btn-icon" title="Regenerate">
                  <RotateCw size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AskQuestionsPage({
  messages,
  thinking,
  input,
  setInput,
  onSend,
  feedback,
  onFeedback,
  copiedId,
  onCopy,
  showSources,
  chunkCount,
  activeDoc,
  bottomRef,
  onClearChat,
  onExportChat,
}) {
  return (
    <div className="chat-workspace">
      {/* Top Controls Toolbar */}
      <div className="chat-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={14} color="#6366f1" />
          <span>RAG Search Engine Active • Scope: <strong>{activeDoc?.name || "Sample.pdf"}</strong></span>
        </div>

        {messages.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onExportChat} className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}>
              <Download size={13} /> Export
            </button>
            <button onClick={onClearChat} className="btn btn-danger" style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}>
              <Trash2 size={13} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="messages-scroll-area">
        {messages.length === 0 ? (
          <div className="hero-starter">
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "var(--radius-lg)",
                background: "var(--gradient-brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
                color: "#ffffff",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Bot size={30} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Ask anything from your PDF</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Target document: <strong>{activeDoc?.name || "Sample.pdf"}</strong> ({activeDoc?.chunks || 10} indexed chunks).
            </p>

            {/* Prompt Cards */}
            <div className="prompt-grid">
              {SAMPLE_PROMPTS.map((prompt, i) => (
                <div key={i} onClick={() => onSend(prompt.query)} className="prompt-card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{prompt.icon}</span>
                    <span className="badge badge-purple">{prompt.tag}</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)" }}>{prompt.title}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {prompt.query}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              feedbackState={feedback[msg.id]}
              onFeedback={onFeedback}
              onCopy={onCopy}
              copied={copiedId === msg.id}
              onRegenerate={msg.role === "assistant" ? () => onSend(msg.promptText || "Regenerate answer") : null}
              showSourcesSetting={showSources}
              chunkCountSetting={chunkCount}
            />
          ))
        )}

        {thinking && (
          <div className="message-row">
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", background: "var(--gradient-brand)", display: "flex", alignItems: "center", justifyCenter: "center", color: "#ffffff" }}>
              <Bot size={18} />
            </div>
            <div className="assistant-card" style={{ padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Searching vector database & synthesizing response...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question about ${activeDoc?.name || "your PDF"}...`}
            className="input-text"
          />
          <button type="submit" disabled={!input.trim() || thinking} className="btn btn-primary">
            <Send size={14} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
