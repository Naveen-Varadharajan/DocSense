import { MessageSquare, Upload, FolderOpen, Settings as SettingsIcon, Info } from "lucide-react";

/**
 * ---------------------------------------------------------------------------
 * 💡 BEGINNER GUIDE: INITIAL CONFIGURATION & STATIC DATA
 * ---------------------------------------------------------------------------
 * This file contains all starter data for DocSense AI.
 * You can easily customize navigation menu items, page titles, sample prompts,
 * initial documents, and default RAG settings below!
 * ---------------------------------------------------------------------------
 */

// Sidebar navigation items
export const NAV_ITEMS = [
  { id: "ask", label: "Ask Questions", icon: MessageSquare, badge: null },
  { id: "upload", label: "Upload PDF", icon: Upload, badge: "New" },
  { id: "documents", label: "Documents", icon: FolderOpen, badge: null },
  { id: "settings", label: "Settings", icon: SettingsIcon, badge: null },
  { id: "about", label: "About DocSense", icon: Info, badge: null },
];

// Header page titles and subtitles
export const PAGE_META = {
  ask: { title: "Ask Questions", subtitle: "Query indexed PDF documents with semantic context and source citations" },
  upload: { title: "Upload & Index PDF", subtitle: "Extract text, generate embeddings, and add documents to your RAG vector store" },
  documents: { title: "Document Library", subtitle: "Manage indexed PDFs, view status, inspect chunks, and set active search scope" },
  settings: { title: "RAG & Model Settings", subtitle: "Tune retrieval top-K, similarity threshold, AI model provider, and generation prompt" },
  about: { title: "About DocSense AI", subtitle: "Learn how Retrieval-Augmented Generation processes and answers queries" },
};

// Starter prompt suggestion cards shown on the Ask Questions page
export const SAMPLE_PROMPTS = [
  {
    icon: "⚡",
    title: "Data Hazards in Pipelining",
    query: "What are data hazards in processor pipelining?",
    tag: "Architecture",
  },
  {
    icon: "🔄",
    title: "Forwarding vs Stalling",
    query: "Explain the difference between forwarding and stalling in CPU pipelines.",
    tag: "Optimization",
  },
  {
    icon: "🧠",
    title: "How RAG Works",
    query: "How does Retrieval-Augmented Generation chunk and index documents?",
    tag: "AI Spec",
  },
  {
    icon: "📊",
    title: "Document Insights",
    query: "Summarize the key architectural concepts covered in the active document.",
    tag: "Summary",
  },
];

// Preloaded sample documents for demonstration
export const INITIAL_DOCUMENTS = [
  {
    id: "doc-1",
    name: "Computer_Architecture_Pipelining.pdf",
    size: "2.4 MB",
    pages: 18,
    chunks: 12,
    status: "Indexed",
    addedAt: "2026-08-01",
    isDefault: true,
    description: "Detailed analysis of RISC pipeline hazards, RAW/WAR/WAW dependencies, and forwarding paths.",
    chunksData: [
      { id: 1, page: 2, text: "Pipelining overlaps instruction execution across fetch, decode, execute, memory, and write-back stages to maximize throughput." },
      { id: 2, page: 4, text: "Data Hazards occur when an instruction depends on the result of a previous instruction that has not finished execution." },
      { id: 3, page: 5, text: "RAW (Read After Write) hazards happen when an instruction attempts to read a register before a previous instruction writes to it." },
      { id: 4, page: 5, text: "WAR (Write After Read) hazards occur when an instruction writes to a location before a prior instruction reads it." },
      { id: 5, page: 6, text: "WAW (Write After Write) hazards occur when instructions write out of order, corrupting the final state." },
      { id: 6, page: 7, text: "Forwarding (bypassing) routes pipeline outputs directly to input stages without waiting for register writeback." },
      { id: 7, page: 8, text: "Stalling inserts pipeline bubbles, pausing dependent instructions until required operand data is ready." },
      { id: 8, page: 12, text: "Branch prediction minimizes control hazards by predicting instruction flow before branch conditions evaluate." },
    ]
  },
  {
    id: "doc-2",
    name: "RAG_System_Architecture_Guide.pdf",
    size: "4.1 MB",
    pages: 32,
    chunks: 15,
    status: "Indexed",
    addedAt: "2026-08-04",
    isDefault: false,
    description: "Overview of vector databases, chunking strategies, embedding distance metrics, and hybrid search.",
    chunksData: [
      { id: 1, page: 1, text: "Retrieval-Augmented Generation (RAG) grounds LLM outputs in verified document passages." },
      { id: 2, page: 3, text: "Document chunking splits large PDFs into overlapping segments to preserve semantic context across boundaries." },
      { id: 3, page: 7, text: "Vector embeddings transform text passages into high-dimensional vectors for similarity calculation." },
      { id: 4, page: 12, text: "Cosine similarity measures the angle between query vectors and document chunk vectors." },
      { id: 5, page: 18, text: "Top-K retrieval selects the most relevant chunks based on vector distance threshold." },
      { id: 6, page: 25, text: "Prompt synthesis feeds the retrieved chunks into the generative language model as reference context." },
    ]
  },
  {
    id: "doc-3",
    name: "AI_Engineering_Handbook_2026.pdf",
    size: "1.8 MB",
    pages: 14,
    chunks: 9,
    status: "Indexed",
    addedAt: "2026-08-07",
    isDefault: false,
    description: "Best practices for evaluation metrics, hallucination detection, and prompt engineering.",
    chunksData: [
      { id: 1, page: 2, text: "Evaluating RAG systems requires measuring precision, recall, and context faithfulness." },
      { id: 2, page: 5, text: "Hallucination occurs when an LLM generates statements not supported by the retrieved context." },
      { id: 3, page: 9, text: "Re-ranking algorithms order candidate chunks to ensure top sources contain direct answers." },
    ]
  }
];

// Default configuration settings for RAG query processing
export const INITIAL_SETTINGS = {
  showSources: true,
  chunkCount: 3,
  similarityThreshold: 75,
  model: "DocSense Flash 2.0 (Fast)",
  distanceMetric: "Cosine Similarity",
  temperature: 0.2,
  systemPrompt: "You are an expert AI assistant answering questions based strictly on the retrieved document context. Be precise, cite sources, and structure answers clearly.",
  autoScroll: true,
};

// Available LLM models list shown in Settings
export const AI_MODELS = [
  { id: "DocSense Flash 2.0 (Fast)", name: "DocSense Flash 2.0", description: "Ultra-fast response with high factual retrieval precision", badge: "Recommended" },
  { id: "DocSense Pro (Deep Reasoning)", name: "DocSense Pro", description: "Deep reasoning engine suited for complex technical analysis", badge: "Advanced" },
  { id: "GPT-4o Mini (OpenAI)", name: "GPT-4o Mini", description: "Standard multimodal light LLM", badge: "Cloud" },
  { id: "Claude 3.5 Haiku (Anthropic)", name: "Claude 3.5 Haiku", description: "Concise and precise response generation", badge: "Cloud" },
];
