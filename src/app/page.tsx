"use client";

import { useEffect, useState, useCallback } from "react";

type JarName = "caveats" | "good_girl";
type UserName = "Lily" | "Jana" | "Vaidehi";
const USERS: UserName[] = ["Lily", "Jana", "Vaidehi"];

type Suggestion = {
  id: number;
  jar_name: JarName;
  suggestion: string;
  suggested_by: string | null;
  created_at: string;
  voters: string[];
};

const JAR_CONFIG: Record<JarName, { label: string; color: string; fillColor: string }> = {
  caveats: {
    label: "Caveats / Apology Jar",
    color: "var(--accent-pink)",
    fillColor: "rgba(232, 160, 191, 0.5)",
  },
  good_girl: {
    label: "Good Girl Jar",
    color: "var(--accent-green)",
    fillColor: "rgba(168, 213, 186, 0.5)",
  },
};

function Jar({
  name,
  total,
  onAdd,
  onReset,
}: {
  name: JarName;
  total: number;
  onAdd: () => void;
  onReset: () => void;
}) {
  const config = JAR_CONFIG[name];
  const maxFill = 100;
  const fillPercent = Math.min((total / maxFill) * 100, 100);
  const [animate, setAnimate] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const handleClick = () => {
    setAnimate(true);
    onAdd();
    setTimeout(() => setAnimate(false), 400);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2
        className="text-lg font-medium tracking-wide"
        style={{ color: config.color }}
      >
        {config.label}
      </h2>

      <button
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMouseMove}
        className="relative cursor-pointer transition-transform active:scale-95 focus:outline-none"
        aria-label={`Add $1 to ${config.label}`}
      >
        {/* Lid */}
        <div
          className="relative mx-auto"
          style={{
            width: "120px",
            height: "20px",
            background: `linear-gradient(to bottom, var(--jar-lid), var(--jar-lid-dark))`,
            borderRadius: "6px 6px 2px 2px",
          }}
        />
        <div
          className="relative mx-auto"
          style={{
            width: "110px",
            height: "8px",
            background: "var(--jar-lid-dark)",
            borderRadius: "0 0 2px 2px",
            marginTop: "-1px",
          }}
        />

        {/* Jar body */}
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            width: "130px",
            height: "220px",
            background: "var(--jar-glass)",
            border: "2px solid var(--jar-glass-border)",
            borderRadius: "8px 8px 24px 24px",
            marginTop: "2px",
          }}
        >
          {/* Glass shine */}
          <div
            className="absolute top-0 left-2 w-3 h-full opacity-30 rounded-full"
            style={{
              background: "linear-gradient(to right, white, transparent)",
            }}
          />

          {/* Fill level */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
            style={{
              height: `${fillPercent}%`,
              background: config.fillColor,
              borderRadius: "0 0 22px 22px",
            }}
          >
            {total > 0 && (
              <div className="absolute inset-0 overflow-hidden opacity-40">
                {Array.from({ length: Math.min(total, 30) }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${12 + (i % 3) * 4}px`,
                      height: `${12 + (i % 3) * 4}px`,
                      background: config.color,
                      left: `${10 + ((i * 37) % 80)}%`,
                      bottom: `${5 + ((i * 23) % 85)}%`,
                      transform: `translate(-50%, 50%) rotate(${i * 45}deg)`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {animate && (
            <div
              className="absolute text-2xl font-bold animate-bounce"
              style={{
                color: config.color,
                left: "50%",
                top: "30%",
                transform: "translateX(-50%)",
              }}
            >
              +$1
            </div>
          )}

        </div>

        {/* Cursor-following tooltip */}
        <div
          className="absolute pointer-events-none transition-opacity duration-150"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: "translate(14px, 14px)",
            opacity: hovering && !animate ? 1 : 0,
            zIndex: 20,
          }}
        >
          <div
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
            style={{
              background: "var(--bg)",
              color: config.color,
              border: `1px solid ${config.fillColor}`,
              boxShadow:
                "0 6px 16px var(--shadow), 0 2px 4px var(--shadow)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            + click to add $1
          </div>
        </div>
      </button>

      <div className="text-center">
        <span
          className="text-3xl font-semibold tabular-nums"
          style={{ color: config.color }}
        >
          ${total}
        </span>
      </div>

      <button
        onClick={(e) => {
          if (e.detail === 3) onReset();
        }}
        className="text-xs opacity-0 hover:opacity-30 transition-opacity cursor-default"
        style={{ color: "var(--text-muted)" }}
        aria-label="Reset jar (triple click)"
      >
        reset
      </button>
    </div>
  );
}

function SuggestionsPanel({
  jar,
  suggestions,
  activeUser,
  onAdd,
  onToggleVote,
}: {
  jar: JarName;
  suggestions: Suggestion[];
  activeUser: UserName | null;
  onAdd: (text: string) => Promise<void>;
  onToggleVote: (id: number) => Promise<void>;
}) {
  const config = JAR_CONFIG[jar];
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...suggestions].sort((a, b) => {
    if (b.voters.length !== a.voters.length) {
      return b.voters.length - a.voters.length;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    const text = draft.trim();
    if (!text) return;
    if (text.length > 80) {
      setError("Keep it under 80 characters");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(text);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suggest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="w-[280px] rounded-2xl px-4 py-4 flex flex-col gap-3"
      style={{
        background: "var(--bg-secondary)",
        border: `1px solid ${config.fillColor}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] uppercase tracking-wider font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          Where should it go?
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{ color: "var(--text-muted)" }}
        >
          {sorted.length} {sorted.length === 1 ? "idea" : "ideas"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div
          className="text-xs italic py-2"
          style={{ color: "var(--text-muted)" }}
        >
          No suggestions yet. Be first.
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((s) => {
            const voted = activeUser ? s.voters.includes(activeUser) : false;
            return (
              <li
                key={s.id}
                className="flex items-start gap-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => activeUser && onToggleVote(s.id)}
                  disabled={!activeUser}
                  aria-label={voted ? "Remove your vote" : "Vote for this"}
                  className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums transition-all"
                  style={{
                    background: voted ? config.color : "var(--bg)",
                    color: voted ? "white" : config.color,
                    border: `1px solid ${config.color}`,
                    opacity: activeUser ? 1 : 0.4,
                    cursor: activeUser ? "pointer" : "not-allowed",
                  }}
                >
                  <span>{voted ? "♥" : "♡"}</span>
                  <span>{s.voters.length}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <div
                    className="leading-snug break-words"
                    style={{ color: "var(--text)" }}
                  >
                    {s.suggestion}
                  </div>
                  {s.suggested_by && (
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      — {s.suggested_by}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-1.5 mt-1">
        <input
          type="text"
          value={draft}
          maxLength={80}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          disabled={!activeUser || submitting}
          placeholder={activeUser ? "Suggest a place…" : "Pick a name first"}
          className="flex-1 min-w-0 rounded-full px-3 py-1.5 text-xs outline-none"
          style={{
            background: "var(--bg)",
            color: "var(--text)",
            border: `1px solid ${config.fillColor}`,
          }}
        />
        <button
          type="submit"
          disabled={!activeUser || submitting || !draft.trim()}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
          style={{
            background: config.color,
            color: "white",
            opacity: !activeUser || submitting || !draft.trim() ? 0.4 : 1,
            cursor:
              !activeUser || submitting || !draft.trim()
                ? "not-allowed"
                : "pointer",
          }}
        >
          + add
        </button>
      </form>
      {error && (
        <div className="text-[11px]" style={{ color: config.color }}>
          {error}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
      style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

function UserSelector({
  selected,
  onSelect,
}: {
  selected: UserName | null;
  onSelect: (name: UserName) => void;
}) {
  return (
    <div className="flex gap-3">
      {USERS.map((name) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            background:
              selected === name ? "var(--accent-pink)" : "var(--bg-secondary)",
            color: selected === name ? "white" : "var(--text-muted)",
            boxShadow:
              selected === name ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
            transform: selected === name ? "scale(1.05)" : "scale(1)",
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [totals, setTotals] = useState<Record<JarName, number>>({
    caveats: 0,
    good_girl: 0,
  });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<UserName | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("jarUser") as UserName | null;
    if (stored && USERS.includes(stored)) setActiveUser(stored);
  }, []);

  const fetchTotals = useCallback(async () => {
    const res = await fetch("/api/jars");
    if (res.ok) {
      const data = await res.json();
      setTotals(data);
    }
    setLoading(false);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    const res = await fetch("/api/suggestions");
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    }
  }, []);

  useEffect(() => {
    fetchTotals();
    fetchSuggestions();
  }, [fetchTotals, fetchSuggestions]);

  const selectUser = (name: UserName) => {
    setActiveUser(name);
    localStorage.setItem("jarUser", name);
  };

  const addToJar = async (jar: JarName) => {
    if (!activeUser) return;
    setTotals((prev) => ({ ...prev, [jar]: prev[jar] + 1 }));
    await fetch("/api/jars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jar_name: jar, amount: 1, added_by: activeUser }),
    });
    fetchTotals();
  };

  const addSuggestion = async (jar: JarName, text: string) => {
    if (!activeUser) return;
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jar_name: jar,
        suggestion: text,
        suggested_by: activeUser,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? "Failed to suggest");
    }
    fetchSuggestions();
  };

  const toggleVote = async (id: number) => {
    if (!activeUser) return;
    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const has = s.voters.includes(activeUser);
        return {
          ...s,
          voters: has
            ? s.voters.filter((v) => v !== activeUser)
            : [...s.voters, activeUser],
        };
      })
    );
    const res = await fetch("/api/suggestions/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestion_id: id, voter: activeUser }),
    });
    if (!res.ok) {
      fetchSuggestions();
    }
  };

  const resetJar = async (jar: JarName) => {
    if (!confirm(`Reset the ${JAR_CONFIG[jar].label}?`)) return;
    setTotals((prev) => ({ ...prev, [jar]: 0 }));
    await fetch("/api/jars", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jar_name: jar }),
    });
    fetchTotals();
  };

  if (loading) {
    return (
      <main
        className="flex-1 flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="text-lg" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex-1 flex flex-col items-center justify-center gap-12 px-4 py-12"
      style={{ background: "var(--bg)" }}
    >
      <ThemeToggle />

      <h1
        className="text-2xl font-light tracking-widest uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        The Jars
      </h1>

      <div className="flex flex-col items-center gap-2">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Who did it?
        </span>
        <UserSelector selected={activeUser} onSelect={selectUser} />
      </div>

      <div
        className="flex flex-col sm:flex-row items-center sm:items-start gap-16"
        style={{ opacity: activeUser ? 1 : 0.4 }}
      >
        <div className="flex flex-col items-center gap-6">
          <div style={{ pointerEvents: activeUser ? "auto" : "none" }}>
            <Jar
              name="caveats"
              total={totals.caveats}
              onAdd={() => addToJar("caveats")}
              onReset={() => resetJar("caveats")}
            />
          </div>
          <SuggestionsPanel
            jar="caveats"
            suggestions={suggestions.filter((s) => s.jar_name === "caveats")}
            activeUser={activeUser}
            onAdd={(text) => addSuggestion("caveats", text)}
            onToggleVote={(id) => toggleVote(id)}
          />
        </div>
        <div className="flex flex-col items-center gap-6">
          <div style={{ pointerEvents: activeUser ? "auto" : "none" }}>
            <Jar
              name="good_girl"
              total={totals.good_girl}
              onAdd={() => addToJar("good_girl")}
              onReset={() => resetJar("good_girl")}
            />
          </div>
          <SuggestionsPanel
            jar="good_girl"
            suggestions={suggestions.filter((s) => s.jar_name === "good_girl")}
            activeUser={activeUser}
            onAdd={(text) => addSuggestion("good_girl", text)}
            onToggleVote={(id) => toggleVote(id)}
          />
        </div>
      </div>
    </main>
  );
}
