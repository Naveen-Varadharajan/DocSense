import React from "react";
import { NAV_ITEMS } from "../data/initialData";
import { FileText, CheckCircle2, X, Sparkles } from "lucide-react";

export default function Sidebar({
  currentPage,
  onNavigate,
  activeDoc,
  mobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(9, 13, 22, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 35,
          }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        {/* Header Branding */}
        <div className="sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="brand-logo">
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <div className="brand-title">
                DocSense <span className="badge badge-indigo">AI</span>
              </div>
              <p className="brand-subtitle">PDF RAG Intelligence</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="btn-icon"
            style={{ display: "md:none" }}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace Nav</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`nav-button ${active ? "active" : ""}`}
              >
                <div className="nav-button-content">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="badge badge-purple">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Active Document Footer Widget */}
        <div className="sidebar-footer">
          <div className="active-doc-widget">
            <div className="active-doc-header">
              <span>Active Scope</span>
              <span className="status-dot" />
            </div>

            {activeDoc ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <FileText size={15} color="#818cf8" />
                  <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeDoc.name}
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#94a3b8" }}>
                  <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <CheckCircle2 size={11} /> {activeDoc.chunks} chunks
                  </span>
                  <span>Ready</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>No active document</p>
            )}
          </div>

          {/* Dark Mode & Version Row */}
          {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.25rem" }}>
            <button
              onClick={onToggleDarkMode}
              className="btn btn-outline"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem" }}
            >
              {darkMode ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#818cf8" />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace" }}>v2.4.0</span>
          </div> */}
        </div>
      </aside>
    </>
  );
}
