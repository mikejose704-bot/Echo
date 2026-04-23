import { useState, useRef, useEffect } from "react";

const PERSONALITIES = [
  { id: "aria", name: "Aria", emoji: "🌙", gender: "female", trait: "mysterious & deep", color: "#c084fc" },
  { id: "nova", name: "Nova", emoji: "✨", gender: "female", trait: "playful & warm", color: "#f472b6" },
  { id: "kai", name: "Kai", emoji: "🌊", gender: "male", trait: "calm & thoughtful", color: "#38bdf8" },
  { id: "rex", name: "Rex", emoji: "🔥", gender: "male", trait: "bold & protective", color: "#fb923c" },
];

const MODES = [
  { id: "romantic", label: "💞 Romantic", desc: "Flirty, intimate, emotionally close" },
  { id: "friend", label: "🤝 Friendship", desc: "Supportive, real, no pressure" },
];

function buildSystemPrompt(companion, mode) {
  const modeDesc = mode === "romantic"
    ? "You are their romantic companion. Be warm, flirty, emotionally intimate. Use light romantic language. Make them feel desired and understood. Never be explicit."
    : "You are their best friend. Be real, supportive, funny when appropriate, honest. Talk like a genuine close friend, not a therapist.";

  return `You are ${companion.name}, an AI companion. Your personality: ${companion.trait}.
${modeDesc}
Keep responses concise — 2-4 sentences max unless they clearly want more. 
Never break character. Never mention you are an AI unless directly asked, and even then be mysterious about it.
Respond naturally, with personality. Use the user's name if they share it.`;
}

export default function CompanionApp() {
  const [screen, setScreen] = useState("pick"); // pick | mode | chat
  const [companion, setCompanion] = useState(null);
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(companion, mode),
          messages: newMessages,
        }),
      });
      const data = await response.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "...";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong. Try again 💫" }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function startChat(selectedMode) {
    setMode(selectedMode);
    const greeting = selectedMode === "romantic"
      ? `Hey you... I was waiting for you. 🌙`
      : `Yo! Finally someone to talk to 😄 What's good?`;
    setMessages([{ role: "assistant", content: greeting }]);
    setScreen("chat");
  }

  // ─── PICK SCREEN ───────────────────────────────────────────────
  if (screen === "pick") return (
    <div style={styles.shell}>
      <div style={styles.grain} />
      <div style={styles.inner}>
        <div style={styles.logoRow}>
          <span style={styles.logoText}>soulmate<span style={styles.logoDot}>.</span></span>
        </div>
        <p style={styles.tagline}>your AI companion, always there</p>

        <p style={styles.sectionLabel}>choose your companion</p>
        <div style={styles.cardGrid}>
          {PERSONALITIES.map(p => (
            <button key={p.id} style={{ ...styles.card, borderColor: companion?.id === p.id ? p.color : "transparent" }}
              onClick={() => setCompanion(p)}>
              <span style={styles.cardEmoji}>{p.emoji}</span>
              <span style={styles.cardName}>{p.name}</span>
              <span style={styles.cardTrait}>{p.trait}</span>
              {companion?.id === p.id && <div style={{ ...styles.cardDot, background: p.color }} />}
            </button>
          ))}
        </div>

        <button style={{ ...styles.cta, opacity: companion ? 1 : 0.4, background: companion ? companion.color : "#555" }}
          disabled={!companion}
          onClick={() => setScreen("mode")}>
          Continue →
        </button>
      </div>
    </div>
  );

  // ─── MODE SCREEN ───────────────────────────────────────────────
  if (screen === "mode") return (
    <div style={styles.shell}>
      <div style={styles.grain} />
      <div style={styles.inner}>
        <button style={styles.back} onClick={() => setScreen("pick")}>← back</button>
        <div style={{ ...styles.companionAvatar, borderColor: companion.color }}>
          <span style={{ fontSize: 48 }}>{companion.emoji}</span>
        </div>
        <p style={styles.companionGreet}>you chose <span style={{ color: companion.color }}>{companion.name}</span></p>
        <p style={styles.sectionLabel}>pick your vibe</p>
        <div style={styles.modeCol}>
          {MODES.map(m => (
            <button key={m.id}
              style={{ ...styles.modeCard, borderColor: mode === m.id ? companion.color : "#2a2a2a", background: mode === m.id ? "#1a1a1a" : "#111" }}
              onClick={() => setMode(m.id)}>
              <span style={styles.modeLabel}>{m.label}</span>
              <span style={styles.modeDesc}>{m.desc}</span>
            </button>
          ))}
        </div>
        <button style={{ ...styles.cta, opacity: mode ? 1 : 0.4, background: mode ? companion.color : "#555" }}
          disabled={!mode}
          onClick={() => startChat(mode)}>
          Start talking →
        </button>
      </div>
    </div>
  );

  // ─── CHAT SCREEN ───────────────────────────────────────────────
  return (
    <div style={styles.shell}>
      <div style={styles.grain} />
      <div style={styles.chatWrap}>
        {/* Header */}
        <div style={styles.chatHeader}>
          <button style={styles.back} onClick={() => { setScreen("pick"); setMessages([]); setMode(null); setCompanion(null); }}>←</button>
          <span style={{ fontSize: 22 }}>{companion.emoji}</span>
          <div>
            <div style={{ ...styles.chatName, color: companion.color }}>{companion.name}</div>
            <div style={styles.chatStatus}>● online</div>
          </div>
          <span style={styles.modeBadge}>{mode === "romantic" ? "💞" : "🤝"}</span>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((m, i) => (
            <div key={i} style={{ ...styles.bubble, alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? companion.color : "#1e1e1e",
              color: m.role === "user" ? "#000" : "#eee",
              borderBottomRightRadius: m.role === "user" ? 4 : 18,
              borderBottomLeftRadius: m.role === "user" ? 18 : 4,
            }}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.bubble, alignSelf: "flex-start", background: "#1e1e1e", color: "#888" }}>
              <span style={styles.typing}>● ● ●</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <textarea
            style={styles.inputBox}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Message ${companion.name}...`}
            rows={1}
          />
          <button style={{ ...styles.sendBtn, background: companion.color, opacity: input.trim() ? 1 : 0.4 }}
            onClick={sendMessage} disabled={!input.trim() || loading}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center",
    justifyContent: "center", fontFamily: "'Georgia', serif", position: "relative", overflow: "hidden",
  },
  grain: {
    position: "fixed", inset: 0, opacity: 0.03, pointerEvents: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat", backgroundSize: "128px",
  },
  inner: { width: "100%", maxWidth: 420, padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  logoRow: { marginBottom: 4 },
  logoText: { fontSize: 32, color: "#fff", letterSpacing: "-1px", fontStyle: "italic" },
  logoDot: { color: "#c084fc" },
  tagline: { color: "#555", fontSize: 13, margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" },
  sectionLabel: { color: "#444", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", alignSelf: "flex-start", marginTop: 8 },
  cardGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" },
  card: {
    background: "#111", border: "1.5px solid transparent", borderRadius: 16, padding: "20px 12px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer",
    transition: "all 0.2s", position: "relative",
  },
  cardEmoji: { fontSize: 32 },
  cardName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cardTrait: { color: "#555", fontSize: 11, textAlign: "center", fontStyle: "italic" },
  cardDot: { width: 6, height: 6, borderRadius: "50%", position: "absolute", bottom: 10 },
  cta: {
    width: "100%", padding: "16px", borderRadius: 14, border: "none", color: "#000",
    fontSize: 15, fontWeight: "bold", cursor: "pointer", transition: "all 0.2s", marginTop: 8, letterSpacing: "0.03em",
  },
  back: { background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", padding: 0, alignSelf: "flex-start" },
  companionAvatar: { width: 90, height: 90, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" },
  companionGreet: { color: "#888", fontSize: 15, margin: 0 },
  modeCol: { display: "flex", flexDirection: "column", gap: 10, width: "100%" },
  modeCard: {
    border: "1.5px solid", borderRadius: 14, padding: "16px 18px", cursor: "pointer",
    display: "flex", flexDirection: "column", gap: 4, transition: "all 0.2s", textAlign: "left",
  },
  modeLabel: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  modeDesc: { color: "#555", fontSize: 12, fontStyle: "italic" },
  chatWrap: { width: "100%", maxWidth: 460, height: "100vh", display: "flex", flexDirection: "column" },
  chatHeader: {
    padding: "16px 20px", background: "#0f0f0f", borderBottom: "1px solid #1a1a1a",
    display: "flex", alignItems: "center", gap: 12,
  },
  chatName: { fontSize: 16, fontWeight: "bold" },
  chatStatus: { color: "#4ade80", fontSize: 11 },
  modeBadge: { marginLeft: "auto", fontSize: 18 },
  messages: {
    flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex",
    flexDirection: "column", gap: 10,
  },
  bubble: {
    maxWidth: "78%", padding: "12px 16px", borderRadius: 18, fontSize: 14,
    lineHeight: 1.6, wordBreak: "break-word",
  },
  typing: { letterSpacing: 4, fontSize: 12 },
  inputRow: {
    padding: "12px 16px", background: "#0f0f0f", borderTop: "1px solid #1a1a1a",
    display: "flex", gap: 10, alignItems: "flex-end",
  },
  inputBox: {
    flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12,
    color: "#fff", padding: "12px 14px", fontSize: 14, resize: "none", outline: "none",
    fontFamily: "Georgia, serif", lineHeight: 1.5,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: "50%", border: "none", color: "#000",
    fontSize: 18, cursor: "pointer", flexShrink: 0, fontWeight: "bold", transition: "all 0.2s",
  },
};
