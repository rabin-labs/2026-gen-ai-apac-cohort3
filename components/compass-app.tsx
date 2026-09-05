"use client";

import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { getFirebaseClient } from "@/lib/firebase-client";
import type { ChatMessage, DecisionSnapshot } from "@/lib/schemas";

type Mode = "explore" | "decide" | "reflect" | "replay";
type SavedDecision = DecisionSnapshot & { id: string; createdAt?: string };

const opening: ChatMessage = {
  role: "assistant",
  content: "What decision is taking up space in your mind today? We can explore it without rushing toward an answer."
};

async function api<T>(user: User, path: string, init?: RequestInit): Promise<T> {
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export function CompassApp() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>("decide");
  const [messages, setMessages] = useState<ChatMessage[]>([opening]);
  const [draft, setDraft] = useState("");
  const [snapshot, setSnapshot] = useState<DecisionSnapshot | null>(null);
  const [saved, setSaved] = useState<SavedDecision[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const { auth } = getFirebaseClient();
      return onAuthStateChanged(auth, async (next) => {
        setUser(next); setChecking(false);
        if (next) {
          try { setSaved((await api<{ decisions: SavedDecision[] }>(next, "/api/decisions")).decisions); }
          catch { setError("Your journal history could not be loaded."); }
        }
      });
    } catch (cause) {
      setChecking(false);
      setError(cause instanceof Error ? cause.message : "Firebase is not configured.");
    }
  }, []);
  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!user || !draft.trim() || busy) return;
    const next = [...messages, { role: "user" as const, content: draft.trim() }];
    setMessages(next); setDraft(""); setBusy(true); setError("");
    try {
      const result = await api<{ reply: string; readyForSnapshot: boolean; snapshot: DecisionSnapshot | null }>(user, "/api/chat", {
        method: "POST", body: JSON.stringify({ mode, messages: next })
      });
      setMessages([...next, { role: "assistant", content: result.reply }]);
      if (result.readyForSnapshot && result.snapshot) setSnapshot(result.snapshot);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Private Compass is unavailable."); }
    finally { setBusy(false); }
  }

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function login() {
    setError("");
    try {
      const { auth, provider } = getFirebaseClient();
      await signInWithPopup(auth, provider);
    } catch (cause) {
      const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
      setError(code === "auth/unauthorized-domain"
        ? "This address is not authorized in Firebase Authentication. Add localhost under Authorized domains."
        : code === "auth/popup-blocked"
          ? "Your browser blocked the Google sign-in popup. Allow popups for localhost and try again."
          : "Google sign-in did not complete. Please try again.");
    }
  }

  async function saveSnapshot() {
    if (!user || !snapshot) return;
    setBusy(true); setError("");
    try {
      const result = await api<{ decision: SavedDecision }>(user, "/api/decisions", {
        method: "POST", body: JSON.stringify({ ...snapshot, conversation: messages })
      });
      setSaved([result.decision, ...saved]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The snapshot could not be saved."); }
    finally { setBusy(false); }
  }

  if (checking) return <main className="login"><div className="login-card skeleton"><div className="login-copy"><p>Opening your private space…</p></div></div></main>;
  if (!user) return (
    <main className="login">
      <section className="login-card">
        <div className="login-copy">
          <div className="brand"><span className="mark">⌁</span><span>Private Compass</span></div>
          <p className="eyebrow" style={{marginTop: 58}}>Think clearly. Learn honestly.</p>
          <h1>Turn decisions into personal wisdom.</h1>
          <p className="lead">A private space to explore difficult choices with Gemini, capture what you expect, and learn from what actually happens.</p>
        </div>
        <div className="login-action">
          <h2>Your journal belongs to you.</h2>
          <p>Every record is isolated to your account. Your identity is verified on the server before any journal data is read or written.</p>
          {error && <div className="error" role="alert" style={{margin:"16px 0 0"}}>{error}</div>}
          <button className="google" onClick={login}>Continue with Google</button>
          <span className="notice">Private by default · Export or delete anytime</span>
        </div>
      </section>
    </main>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="mark">⌁</span><span>Private Compass</span></div>
        <nav className="nav" aria-label="Primary navigation">
          <button className="active">New reflection</button><button>My decisions</button><button>Privacy</button>
        </nav>
        <p className="privacy-note">Your journal text is never written to application logs. Sensitive entries can be excluded from pattern analysis.</p>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">Private decision space</p><h1>What deserves a closer look?</h1><p className="lead">Take your time. Private Compass helps separate facts, assumptions and possibilities.</p></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>{user.photoURL && <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer"/>}<button className="signout" onClick={() => signOut(getFirebaseClient().auth)}>Sign out</button></div>
        </header>
        <div className="grid">
          <section className="card">
            <div className="card-head"><h2>Guided conversation</h2><span className="secure">Private session</span></div>
            <div className="modes">{(["explore","decide","reflect","replay"] as Mode[]).map(item => <button key={item} className={`mode ${mode===item?"selected":""}`} onClick={() => setMode(item)}>{item[0].toUpperCase()+item.slice(1)}</button>)}</div>
            {error && <div className="error" role="alert">{error}</div>}
            <div className="messages" aria-live="polite">{messages.map((message,index) => <div key={index} className={`bubble ${message.role}`}>{message.content}</div>)}{busy && <div className="bubble assistant skeleton">Thinking with care…</div>}<div ref={bottom}/></div>
            <form className="composer" onSubmit={send}><textarea aria-label="Your reflection" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={submitOnEnter} maxLength={8000} placeholder="Share what you are deciding…"/><button className="primary" disabled={busy || !draft.trim()}>Send</button></form>
          </section>
          <aside className="side-stack">
            <section className="card snapshot">
              <p className="eyebrow">Decision snapshot</p>
              {snapshot ? <><h3>{snapshot.title}</h3><p>{snapshot.decision}</p><div className="metric"><span>Confidence</span><strong>{snapshot.confidence}%</strong></div><div className="metric"><span>Assumptions surfaced</span><strong>{snapshot.assumptions.length}</strong></div><div className="metric"><span>Review</span><strong>{snapshot.reviewDate ?? "Not set"}</strong></div><button className="primary" style={{padding:14,width:"100%",marginTop:16}} disabled={busy} onClick={saveSnapshot}>Confirm and save</button></> : <p>Your editable snapshot will appear here once the important facts, assumptions and risks are clear.</p>}
            </section>
            <section className="card"><div className="card-head"><h2>Recent decisions</h2><span>{saved.length}</span></div>{saved.length ? saved.slice(0,3).map(item=><div className="empty" key={item.id}><strong>{item.title}</strong><br/><span>{item.reviewDate ? `Review ${item.reviewDate}` : "No review date"}</span></div>) : <div className="empty">No saved decisions yet. Your first one will appear here.</div>}</section>
          </aside>
        </div>
      </main>
    </div>
  );
}
