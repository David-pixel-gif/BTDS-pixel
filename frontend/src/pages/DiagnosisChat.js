import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiImage, FiMessageCircle, FiSend } from "react-icons/fi";
import { apiUrl, getAuthHeader } from "../api";

const MODEL_OPTIONS = [
  { value: "fast", label: "Fast Model", helper: "Quicker response for screening reviews" },
  { value: "deep", label: "Deep Model", helper: "Detailed tumor detection review" },
];

const allowedRoles = ["Doctor", "Radiologist", "Admin"];

function formatConfidence(value) {
  return typeof value === "number" ? `${value.toFixed(1)}%` : "N/A";
}

function buildSummaryText(result) {
  const parts = [
    `Diagnosis: ${result.diagnosis || "Unknown"}`,
    `Confidence: ${formatConfidence(result.confidence)}`,
    `Model: ${result.model_used || result.model_type || "Unknown"}`,
  ];
  if (result.tumor_type) {
    parts.push(`Tumor type: ${result.tumor_type}`);
  }
  if (result.recommendations) {
    parts.push(`Recommendation: ${result.recommendations}`);
  }
  return parts.join("\n");
}

export default function DiagnosisChat() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [selectedModel, setSelectedModel] = useState("deep");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "bot",
      kind: "text",
      text: "Diagnosis chat is ready. Select a model, upload the scan, and send it for AI review.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [latestReport, setLatestReport] = useState(null);
  const [status, setStatus] = useState("Standby");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    setUserRole(role);
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setSelectedPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const activeModel = useMemo(
    () => MODEL_OPTIONS.find((option) => option.value === selectedModel) || MODEL_OPTIONS[0],
    [selectedModel]
  );

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] || null);
  };

  const appendMessage = (message) => {
    setMessages((current) => [...current, { ...message, id: `${Date.now()}-${Math.random()}` }]);
  };

  const handleSend = async () => {
    if (!selectedFile || isSubmitting) {
      return;
    }

    const fileToSend = selectedFile;
    const previewToSend = selectedPreview;

    appendMessage({
      type: "user",
      kind: "scan",
      text: `Uploaded ${fileToSend.name}`,
      image: previewToSend,
      meta: `${activeModel.label} selected`,
      timestamp: new Date().toISOString(),
    });

    appendMessage({
      type: "bot",
      kind: "status",
      text: `Analyzing scan with ${activeModel.label}.`,
      timestamp: new Date().toISOString(),
    });

    setIsSubmitting(true);
    setStatus(`Running ${activeModel.label}`);
    setSelectedFile(null);

    const formData = new FormData();
    formData.append("file", fileToSend);
    formData.append("model_type", selectedModel);

    try {
      const response = await fetch(apiUrl("/diagnose"), {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });

      const data = await response.json();
      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Diagnosis failed.");
      }

      setLatestReport(data);
      setStatus("Diagnosis complete");
      appendMessage({
        type: "bot",
        kind: "report",
        text: buildSummaryText(data),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setStatus("Review required");
      appendMessage({
        type: "bot",
        kind: "error",
        text: error.message || "Diagnosis failed.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userRole && !allowedRoles.includes(userRole)) {
    return (
      <div style={{ padding: 32 }}>
        <h2>Access Denied</h2>
        <p>This diagnosis chat is restricted to medical professionals.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .chat-page {
          min-height: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) 360px;
          gap: 24px;
          align-items: start;
        }
        .chat-shell, .chat-sidecard {
          border-radius: 28px;
          background: #f6fbf8;
          border: 1px solid rgba(167, 196, 183, 0.42);
          box-shadow: 0 24px 50px rgba(21, 63, 53, 0.08);
          overflow: hidden;
        }
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 22px;
          background: linear-gradient(135deg, #0f6a5b 0%, #0a574a 100%);
          color: #f5fffb;
        }
        .chat-header-main {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .chat-avatar {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.14);
          font-size: 1.2rem;
        }
        .chat-header-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
        }
        .chat-header-copy {
          margin: 4px 0 0;
          color: rgba(236, 255, 248, 0.86);
          font-size: 0.9rem;
        }
        .chat-status-pill {
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          font-weight: 700;
          font-size: 0.82rem;
        }
        .chat-model-row {
          display: flex;
          gap: 10px;
          padding: 18px 20px 0;
          flex-wrap: wrap;
          background: linear-gradient(180deg, #f6fbf8 0%, #eff7f3 100%);
        }
        .chat-model-chip {
          border: 1px solid rgba(103, 145, 129, 0.28);
          background: #ffffff;
          border-radius: 16px;
          padding: 12px 14px;
          cursor: pointer;
          min-width: 188px;
          text-align: left;
        }
        .chat-model-chip.is-active {
          background: #dff4eb;
          border-color: #0f6a5b;
        }
        .chat-model-chip strong {
          display: block;
          color: #17382e;
        }
        .chat-model-chip span {
          display: block;
          margin-top: 4px;
          color: #5d746a;
          font-size: 0.82rem;
        }
        .chat-thread {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px 20px 20px;
          min-height: 520px;
          max-height: 66vh;
          overflow-y: auto;
          background:
            radial-gradient(circle at top left, rgba(15, 106, 91, 0.08), transparent 26%),
            linear-gradient(180deg, #eef7f2 0%, #e8f3ee 100%);
        }
        .chat-bubble-row {
          display: flex;
        }
        .chat-bubble-row.user {
          justify-content: flex-end;
        }
        .chat-bubble {
          max-width: min(78%, 560px);
          border-radius: 20px;
          padding: 14px 16px;
          white-space: pre-wrap;
          line-height: 1.65;
          box-shadow: 0 10px 28px rgba(17, 58, 47, 0.08);
        }
        .chat-bubble.bot {
          background: #ffffff;
          border-top-left-radius: 8px;
          color: #18362e;
        }
        .chat-bubble.user {
          background: #d8f4e8;
          border-top-right-radius: 8px;
          color: #10372b;
        }
        .chat-bubble-meta {
          margin-top: 10px;
          font-size: 0.78rem;
          color: #6a7f77;
        }
        .chat-upload-preview {
          width: 220px;
          max-width: 100%;
          margin-top: 10px;
          border-radius: 16px;
          display: block;
          border: 1px solid rgba(120, 157, 143, 0.24);
        }
        .chat-composer {
          padding: 16px 18px 18px;
          background: #f6fbf8;
          border-top: 1px solid rgba(167, 196, 183, 0.35);
        }
        .chat-composer-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid rgba(167, 196, 183, 0.35);
        }
        .chat-upload-button {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          border: none;
          background: #e5f4ee;
          color: #0f6a5b;
          display: grid;
          place-items: center;
          overflow: hidden;
          cursor: pointer;
        }
        .chat-upload-button input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        .chat-selected-file {
          flex: 1;
          min-width: 0;
        }
        .chat-selected-file strong {
          display: block;
          color: #15362c;
        }
        .chat-selected-file span {
          display: block;
          margin-top: 4px;
          color: #698178;
          font-size: 0.82rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .chat-send-button {
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #0f6a5b 0%, #09493f 100%);
          color: #ffffff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .chat-send-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .chat-sidecard {
          padding: 22px;
          display: grid;
          gap: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #f5faf7 100%);
        }
        .chat-sidecard h3 {
          margin: 0 0 6px;
          color: #16352d;
        }
        .chat-sidecard p {
          margin: 0;
          color: #61786f;
          line-height: 1.7;
        }
        .chat-summary-grid {
          display: grid;
          gap: 12px;
        }
        .chat-summary-item {
          padding: 14px 15px;
          border-radius: 18px;
          background: #f4faf7;
          border: 1px solid rgba(167, 196, 183, 0.35);
        }
        .chat-summary-item span {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6a8078;
        }
        .chat-summary-item strong {
          display: block;
          margin-top: 6px;
          color: #143429;
          font-size: 1rem;
        }
        @media (max-width: 1120px) {
          .chat-page {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="chat-page">
        <section className="chat-shell">
          <div className="chat-header">
            <div className="chat-header-main">
              <div className="chat-avatar">
                <FiMessageCircle />
              </div>
              <div>
                <h2 className="chat-header-title">Diagnosis Chat</h2>
                <p className="chat-header-copy">
                  In-app scan intake for clinical staff. Upload a scan and review the AI summary in chat.
                </p>
              </div>
            </div>
            <div className="chat-status-pill">{status}</div>
          </div>

          <div className="chat-model-row">
            {MODEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chat-model-chip ${selectedModel === option.value ? "is-active" : ""}`}
                onClick={() => setSelectedModel(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.helper}</span>
              </button>
            ))}
          </div>

          <div className="chat-thread">
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble-row ${message.type}`}>
                <div className={`chat-bubble ${message.type}`}>
                  <div>{message.text}</div>
                  {message.image ? (
                    <img className="chat-upload-preview" src={message.image} alt="Uploaded MRI scan" />
                  ) : null}
                  <div className="chat-bubble-meta">
                    {message.meta || new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-composer">
            <div className="chat-composer-box">
              <label className="chat-upload-button" aria-label="Upload MRI scan">
                <FiImage />
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </label>

              <div className="chat-selected-file">
                <strong>{selectedFile ? selectedFile.name : "Attach MRI scan to continue"}</strong>
                <span>
                  {selectedFile
                    ? `${activeModel.label} ready for diagnosis`
                    : "Patient upload bubble, bot analysis bubble, and summary will appear here."}
                </span>
              </div>

              <button
                type="button"
                className="chat-send-button"
                onClick={handleSend}
                disabled={!selectedFile || isSubmitting}
                aria-label="Send scan for diagnosis"
              >
                <FiSend />
              </button>
            </div>
          </div>
        </section>

        <aside className="chat-sidecard">
          <div>
            <h3>Diagnosis Status</h3>
            <p>Selected model: {activeModel.label}</p>
            <p>Workflow state: {status}</p>
          </div>

          <div>
            <h3>Report Summary</h3>
            <div className="chat-summary-grid">
              <div className="chat-summary-item">
                <span>Diagnosis</span>
                <strong>{latestReport?.diagnosis || "Awaiting analysis"}</strong>
              </div>
              <div className="chat-summary-item">
                <span>Confidence</span>
                <strong>{formatConfidence(latestReport?.confidence)}</strong>
              </div>
              <div className="chat-summary-item">
                <span>Tumor Type</span>
                <strong>{latestReport?.tumor_type || "Pending"}</strong>
              </div>
              <div className="chat-summary-item">
                <span>Processing Time</span>
                <strong>
                  {typeof latestReport?.processing_time === "number"
                    ? `${latestReport.processing_time.toFixed(2)}s`
                    : "Pending"}
                </strong>
              </div>
            </div>
          </div>

          <div>
            <h3>Clinical Note</h3>
            <p>
              This in-app chat runs the same secured diagnosis endpoint as the main MRI workflow.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
