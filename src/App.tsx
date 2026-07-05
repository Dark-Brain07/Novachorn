import { useEffect, useState, type FormEvent } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  CONTRACT, EXPLORER, CHAIN_ID, RELEASE_ROUNDS_REQUIRED,
  getCovenant, getClaim, getSettlement, fmtInt, makeWriteClient, writeCovenant,
  type Covenant, type Claim, type Settlement,
} from "./genlayer";
import { MaturityRing, StatusBadge, VerdictPill, Copyable, Field, SkeletonLine } from "./components";
import { VantaGlobe } from "./Vanta";

const DEFAULT_ID = "";

// Examples will appear here once you create them. For now, this is empty since your contract is brand new!
const EXAMPLES: { id: string; label: string }[] = [];

type Loaded = { id: string; cov: Covenant | null; claims: (Claim | null)[]; settle: Settlement | null };

export default function App({ walletEnabled }: { walletEnabled: boolean }) {
  const [id, setId] = useState(DEFAULT_ID);
  const [query, setQuery] = useState(DEFAULT_ID);
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(target: string) {
    if (!target) return;
    setLoading(true); setErr(null);
    try {
      const cov = await getCovenant(target);
      const ms = cov?.terms.milestones ?? [];
      const claims = cov ? await Promise.all(ms.map((m) => getClaim(target, m.id))) : [];
      const settle = cov ? await getSettlement(target) : null;
      setData({ id: target, cov, claims, settle });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(DEFAULT_ID); }, []);

  const onSubmit = (e: FormEvent) => { e.preventDefault(); const t = query.trim(); if (t) { setId(t); load(t); } };

  return (
    <div className="app">
      <VantaGlobe />
      {walletEnabled && <div className="wallet-fixed"><WalletButton /></div>}
      <header className="top">
        <div className="brand">
          <span className="dot" />
          <h1>NovaChron</h1>
          <span className="tag">covenant console</span>
        </div>
        <div className="netline">
          <span>Bradbury · {CHAIN_ID}</span>
          <span aria-hidden>·</span>
          <Copyable text={CONTRACT} short />
          <a href={`${EXPLORER}/contract/${CONTRACT}`} target="_blank" rel="noreferrer">explorer ↗</a>
        </div>
      </header>

      <div className="stack">
        <section className="panel">
          <div className="panel-h">
            <h2>Covenant</h2>
            <form className="inspect" onSubmit={onSubmit} style={{ flex: "0 1 420px" }}>
              <input
                className="in" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="covenant id" aria-label="Covenant id" spellCheck={false}
              />
              <button className="btn" type="submit" disabled={loading}>{loading ? "Loading…" : "Inspect"}</button>
            </form>
          </div>
          <div className="panel-b">
            <div className="examples">
              <span className="eyebrow">EXAMPLES</span>
              {EXAMPLES.map((ex) => (
                <button key={ex.id} onClick={() => { setQuery(ex.id); setId(ex.id); load(ex.id); }}
                  aria-pressed={id === ex.id} className={id === ex.id ? "on" : ""}>{ex.label}</button>
              ))}
            </div>
            {loading ? <LoadingState /> : err ? (
              <div className="fb err">Read failed: {err}</div>
            ) : !data?.cov ? (
              <EmptyState id={id} />
            ) : (
              <CovenantView d={data} />
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h"><h2>Actions</h2>
            <span className="eyebrow">write · chain {CHAIN_ID}</span>
          </div>
          <div className="panel-b">
            {walletEnabled ? <Actions defaultId={id} onDone={() => load(id)} />
              : <p className="note">Wallet writes are disabled. Set <span className="mono">VITE_PRIVY_APP_ID</span> at
                build time to enable <span className="mono">spawn_covenant</span> and <span className="mono">recursive_evaluate</span>.
                Reads above work without a wallet.</p>}
          </div>
        </section>
      </div>

      <footer className="foot">
        <span>Reads via CORS-open RPC · writes via Privy wallet</span>
        <span className="mono">GenLayer · optimistic democracy</span>
      </footer>
    </div>
  );
}

function CovenantView({ d }: { d: Loaded }) {
  const c = d.cov!;
  const ms = c.terms.milestones ?? [];
  const rounds = c.consecutive_release_rounds;
  return (
    <div className="stack">
      <div className="grid-state">
        <MaturityRing value={c.maturity_score} />
        <div className="fields">
          <Field k="Status"><StatusBadge status={c.status} /></Field>
          <Field k="Release progress">
            <span className="mono">{rounds} / {RELEASE_ROUNDS_REQUIRED}</span>
            <span className="note"> consecutive</span>
          </Field>
          <Field k="Last epoch"><span className="mono">{c.last_eval_epoch}</span></Field>
          <Field k="Escrow"><span className="mono">{fmtInt(c.escrow_atto)}</span> <span className="note">atto</span></Field>
        </div>
      </div>

      {c.terms.title && <p className="note">{c.terms.title}</p>}

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>MILESTONES</div>
        <div className="rows">
          {ms.map((m, i) => (
            <div className="row" key={m.id}>
              <div className="txt">{m.text}<div className="eyebrow">{m.id}</div></div>
              <div className="meta">
                {d.claims[i] ? <VerdictPill verdict={d.claims[i]!.verdict} /> : <span className="note">unjudged</span>}
                {d.claims[i] && <span className="mono note">{d.claims[i]!.confidence}/1000</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {c.terms.evidence_sources?.length ? (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>EVIDENCE SOURCES</div>
          <div className="srcs">
            {c.terms.evidence_sources.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer">{u}</a>)}
          </div>
        </div>
      ) : null}

      {d.settle && (
        <div className="settle">
          <StatusBadge status="RELEASED" />
          <span className="mono note">settlement #{d.settle.nonce} · {d.settle.action}</span>
          <span className="note">{d.settle.verdicts.map((v) => `${v.milestone_id}:${v.verdict}`).join(" · ")}</span>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid-state">
      <div className="skel" style={{ width: 132, height: 132, borderRadius: "50%" }} />
      <div className="fields">
        {[0, 1, 2, 3].map((i) => <div key={i}><SkeletonLine w="60%" h={12} /><div style={{ height: 8 }} /><SkeletonLine w="80%" /></div>)}
      </div>
    </div>
  );
}

function EmptyState({ id }: { id: string }) {
  return (
    <div className="empty">
      <h3>No covenant at this id</h3>
      <p>Nothing is stored for <span className="mono">{id}</span> yet. Inspect a known id, or spawn one below.</p>
    </div>
  );
}

function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  if (!ready) return <span className="note">…</span>;
  const addr = wallets[0]?.address ?? (user?.wallet?.address as string | undefined);
  if (!authenticated) return <button className="btn primary" onClick={login}>Connect wallet</button>;
  return (
    <span className="wallet-on">
      {addr && <Copyable text={addr} short />}
      <button className="copy" onClick={logout}>disconnect</button>
    </span>
  );
}

function Actions({ defaultId, onDone }: { defaultId: string; onDone: () => void }) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: string; text: string; tx?: string } | null>(null);

  const [evId, setEvId] = useState(defaultId);
  const [epoch, setEpoch] = useState("1");
  const [spId, setSpId] = useState("");
  const [spText, setSpText] = useState("");
  const [spUrls, setSpUrls] = useState("");
  const [spEscrow, setSpEscrow] = useState("5");

  useEffect(() => { setEvId(defaultId); }, [defaultId]);

  async function run(fn: string, args: (string | number | bigint)[]) {
    setBusy(true); setMsg({ kind: "pend", text: "Awaiting wallet signature…" });
    try {
      const w = wallets[0];
      if (!w) throw new Error("No wallet connected");
      await w.switchChain(CHAIN_ID);
      const provider = await w.getEthereumProvider();
      const tx = await writeCovenant(makeWriteClient(w.address, provider), fn, args);
      setMsg({ kind: "ok", text: `Submitted ${fn}`, tx });
      setTimeout(onDone, 4000);
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <p className="note">Loading wallet…</p>;
  if (!authenticated) {
    return (
      <div className="act">
        <p className="note">Connect a wallet to spawn covenants and trigger evaluation rounds. Writes cost GEN and finalize over minutes.</p>
      </div>
    );
  }

  const spawn = (e: FormEvent) => {
    e.preventDefault();
    const urls = spUrls.split(/[\n,]/).map((u) => u.trim()).filter(Boolean);
    if (!spId.trim() || !spText.trim() || urls.length < 3) {
      setMsg({ kind: "err", text: "Need an id, a milestone, and at least 3 evidence URLs." }); return;
    }
    const terms = JSON.stringify({ milestones: [{ id: "m1", text: spText.trim() }], evidence_sources: urls });
    const atto = BigInt(Math.max(0, Math.floor(Number(spEscrow) || 0))) * 10n ** 18n;
    run("spawn_covenant", [spId.trim(), terms, atto]);
  };

  return (
    <div className="stack">
      <div className="actions">
        <form className="act" onSubmit={(e) => { e.preventDefault(); if (evId.trim()) run("recursive_evaluate", [evId.trim(), Number(epoch) || 0]); }}>
          <div><label className="lbl">Evaluate · covenant</label><input className="in" value={evId} onChange={(e) => setEvId(e.target.value)} placeholder="covenant id" /></div>
          <div><label className="lbl">Epoch</label><input className="in" value={epoch} onChange={(e) => setEpoch(e.target.value)} inputMode="numeric" /></div>
          <button className="btn primary" disabled={busy} type="submit">Run evaluation round</button>
          <p className="note">Validators crawl the evidence and vote on each milestone. A round finalizes in minutes; three RELEASE rounds settle the covenant.</p>
        </form>

        <form className="act" onSubmit={spawn}>
          <div><label className="lbl">Spawn · covenant id</label><input className="in" value={spId} onChange={(e) => setSpId(e.target.value)} placeholder="my-covenant-1" /></div>
          <div><label className="lbl">Milestone</label><input className="in" value={spText} onChange={(e) => setSpText(e.target.value)} placeholder="The dependency has sustained maintainer activity" /></div>
          <div><label className="lbl">Evidence URLs (≥3, comma/newline)</label><input className="in" value={spUrls} onChange={(e) => setSpUrls(e.target.value)} placeholder="https://… , https://… , https://…" /></div>
          <div><label className="lbl">Escrow (GEN, reference)</label><input className="in" value={spEscrow} onChange={(e) => setSpEscrow(e.target.value)} inputMode="numeric" /></div>
          <button className="btn" disabled={busy} type="submit">Spawn covenant</button>
        </form>
      </div>

      {msg && (
        <div className={`fb ${msg.kind}`}>
          {msg.text}
          {msg.tx && <> · <a href={`${EXPLORER}/tx/${msg.tx}`} target="_blank" rel="noreferrer">view tx ↗</a></>}
        </div>
      )}
    </div>
  );
}
