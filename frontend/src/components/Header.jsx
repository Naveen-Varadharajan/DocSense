import React, { useState, useRef, useEffect } from "react";
import { Upload, Menu, FileText, ChevronDown, Check } from "lucide-react";

export default function Header({
  meta,
  documents,
  activeDocId,
  onSetActiveDoc,
  onGoUpload,
  onOpenMobileMenu,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeDoc = documents.find((d) => d.id === activeDocId);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header">
      {/* Title & Mobile Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          onClick={onOpenMobileMenu}
          className="btn-icon mobile-menu-toggle"
          aria-label="Open mobile menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="header-title">{meta.title}</h1>
          <p className="header-subtitle">{meta.subtitle}</p>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="header-actions">
        {/* Active Document Selector Dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}
          >
            <FileText size={14} color="#6366f1" />
            <span style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeDoc ? activeDoc.name : "Select Doc"}
            </span>
            <ChevronDown size={14} style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                marginTop: "0.5rem",
                width: "240px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>
                Switch Active Document
              </div>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onSetActiveDoc(doc.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      background: doc.id === activeDocId ? "var(--primary-light)" : "transparent",
                      color: doc.id === activeDocId ? "var(--primary-text)" : "var(--text-main)",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
                      <FileText size={14} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                    </div>
                    {doc.id === activeDocId && <Check size={14} color="#6366f1" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        {/* <button onClick={onToggleDarkMode} className="btn-icon" title="Toggle Dark/Light Mode">
          {darkMode ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
        </button> */}

        {/* Primary Quick Upload Action */}
        <button onClick={onGoUpload} className="btn btn-primary">
          <Upload size={14} /> Upload New PDF
        </button>
      </div>
    </header>
  );
}
