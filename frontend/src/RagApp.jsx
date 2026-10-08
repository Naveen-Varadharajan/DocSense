import React, { useState, useRef, useEffect } from "react";
import "./styles.css";
import { INITIAL_DOCUMENTS, INITIAL_SETTINGS, PAGE_META } from "./data/initialData";
import { sendQuery } from "./services/apiService";
import { formatTime, answerToPlainText } from "./utils/ragEngine";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ToastContainer from "./components/ToastContainer";
import AskQuestionsPage from "./components/AskQuestionsPage";
import UploadPdfPage from "./components/UploadPdfPage";
import DocumentsPage from "./components/DocumentsPage";
import SettingsPage from "./components/SettingsPage";
import AboutPage from "./components/AboutPage";

/**
 * ============================================================================
 * 💡 BEGINNER GUIDE: MAIN APPLICATION CONTROLLER (RagApp.jsx)
 * ============================================================================
 * Welcome! This is the main React component that manages application state:
 *  - `currentPage`: Controls which view is active ("ask", "upload", "documents", "settings", "about")
 *  - `documents`: List of indexed PDFs (saved automatically to browser localStorage)
 *  - `activeDocId`: Currently selected PDF document for RAG search
 *  - `messages`: Chat message history (User prompts + AI responses with citations)
 *  - `settings`: RAG parameters (chunk count, similarity threshold, theme, LLM model)
 *  - `darkMode`: Light vs Dark theme toggle state
 * ============================================================================
 */

export default function RagApp() {
  // Navigation View State
  const [currentPage, setCurrentPage] = useState("ask");

  // Documents Library State (Restored from localStorage if available)
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem("docsense_documents");
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  // Selected Active Document ID State
  const [activeDocId, setActiveDocId] = useState(() => {
    try {
      const saved = localStorage.getItem("docsense_activedoc");
      return saved ? JSON.parse(saved) : "doc-1";
    } catch {
      return "doc-1";
    }
  });

  // RAG Configuration Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("docsense_settings");
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Dark Mode Theme State
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("docsense_darkmode");
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Q&A Chat Messages (Separate per document)
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem("docsense_chats");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const messages = chats[activeDocId] || [];

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const bottomRef = useRef(null);

  // Sync Documents to Browser LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("docsense_documents", JSON.stringify(documents));
    } catch (e) {
      console.error(e);
    }
  }, [documents]);

  // Sync Active Document ID to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("docsense_activedoc", JSON.stringify(activeDocId));
    } catch (e) {
      console.error(e);
    }
  }, [activeDocId]);

  // Sync Settings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("docsense_settings", JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Sync Dark Mode to DOM body class
  useEffect(() => {
    try {
      localStorage.setItem("docsense_darkmode", JSON.stringify(darkMode));
    } catch (e) {
      console.error(e);
    }
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Sync Chats to Browser LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("docsense_chats", JSON.stringify(chats));
    } catch (e) {
      console.error(e);
    }
  }, [chats]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (settings.autoScroll !== false) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, thinking, settings.autoScroll]);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const meta = PAGE_META[currentPage] || PAGE_META.ask;

  // Notification Toast Helper Function
  function addToast(message, type = "info") {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }

  function handleCloseToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  /**
   * 💡 HANDLE SEND QUESTION
   * Sends prompt to RAG service (local or Python backend via sendQuery)
   */
  async function handleSend(overrideQuery) {
    const questionText = typeof overrideQuery === "string" ? overrideQuery : input.trim();
    if (!questionText || thinking) return;

    // 1. Add User Message to Chat
    const userMsg = {
      id: Date.now(),
      role: "user",
      text: questionText,
      time: formatTime(new Date()),
    };

    setChats((prev) => ({
      ...prev,
      [activeDocId]: [...(prev[activeDocId] || []), userMsg]
    }));
    if (typeof overrideQuery !== "string") setInput("");
    setThinking(true);

    try {
      // 2. Fetch RAG response from apiService (Local or Python FastAPI)
      const match = await sendQuery({ question: questionText, activeDoc, settings });

      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        promptText: questionText,
        answer: match.answer,
        sources: match.sources,
        chunksAnalyzed: match.chunks_analyzed ?? (match.sources ? match.sources.length : 0),
        time: formatTime(new Date()),
      };

      setChats((prev) => ({
        ...prev,
        [activeDocId]: [...(prev[activeDocId] || []), assistantMsg]
      }));
    } catch (err) {
      addToast("Failed to fetch response. Check Python backend connection.", "error");
      console.error(err);
    } finally {
      setThinking(false);
    }
  }

  // Record user feedback (Thumbs Up / Down)
  function handleFeedback(id, type) {
    setFeedback((prev) => {
      const newType = prev[id] === type ? null : type;
      if (newType === "up") addToast("Feedback recorded: Helpful answer", "success");
      if (newType === "down") addToast("Feedback recorded: Unhelpful answer", "error");
      return { ...prev, [id]: newType };
    });
  }

  // Copy text snippet to clipboard
  function handleCopy(id, text) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    addToast("Answer copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 1500);
  }

  // Clear chat history
  function handleClearChat() {
    setChats((prev) => ({ ...prev, [activeDocId]: [] }));
    addToast("Chat history cleared", "info");
  }

  // Export conversation as Markdown file download
  function handleExportChat() {
    if (messages.length === 0) return;
    const content = messages
      .map((msg) => {
        if (msg.role === "user") {
          return `### User (${msg.time})\n${msg.text}\n`;
        } else {
          return `### DocSense Assistant (${msg.time})\n${answerToPlainText(msg.answer)}\n`;
        }
      })
      .join("\n---\n\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DocSense_QnA_${activeDoc?.name || "Chat"}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);

    addToast("Exported chat history as Markdown file!", "success");
  }

  // PDF upload completion handler
  function handleUploadComplete(fileDetails) {
    const newDoc = {
      id: fileDetails.id || "doc-" + Date.now(),
      name: fileDetails.name,
      size: fileDetails.size,
      pages: fileDetails.pages,
      chunks: fileDetails.chunks,
      status: "Indexed",
      addedAt: new Date().toISOString().slice(0, 10),
      isDefault: false,
      description: `Uploaded PDF document with ${fileDetails.chunks} vector chunks.`,
      chunksData: [
        { id: 1, page: 1, text: `Passage from ${fileDetails.name}: Section overview and key specifications.` },
        { id: 2, page: 2, text: `Detailed passage from ${fileDetails.name} covering technical parameters and data analysis.` },
        { id: 3, page: Math.min(3, fileDetails.pages), text: `Summary and structural conclusions from ${fileDetails.name}.` },
      ],
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    addToast(`Successfully indexed "${fileDetails.name}"!`, "success");
    setCurrentPage("ask");
  }

  // Set Active document selector
  function handleSetActiveDoc(docId) {
    setActiveDocId(docId);
    const targetDoc = documents.find((d) => d.id === docId);
    if (targetDoc) {
      addToast(`Active document set to "${targetDoc.name}"`, "info");
    }
  }

  // Delete document from library
  function handleDeleteDoc(docId) {
    const targetDoc = documents.find((d) => d.id === docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));

    if (activeDocId === docId) {
      const remaining = documents.filter((d) => d.id !== docId);
      if (remaining.length > 0) {
        setActiveDocId(remaining[0].id);
      }
    }

    addToast(`Removed "${targetDoc?.name || "document"}" from index`, "info");
  }

  // Update configuration settings
  function handleUpdateSettings(newFields) {
    setSettings((prev) => ({ ...prev, ...newFields }));
    addToast("Settings saved", "success");
  }

  // Reset configuration settings to defaults
  function handleResetSettings() {
    setSettings(INITIAL_SETTINGS);
    addToast("Settings reset to defaults", "info");
  }

  return (
    <div className={`app-container ${darkMode ? "dark" : ""}`}>
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onCloseToast={handleCloseToast} />

      {/* Left Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        activeDoc={activeDoc}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Workspace */}
      <main className="main-workspace">
        {/* Top Header Bar */}
        <Header
          meta={meta}
          documents={documents}
          activeDocId={activeDocId}
          onSetActiveDoc={handleSetActiveDoc}
          onGoUpload={() => setCurrentPage("upload")}
          onOpenMobileMenu={() => setMobileOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        />

        {/* Tab Pages Router */}
        {currentPage === "ask" && (
          <AskQuestionsPage
            messages={messages}
            thinking={thinking}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            feedback={feedback}
            onFeedback={handleFeedback}
            copiedId={copiedId}
            onCopy={handleCopy}
            showSources={settings.showSources}
            chunkCount={settings.chunkCount}
            activeDoc={activeDoc}
            bottomRef={bottomRef}
            onClearChat={handleClearChat}
            onExportChat={handleExportChat}
          />
        )}

        {currentPage === "upload" && (
          <UploadPdfPage
            onUploadComplete={handleUploadComplete}
          />
        )}

        {currentPage === "documents" && (
          <DocumentsPage
            documents={documents}
            activeDocId={activeDocId}
            onSetActiveDoc={handleSetActiveDoc}
            onDeleteDoc={handleDeleteDoc}
            onGoUpload={() => setCurrentPage("upload")}
          />
        )}

        {currentPage === "settings" && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSettings={handleResetSettings}
          />
        )}

        {currentPage === "about" && <AboutPage />}
      </main>
    </div>
  );
}
