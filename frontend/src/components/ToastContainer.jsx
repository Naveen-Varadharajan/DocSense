import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function ToastContainer({ toasts, onCloseToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
            {toast.type === "success" && <CheckCircle2 size={16} color="var(--emerald)" />}
            {toast.type === "error" && <AlertCircle size={16} color="var(--rose)" />}
            {toast.type === "info" && <Info size={16} color="#818cf8" />}
            <span style={{ fontSize: "0.75rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {toast.message}
            </span>
          </div>
          <button onClick={() => onCloseToast(toast.id)} className="btn-icon" style={{ padding: "0.2rem", border: "none" }} aria-label="Close notification">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
