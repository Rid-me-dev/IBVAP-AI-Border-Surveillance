import { useState } from "react";
import { jsPDF } from "jspdf";
import { DEMO_EVIDENCE } from "../services/demoData";
import type { Evidence } from "../types";

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  VERIFIED: "#22c55e",
  PENDING: "#f59e0b",
  FLAGGED: "#ef4444",
};

/*
  Camera footage used to create an evidence snapshot inside the PDF.
  These files must exist in public/videos.
*/
const CAMERA_VIDEO: Record<string, string> = {
  "CAM-01": "/videos/cam01.mp4",
  "CAM-02": "/videos/cam02.mp4",
  "CAM-03": "/videos/cam03.mp4",
  "CAM-04": "/videos/thermal.mp4",
  "CAM-05": "/videos/nightvision.mp4",
};

/* Creates a fallback evidence image if a video/image cannot be loaded. */
function createFallbackEvidenceImage(ev: Evidence): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const riskColor = RISK_COLORS[ev.risk_level || "LOW"] || "#22d3ee";

  const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
  gradient.addColorStop(0, "#020817");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#155e75";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 1224, 664);

  ctx.fillStyle = "#22d3ee";
  ctx.font = "bold 32px monospace";
  ctx.fillText("IBVAP / EVIDENCE FRAME", 70, 90);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "22px monospace";
  ctx.fillText(`CAMERA: ${ev.camera_id}`, 70, 145);
  ctx.fillText(`SECTOR: ${ev.sector || "N/A"}`, 70, 185);
  ctx.fillText(`TIMESTAMP: ${new Date(ev.timestamp).toLocaleString()}`, 70, 225);

  ctx.strokeStyle = riskColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(220, 170, 520, 420);

  ctx.fillStyle = riskColor;
  ctx.font = "bold 28px monospace";
  ctx.fillText(`${ev.object_class.toUpperCase()} / ${ev.tracking_id}`, 250, 640);

  ctx.font = "bold 26px monospace";
  ctx.fillText(`${ev.risk_level}  |  THREAT ${ev.threat_score}/100`, 760, 90);

  ctx.fillStyle = "#64748b";
  ctx.font = "20px monospace";
  ctx.fillText("SIMULATED EVIDENCE SNAPSHOT", 70, 680);

  return canvas.toDataURL("image/jpeg", 0.9);
}

function captureVideoFrame(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out while loading evidence footage"));
    }, 8000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadeddata = () => {
      // Use an early frame so the same evidence image is reproducible.
      const targetTime =
        Number.isFinite(video.duration) && video.duration > 1 ? 0.8 : 0;

      if (targetTime === 0) {
        drawFrame();
      } else {
        video.currentTime = targetTime;
      }
    };

    video.onseeked = drawFrame;

    video.onerror = () => {
      cleanup();
      reject(new Error("Unable to load evidence footage"));
    };

    function drawFrame() {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is not available");

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        cleanup();
        resolve(imageData);
      } catch (error) {
        cleanup();
        reject(error);
      }
    }

    video.src = videoUrl;
    video.load();
  });
}

function loadEvidenceImage(ev: Evidence): Promise<string> {
  // If a real evidence image is added later, the PDF uses it first.
  if (ev.image_url) {
    return Promise.resolve(ev.image_url);
  }

  const videoUrl = ev.video_url || CAMERA_VIDEO[ev.camera_id];

  if (videoUrl) {
    return captureVideoFrame(videoUrl).catch(() => createFallbackEvidenceImage(ev));
  }

  return Promise.resolve(createFallbackEvidenceImage(ev));
}

export default function EvidenceVault() {
  const [evidence] = useState<Evidence[]>(DEMO_EVIDENCE);
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = evidence.filter(
    (e) =>
      (filterRisk === "ALL" || e.risk_level === filterRisk) &&
      (filterStatus === "ALL" || e.operator_status === filterStatus)
  );

  const downloadMetadata = async (ev: Evidence) => {
    try {
      setDownloadingId(ev.id);

      const imageData = await loadEvidenceImage(ev);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const riskColor = RISK_COLORS[ev.risk_level || "LOW"] || "#22d3ee";
      const statusColor = STATUS_COLORS[ev.operator_status] || "#22c55e";

      // Header
      pdf.setFillColor(2, 13, 31);
      pdf.rect(0, 0, pageWidth, 28, "F");

      pdf.setTextColor(34, 211, 238);
      pdf.setFont("courier", "bold");
      pdf.setFontSize(15);
      pdf.text("IBVAP — BORDER ANALYTICS", 12, 12);

      pdf.setTextColor(226, 232, 240);
      pdf.setFontSize(10);
      pdf.text("EVIDENCE METADATA REPORT", 12, 20);

      // Risk badge
      const rgb = riskColor
        .replace("#", "")
        .match(/.{1,2}/g)
        ?.map((v) => parseInt(v, 16)) || [34, 211, 238];

      pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
      pdf.roundedRect(pageWidth - 42, 9, 30, 9, 1, 1, "F");
      pdf.setTextColor(2, 13, 31);
      pdf.setFontSize(8);
      pdf.text(ev.risk_level || "LOW", pageWidth - 27, 15, {
        align: "center",
      });

      // Evidence image
      const imageY = 35;
      const imageX = 12;
      const imageW = pageWidth - 24;
      const imageH = 92;

      pdf.setDrawColor(8, 145, 178);
      pdf.rect(imageX, imageY, imageW, imageH);
      pdf.addImage(imageData, "JPEG", imageX, imageY, imageW, imageH);

      // Information section
      let y = 138;

      pdf.setTextColor(8, 145, 178);
      pdf.setFont("courier", "bold");
      pdf.setFontSize(10);
      pdf.text("EVIDENCE INFORMATION", 12, y);
      y += 8;

      const rows: Array<[string, string, [number, number, number]]> = [
        ["Evidence ID", ev.evidence_id, [34, 211, 238]],
        ["Incident ID", ev.incident_id, [226, 232, 240]],
        ["Camera", ev.camera_id, [226, 232, 240]],
        ["Sector", ev.sector || "N/A", [226, 232, 240]],
        ["Object / Tracking", `${ev.object_class} / ${ev.tracking_id}`, [226, 232, 240]],
        ["Confidence", `${ev.confidence}%`, [226, 232, 240]],
        ["Threat Score", `${ev.threat_score}/100`, rgb as [number, number, number]],
        [
          "Status",
          ev.operator_status,
          statusColor === "#22c55e"
            ? [34, 197, 94]
            : statusColor === "#f59e0b"
              ? [245, 158, 11]
              : [239, 68, 68],
        ],
        ["Timestamp", new Date(ev.timestamp).toLocaleString(), [148, 163, 184]],
      ];

      rows.forEach(([label, value, color], index) => {
        if (index % 2 === 0) {
          pdf.setFillColor(245, 247, 250);
          pdf.rect(12, y - 5, pageWidth - 24, 8, "F");
        }

        pdf.setTextColor(71, 85, 105);
        pdf.setFont("courier", "normal");
        pdf.setFontSize(8);
        pdf.text(label, 15, y);

        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFont("courier", "bold");
        pdf.text(String(value), pageWidth - 15, y, { align: "right" });

        y += 8;
      });

      // Integrity hash
      y += 5;
      pdf.setTextColor(8, 145, 178);
      pdf.setFont("courier", "bold");
      pdf.setFontSize(9);
      pdf.text("EVIDENCE INTEGRITY HASH", 12, y);
      y += 7;

      pdf.setTextColor(71, 85, 105);
      pdf.setFont("courier", "normal");
      pdf.setFontSize(7);
      const hashLines = pdf.splitTextToSize(ev.hash, pageWidth - 24);
      pdf.text(hashLines, 12, y);

      // Footer
      pdf.setDrawColor(203, 213, 225);
      pdf.line(12, pageHeight - 16, pageWidth - 12, pageHeight - 16);

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(7);
      pdf.text(
        "IBVAP • AI-Based Intelligent Video Analytics Platform • Generated from Evidence Vault",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      pdf.save(`${ev.evidence_id}-metadata-report.pdf`);
    } catch (error) {
      console.error("PDF metadata generation failed:", error);
      alert("Unable to generate the PDF report. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-xs text-cyan-700 tracking-widest">
            IBVAP / EVIDENCE
          </div>

          <h1 className="font-display font-bold text-2xl text-white tracking-wide">
            Evidence Vault
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRisk(r)}
              className={`px-2 py-0.5 font-mono text-xs border transition-colors ${
                filterRisk === r
                  ? "border-cyan-500 text-cyan-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-600"
              }`}
            >
              {r}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-800" />

          {["ALL", "VERIFIED", "PENDING", "FLAGGED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-2 py-0.5 font-mono text-xs border transition-colors ${
                filterStatus === s
                  ? "border-cyan-500 text-cyan-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((ev) => (
          <div key={ev.id} className="glass-panel p-3 space-y-3">
            <div
              className="relative h-32 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0a0f1e, #0f172a)" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-mono text-xs text-cyan-600">
                    {ev.evidence_id}
                  </div>
                  <div className="font-mono text-[10px] text-slate-700 mt-1">
                    EVIDENCE FRAME
                  </div>
                </div>
              </div>

              <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-cyan-700" />
              <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-cyan-700" />
              <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-cyan-700" />
              <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-cyan-700" />

              <div
                className="absolute top-1 right-1 px-1.5 py-0.5 font-mono text-[9px]"
                style={{
                  background: `${RISK_COLORS[ev.risk_level || "LOW"]}20`,
                  color: RISK_COLORS[ev.risk_level || "LOW"],
                  border: `1px solid ${RISK_COLORS[ev.risk_level || "LOW"]}40`,
                }}
              >
                {ev.risk_level}
              </div>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between"><span className="text-slate-600">Evidence ID</span><span className="text-cyan-400">{ev.evidence_id}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Incident</span><span className="text-slate-300">{ev.incident_id}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Camera</span><span className="text-slate-300">{ev.camera_id}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Object</span><span className="text-slate-300">{ev.object_class} / {ev.tracking_id}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Confidence</span><span className="text-slate-300">{ev.confidence}%</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Threat Score</span><span style={{ color: RISK_COLORS[ev.risk_level || "LOW"] }}>{ev.threat_score}/100</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Status</span><span style={{ color: STATUS_COLORS[ev.operator_status] }}>{ev.operator_status}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Timestamp</span><span className="text-slate-500 text-[10px]">{new Date(ev.timestamp).toLocaleString()}</span></div>
            </div>

            <div className="border-t border-slate-800 pt-2">
              <div className="font-mono text-[9px] text-slate-700 break-all">{ev.hash}</div>
            </div>

            {/* Metadata PDF only */}
            <div className="flex">
              <button
                type="button"
                onClick={() => downloadMetadata(ev)}
                disabled={downloadingId === ev.id}
                className="w-full py-1.5 font-mono text-[10px] text-cyan-400 border border-cyan-900 hover:border-cyan-600 disabled:opacity-50 disabled:cursor-wait transition-colors"
              >
                {downloadingId === ev.id
                  ? "GENERATING PDF..."
                  : "DOWNLOAD METADATA PDF"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
