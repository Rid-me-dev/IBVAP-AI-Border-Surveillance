import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEMO_EVIDENCE } from "../services/demoData";
import type { Evidence } from "../types";

const RISK_COLORS: Record<string, string> = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#f59e0b", LOW: "#22c55e" };
const STATUS_COLORS: Record<string, string> = { VERIFIED: "#22c55e", PENDING: "#f59e0b", FLAGGED: "#ef4444" };

function EvidenceDetail({ evidence, onClose, onDownload }: { evidence: Evidence; onClose: () => void; onDownload: (ev: Evidence) => void }) {
  const riskColor = RISK_COLORS[evidence.risk_level || "LOW"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-cyan-900/40" style={{ background: "#020d1f" }}>
          <div><div className="font-mono text-xs text-cyan-600">EVIDENCE DETAIL</div><div className="font-display font-bold text-lg text-white">{evidence.evidence_id}</div></div>
          <button type="button" onClick={onClose} className="font-mono text-xs text-slate-500 hover:text-white">✕ CLOSE</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="relative min-h-[260px] flex items-center justify-center overflow-hidden border border-cyan-900/40" style={{ background: "#07101f" }}>
            {evidence.video_url ? <video src={evidence.video_url} controls autoPlay muted loop playsInline className="w-full max-h-[55vh] object-contain" /> : evidence.image_url ? <img src={evidence.image_url} alt={evidence.evidence_id} className="w-full max-h-[55vh] object-contain" /> : <div className="text-center"><div className="font-mono text-sm text-cyan-400">{evidence.evidence_id}</div><div className="font-mono text-[10px] text-slate-600 mt-2">EVIDENCE PREVIEW / DEMO RECORD</div></div>}
            <span className="absolute top-3 right-3 px-2 py-1 font-mono text-xs" style={{ color: riskColor, border: `1px solid ${riskColor}66`, background: `${riskColor}20` }}>{evidence.risk_level || "LOW"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[["Evidence ID", evidence.evidence_id], ["Incident ID", evidence.incident_id], ["Camera", evidence.camera_id], ["Sector", evidence.sector || "—"], ["Object", evidence.object_class], ["Tracking ID", evidence.tracking_id], ["Confidence", `${evidence.confidence}%`], ["Threat Score", `${evidence.threat_score}/100`], ["Status", evidence.operator_status], ["Timestamp", new Date(evidence.timestamp).toLocaleString()]].map(([k, v]) => <div key={k} className="glass-panel-dark p-3"><div className="font-mono text-[10px] text-slate-600 mb-1">{k}</div><div className="font-mono text-sm text-slate-300 break-all">{v}</div></div>)}
          </div>
          <div className="glass-panel-dark p-3"><div className="font-mono text-[10px] text-cyan-600 mb-1">EVIDENCE INTEGRITY HASH</div><div className="font-mono text-xs text-slate-400 break-all">{evidence.hash}</div></div>
          <div className="flex gap-2 flex-wrap"><button type="button" onClick={() => onDownload(evidence)} className="px-4 py-2 font-mono text-xs text-cyan-400 border border-cyan-900 hover:border-cyan-500">DOWNLOAD METADATA</button><button type="button" onClick={onClose} className="px-4 py-2 font-mono text-xs text-slate-400 border border-slate-700 hover:border-slate-500">CLOSE</button></div>
        </div>
      </div>
    </div>
  );
}

export default function EvidenceVault() {
  const navigate = useNavigate();
  const [evidence] = useState<Evidence[]>(DEMO_EVIDENCE);
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  const filtered = evidence.filter(e => (filterRisk === "ALL" || e.risk_level === filterRisk) && (filterStatus === "ALL" || e.operator_status === filterStatus));

  const downloadMetadata = (ev: Evidence) => {
    const data = JSON.stringify({ ...ev, image_url: undefined, video_url: undefined }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${ev.evidence_id}-metadata.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><div className="font-mono text-xs text-cyan-700 tracking-widest">IBVAP / EVIDENCE</div><h1 className="font-display font-bold text-2xl text-white tracking-wide">Evidence Vault</h1></div>
        <div className="flex items-center gap-2 flex-wrap">{["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(r => <button type="button" key={r} onClick={() => setFilterRisk(r)} className={`px-2 py-0.5 font-mono text-xs border transition-colors ${filterRisk === r ? "border-cyan-500 text-cyan-400" : "border-slate-700 text-slate-500 hover:border-slate-600"}`}>{r}</button>)}<div className="w-px h-4 bg-slate-800" />{["ALL", "VERIFIED", "PENDING", "FLAGGED"].map(s => <button type="button" key={s} onClick={() => setFilterStatus(s)} className={`px-2 py-0.5 font-mono text-xs border transition-colors ${filterStatus === s ? "border-cyan-500 text-cyan-400" : "border-slate-700 text-slate-500 hover:border-slate-600"}`}>{s}</button>)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{filtered.map(ev => {
        const riskColor = RISK_COLORS[ev.risk_level || "LOW"];
        return <div key={ev.id} className="glass-panel p-3 space-y-3"><div className="relative h-32 overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0f1e, #0f172a)" }}><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="font-mono text-xs text-cyan-600">{ev.evidence_id}</div><div className="font-mono text-[10px] text-slate-700 mt-1">EVIDENCE FRAME</div></div></div><div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-cyan-700" /><div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-cyan-700" /><div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-cyan-700" /><div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-cyan-700" /><div className="absolute top-1 right-1 px-1.5 py-0.5 font-mono text-[9px]" style={{ background: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}40` }}>{ev.risk_level}</div></div>
        <div className="space-y-1 text-xs font-mono"><div className="flex justify-between"><span className="text-slate-600">Evidence ID</span><span className="text-cyan-400">{ev.evidence_id}</span></div><div className="flex justify-between"><span className="text-slate-600">Incident</span><span className="text-slate-300">{ev.incident_id}</span></div><div className="flex justify-between"><span className="text-slate-600">Camera</span><span className="text-slate-300">{ev.camera_id}</span></div><div className="flex justify-between"><span className="text-slate-600">Object</span><span className="text-slate-300">{ev.object_class} / {ev.tracking_id}</span></div><div className="flex justify-between"><span className="text-slate-600">Confidence</span><span className="text-slate-300">{ev.confidence}%</span></div><div className="flex justify-between"><span className="text-slate-600">Threat Score</span><span style={{ color: riskColor }}>{ev.threat_score}/100</span></div><div className="flex justify-between"><span className="text-slate-600">Status</span><span style={{ color: STATUS_COLORS[ev.operator_status] }}>{ev.operator_status}</span></div><div className="flex justify-between"><span className="text-slate-600">Timestamp</span><span className="text-slate-500 text-[10px]">{new Date(ev.timestamp).toLocaleString()}</span></div></div>
        <div className="border-t border-slate-800 pt-2"><div className="font-mono text-[9px] text-slate-700 break-all">{ev.hash}</div></div>
        <div className="flex gap-1.5"><button type="button" onClick={() => setSelectedEvidence(ev)} className="flex-1 py-1 font-mono text-[10px] text-cyan-400 border border-cyan-900 hover:border-cyan-600 transition-colors">VIEW</button><button type="button" onClick={() => downloadMetadata(ev)} className="flex-1 py-1 font-mono text-[10px] text-slate-400 border border-slate-700 hover:border-slate-500 transition-colors">METADATA</button><button type="button" onClick={() => navigate(`/incidents?incident=${encodeURIComponent(ev.incident_id)}`)} className="flex-1 py-1 font-mono text-[10px] text-slate-400 border border-slate-700 hover:border-slate-500 transition-colors">INCIDENT</button></div>
        </div>;
      })}</div>
      {selectedEvidence && <EvidenceDetail evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} onDownload={downloadMetadata} />}
    </div>
  );
}
