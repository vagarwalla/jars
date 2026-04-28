"use client";

import { useEffect, useState, useCallback } from "react";

type JarName = "caveats" | "good_girl";
type UserName = "Lily" | "Jana" | "Vaidehi";
const USERS: UserName[] = ["Lily", "Jana", "Vaidehi"];

const JAR_CONFIG: Record<JarName, { label: string; color: string; fillColor: string }> = {
  caveats: {
    label: "Caveats / Apology Jar",
    color: "var(--accent-pink)",
    fillColor: "rgba(255, 107, 61, 0.55)",
  },
  good_girl: {
    label: "Good Girl Jar",
    color: "var(--accent-green)",
    fillColor: "rgba(16, 196, 168, 0.55)",
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

  const handleClick = () => {
    setAnimate(true);
    onAdd();
    setTimeout(() => setAnimate(false), 400);
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
        className="relative cursor-pointer transition-transform active:scale-95 focus:outline-none group"
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

        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs whitespace-nowrap"
          style={{ color: "var(--text-muted)" }}
        >
          click to add $1
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
              selected === name ? "var(--accent-violet)" : "var(--bg-secondary)",
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

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

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
        style={{ opacity: activeUser ? 1 : 0.4, pointerEvents: activeUser ? "auto" : "none" }}
      >
        <Jar
          name="caveats"
          total={totals.caveats}
          onAdd={() => addToJar("caveats")}
          onReset={() => resetJar("caveats")}
        />
        <Jar
          name="good_girl"
          total={totals.good_girl}
          onAdd={() => addToJar("good_girl")}
          onReset={() => resetJar("good_girl")}
        />
      </div>
    </main>
  );
}
