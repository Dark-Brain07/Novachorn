import { useState } from "react";
import { SCORE_SCALE } from "./genlayer";

export function MaturityRing({ value, size = 132 }: { value: number; size?: number }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / SCORE_SCALE));
  return (
    <div className="ring">
      <svg width={size} height={size} role="img" aria-label={`Maturity ${value} of ${SCORE_SCALE}`}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} />
        <circle
          className="fill" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8}
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
        />
        <text className="num" x="50%" y="49%" textAnchor="middle" dominantBaseline="middle" transform={`rotate(90 ${size / 2} ${size / 2})`}>
          {value}
        </text>
        <text className="num sm" x="50%" y="63%" textAnchor="middle" transform={`rotate(90 ${size / 2} ${size / 2})`}>
          / {SCORE_SCALE}
        </text>
      </svg>
    </div>
  );
}

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: "s-active", RELEASED: "s-released", SLASHED: "s-slashed", DISPUTED: "s-disputed",
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_CLASS[status] ?? "s-active"}`}>
      <span className="bd" />{status}
    </span>
  );
}

export const VerdictPill = ({ verdict }: { verdict: string }) => (
  <span className={`pill ${verdict}`}>{verdict}</span>
);

export function Copyable({ text, short }: { text: string; short?: boolean }) {
  const [done, setDone] = useState(false);
  const label = short ? `${text.slice(0, 6)}…${text.slice(-4)}` : text;
  return (
    <button
      className="copy mono"
      onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); }}
      title="Copy"
    >
      {label} <span aria-hidden style={{ color: done ? "var(--primary)" : "var(--faint)" }}>{done ? "✓" : "⧉"}</span>
    </button>
  );
}

export const Field = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="field"><div className="k">{k}</div><div className="v">{children}</div></div>
);

export const SkeletonLine = ({ w = "100%", h = 16 }: { w?: string; h?: number }) => (
  <div className="skel" style={{ width: w, height: h }} />
);
