/**
 * Local RAG Retrieval Engine
 * Simulates vector search, chunk scoring, and prompt synthesis
 */

export function queryRagEngine(question, activeDoc, settings) {
  const query = question.toLowerCase().trim();
  const words = query.split(/\s+/).filter((w) => w.length > 2);

  // If we have an active document with chunks, search its chunks first
  let matchedChunks = [];
  if (activeDoc && activeDoc.chunksData && activeDoc.chunksData.length > 0) {
    matchedChunks = activeDoc.chunksData
      .map((chunk) => {
        const textLower = chunk.text.toLowerCase();
        let score = 0;
        words.forEach((w) => {
          if (textLower.includes(w)) score += 1;
        });
        return { ...chunk, score };
      })
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  // Fallback / Knowledge Base topics matching
  const hasDataHazards = /hazard|raw|war|waw|pipeline|depend/i.test(query);
  const hasForwarding = /forward|stall|bypass|mitigat|bubble/i.test(query);
  const hasRag = /rag|retrieval|augmented|embedding|vector|chunk|top-k/i.test(query);
  const hasSummary = /summar|insight|overview|key|concept|about/i.test(query);

  let answer;
  let sources = [];

  if (hasDataHazards) {
    answer = {
      intro: `Data hazards occur in processor pipelines when instructions depend on execution results from prior instructions that have not yet completed. In ${activeDoc?.name || "your PDF"}, hazards cause instruction stalls or incorrect pipeline states if left unhandled.`,
      listIntro: "There are three primary types of data dependencies:",
      items: [
        {
          label: "RAW (Read After Write)",
          text: "True dependency where an instruction attempts to read a register before a previous instruction completes its write-back.",
        },
        {
          label: "WAR (Write After Read)",
          text: "Anti-dependency where an instruction writes to a register before an earlier instruction has finished reading it.",
        },
        {
          label: "WAW (Write After Write)",
          text: "Output dependency where two instructions write to the same register out of sequential order.",
        },
      ],
      outro: "These hazards are resolved through data forwarding (bypassing) hardware or by inserting pipeline bubbles (stalling).",
    };

    sources = [
      { chunk: 2, page: 4, score: 94, text: "Data Hazards occur when an instruction depends on the result of a previous instruction that has not finished execution." },
      { chunk: 3, page: 5, score: 91, text: "RAW (Read After Write) hazards happen when an instruction attempts to read a register before a previous instruction writes to it." },
      { chunk: 6, page: 7, score: 88, text: "Forwarding (bypassing) routes pipeline outputs directly to input stages without waiting for register writeback." },
    ];
  } else if (hasForwarding) {
    answer = {
      intro: `Hazard mitigation techniques maintain high instruction throughput while guaranteeing computational accuracy across execution stages.`,
      listIntro: "The primary mitigation strategies retrieved from the document are:",
      items: [
        {
          label: "Forwarding (Data Bypassing)",
          text: "Routes computed ALU/memory values directly from pipeline execution stages to dependent instruction inputs, bypassing the register file writeback delay.",
        },
        {
          label: "Stalling (Pipeline Bubbles)",
          text: "Delays instruction execution by holding PC counters and decode stages for one or more clock cycles until required data becomes ready.",
        },
        {
          label: "Branch Prediction",
          text: "Speculatively fetches instructions past conditional branches to prevent control pipeline stalls.",
        },
      ],
      outro: "Forwarding is preferred because it eliminates wasted cycles, whereas stalling is mandatory for load-use data hazards.",
    };

    sources = [
      { chunk: 6, page: 7, score: 96, text: "Forwarding (bypassing) routes pipeline outputs directly to input stages without waiting for register writeback." },
      { chunk: 7, page: 8, score: 92, text: "Stalling inserts pipeline bubbles, pausing dependent instructions until required operand data is ready." },
      { chunk: 8, page: 12, score: 85, text: "Branch prediction minimizes control hazards by predicting instruction flow before branch conditions evaluate." },
    ];
  } else if (hasRag) {
    answer = {
      intro: `Retrieval-Augmented Generation (RAG) empowers language models to provide grounded, verifiable answers using domain-specific knowledge from your uploaded PDFs.`,
      listIntro: "The indexing and retrieval architecture operates through three core stages:",
      items: [
        {
          label: "Chunking & Vector Embedding",
          text: "Document text is split into semantic chunks (with overlap) and transformed into dense vector representations via embedding models.",
        },
        {
          label: "Vector Similarity Retrieval",
          text: "User queries are mapped to the same vector space, retrieving the top-K nearest chunk vectors via Cosine or Euclidean similarity.",
        },
        {
          label: "Prompt Augmentation & Generation",
          text: "Retrieved text passages are synthesized into the LLM system prompt, directing the model to formulate grounded answers with exact source citations.",
        },
      ],
      outro: "This architecture avoids model hallucinations and enables privacy-preserving document Q&A.",
    };

    sources = [
      { chunk: 1, page: 1, score: 98, text: "Retrieval-Augmented Generation (RAG) grounds LLM outputs in verified document passages." },
      { chunk: 2, page: 3, score: 93, text: "Document chunking splits large PDFs into overlapping segments to preserve semantic context across boundaries." },
      { chunk: 4, page: 12, score: 89, text: "Cosine similarity measures the angle between query vectors and document chunk vectors." },
    ];
  } else if (hasSummary || (matchedChunks.length > 0)) {
    // Construct dynamic answer based on matched chunks from active document
    const topChunks = matchedChunks.length > 0 ? matchedChunks.slice(0, settings?.chunkCount || 3) : activeDoc?.chunksData?.slice(0, 3) || [];
    
    answer = {
      intro: `Based on an index scan of "${activeDoc?.name || "active document"}", here are the most relevant findings related to your query:`,
      listIntro: "Retrieved key insights:",
      items: topChunks.map((c, idx) => ({
        label: `Key Point ${idx + 1} (Page ${c.page || 1})`,
        text: c.text,
      })),
      outro: `Scanned ${activeDoc?.chunks || topChunks.length} chunks with top retrieval confidence.`,
    };

    sources = topChunks.map((c, idx) => ({
      chunk: c.id || idx + 1,
      page: c.page || 1,
      score: Math.max(75, 98 - idx * 5),
      text: c.text,
    }));
  } else {
    answer = {
      intro: `No exact vector match exceeded the minimum similarity threshold (${settings?.similarityThreshold || 75}%) for "${question}" in document "${activeDoc?.name || "active document"}".`,
      listIntro: "You can try asking about one of these topics:",
      items: [
        { label: "Data hazards & pipeline dependencies", text: "Ask about RAW, WAR, or WAW hazards." },
        { label: "Hazard mitigation strategies", text: "Ask how forwarding, bypassing, or stalling works." },
        { label: "RAG & Vector Search", text: "Ask how document chunking and embeddings generate answers." },
        { label: "Document summary", text: "Ask for an overview or key concepts of the active document." },
      ],
      outro: "Or try uploading a new PDF document in the Upload PDF tab.",
    };

    sources = [];
  }

  // Filter sources based on chunkCount setting
  const maxSources = settings?.chunkCount || 3;
  const filteredSources = sources.slice(0, maxSources);

  return { answer, sources: filteredSources };
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function answerToPlainText(answer) {
  if (!answer) return "";
  if (typeof answer === "string") return answer;
  if (answer.text && !answer.items && !answer.intro) return answer.text;

  const parts = [];
  if (answer.text) parts.push(answer.text);
  if (answer.intro) parts.push(answer.intro);
  if (answer.listIntro) parts.push(answer.listIntro);
  if (answer.items) parts.push(...answer.items.map((it) => `• ${it.label}: ${it.text}`));
  if (answer.outro) parts.push(answer.outro);
  return parts.join("\n\n");
}
