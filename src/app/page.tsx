"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

type JarName = "caveats" | "good_girl";

type Suggestion = {
  id: number;
  jar_name: JarName;
  suggestion: string;
  suggested_by: string | null;
  created_at: string;
  voters: string[];
};

type Addition = {
  id: number;
  jar_name: JarName;
  amount: number;
  added_by: string | null;
  created_at: string;
};

function renderWithLinks(text: string): React.ReactNode[] {
  // Matches: https://… , http://… , www.… , and bare domains like
  // foo.com or sub.foo.io/path. Word-bounded so it won't mid-match.
  const regex =
    /\b(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?:\/[^\s]*)?)/gi;
  const trailingPunct = /[.,;:!?)\]}'"]+$/;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    let url = match[0];
    let trailing = "";
    const m = url.match(trailingPunct);
    if (m) {
      trailing = m[0];
      url = url.slice(0, url.length - trailing.length);
    }
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const lower = url.toLowerCase();
    const href =
      lower.startsWith("http://") || lower.startsWith("https://")
        ? url
        : `https://${url}`;
    nodes.push(
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    if (trailing) nodes.push(trailing);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length ? nodes : [text];
}

const JAR_CONFIG: Record<
  JarName,
  {
    label: string;
    color: string;
    fillColor: string;
    destination: string;
  }
> = {
  caveats: {
    label: "Caveats / Apology Jar",
    color: "var(--accent-pink)",
    fillColor: "rgba(255, 107, 61, 0.55)",
    destination: "→ Cringe Charity",
  },
  good_girl: {
    label: "Boss Bitch Jar",
    color: "var(--accent-green)",
    fillColor: "rgba(16, 196, 168, 0.55)",
    destination: "→ Gals Night Out",
  },
};

type BillVariant =
  | "crisp"
  | "halfFolded"
  | "foldedH"
  | "foldedV"
  | "crumpled"
  | "rolled"
  | "tilted"
  | "flipped";

function pickVariant(index: number): BillVariant {
  // Deterministic mapping based on index % 13. Distribution per 13 bills:
  // 4 crisp, 3 halfFolded, 1 foldedH, 1 foldedV, 1 crumpled, 1 rolled, 1 tilted, 1 flipped.
  // Half-folded ("folded in 2") is the most common non-flat variant.
  switch (index % 13) {
    case 1:
      return "halfFolded";
    case 2:
      return "foldedH";
    case 3:
      return "crumpled";
    case 5:
      return "rolled";
    case 6:
      return "halfFolded";
    case 7:
      return "tilted";
    case 8:
      return "halfFolded";
    case 9:
      return "foldedV";
    case 11:
      return "flipped";
    default:
      // 0, 4, 10, 12 → crisp
      return "crisp";
  }
}

// Per-variant vertical stack step (px). Sum over 13:
// 4×2 + 3×2 + 1×2 + 1×1 + 1×2 + 1×4 + 1×2 + 1×2 = 8 + 6 + 2 + 1 + 2 + 4 + 2 + 2 = 27
// → ~208px for 100 bills, fits within the 220px interior with overflow-hidden.
function variantStep(variant: BillVariant): number {
  switch (variant) {
    case "rolled":
      return 4; // tall cylinder protrudes
    case "tilted":
    case "flipped":
      return 2;
    case "foldedV":
      return 1; // narrow + sits low
    case "foldedH":
    case "halfFolded":
    case "crumpled":
    case "crisp":
    default:
      return 2;
  }
}

// Lane-based horizontal anchor: spread bills across left/center/right of the jar.
// Returns the bill's horizontal center offset (px) from the jar's vertical center axis.
// Narrower variants (foldedV, halfFolded, rolled) can extend further without clipping.
function laneAnchor(variant: BillVariant, index: number): number {
  const lane = (index * 11) % 3; // 0=left, 1=center, 2=right
  const isNarrow =
    variant === "foldedV" || variant === "halfFolded" || variant === "rolled";
  const offset = isNarrow ? 25 : 18;
  const base = lane === 0 ? -offset : lane === 1 ? 0 : offset;
  const jitter = ((index * 13) % 9) - 4; // -4..+4 px
  return base + jitter;
}

function BillFace({
  width,
  height,
  compact = false,
}: {
  width: number;
  height: number;
  compact?: boolean;
}) {
  // Inner content of a bill — used by every variant.
  const showLabel = !compact && height >= 26;
  const portraitSize = Math.round(height * 0.55);
  const showSilhouette = !compact && portraitSize >= 12 && width >= 40;
  return (
    <>
      {/* Inner thin frame */}
      <div
        className="absolute"
        style={{
          inset: "2px",
          border: `1px solid var(--bill-border)`,
          borderRadius: "2px",
          opacity: 0.55,
        }}
      />
      {/* Subtle filigree dots */}
      <div
        className="absolute"
        style={{
          top: "1px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "10px",
          height: "1px",
          background: "var(--bill-border)",
          opacity: 0.25,
          borderRadius: "1px",
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: "1px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "10px",
          height: "1px",
          background: "var(--bill-border)",
          opacity: 0.25,
          borderRadius: "1px",
        }}
      />
      {/* Portrait oval, center-left — with George Washington silhouette */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          left: `${Math.round(width * 0.18)}px`,
          top: "50%",
          transform: "translateY(-50%)",
          width: `${portraitSize}px`,
          height: `${portraitSize}px`,
          background: "var(--bill-portrait)",
          border: `1px solid var(--bill-border)`,
          opacity: 0.85,
        }}
      >
        {showSilhouette && (
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: "absolute",
              left: "50%",
              top: "55%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              height: "100%",
              color: "var(--bill-portrait-face)",
              opacity: 0.9,
            }}
            aria-hidden="true"
          >
            {/* Stylized GW profile facing left:
                puffy wig at back/top, pointed nose forward (left),
                jaw + chin, neck/shoulders.  */}
            <path
              d="M7.5 6.2
                 C 8.2 4.4, 10 3.4, 12 3.6
                 C 14.6 3.8, 16.6 5.4, 17.2 7.6
                 C 17.8 7.6, 18.4 8.2, 18.4 9.2
                 C 18.4 10.2, 17.9 10.9, 17.2 11.0
                 C 17.0 11.9, 16.4 12.7, 15.6 13.2
                 L 14.4 13.2
                 C 13.4 13.6, 12.0 13.7, 10.6 13.5
                 C 9.4 14.2, 8.4 14.4, 7.4 14.0
                 C 6.0 13.6, 5.0 12.4, 4.6 11.0
                 C 4.0 10.4, 3.8 9.4, 4.2 8.6
                 C 4.6 7.8, 5.4 7.4, 6.2 7.4
                 C 6.4 6.9, 6.9 6.4, 7.5 6.2 Z
                 M 6.4 14.6
                 C 7.6 15.4, 9.4 15.8, 11.4 15.6
                 C 13.6 15.4, 15.6 14.8, 16.8 14.0
                 C 17.6 14.6, 18.4 15.4, 19.0 16.4
                 C 19.8 17.6, 20.2 19.0, 20.4 20.4
                 L 20.4 22
                 L 3.6 22
                 L 3.6 20.4
                 C 3.8 19.0, 4.2 17.6, 5.0 16.4
                 C 5.4 15.7, 5.9 15.1, 6.4 14.6 Z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>
      {/* Corner numerals */}
      {[
        { top: "2px", left: "4px" },
        { top: "2px", right: "4px" },
        { bottom: "2px", left: "4px" },
        { bottom: "2px", right: "4px" },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute font-bold leading-none"
          style={{
            ...pos,
            fontSize: "6px",
            color: "var(--bill-text)",
            opacity: 0.8,
            fontFamily: "Georgia, serif",
          }}
        >
          1
        </div>
      ))}
      {/* "ONE" tiny caps top */}
      {showLabel && (
        <div
          className="absolute leading-none"
          style={{
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "5px",
            letterSpacing: "1.2px",
            color: "var(--bill-text)",
            opacity: 0.7,
            fontFamily: "Georgia, serif",
            textTransform: "uppercase",
          }}
        >
          One
        </div>
      )}
      {/* Center $1 — offset right of the portrait */}
      <span
        className="absolute font-bold leading-none"
        style={{
          left: `${Math.round(width * 0.62)}px`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: compact ? "10px" : "12px",
          color: "var(--bill-text)",
          fontFamily: "Georgia, serif",
          letterSpacing: "0.5px",
          textShadow: "0 0 1px rgba(255,255,255,0.35)",
        }}
      >
        $1
      </span>
      {/* "ONE DOLLAR" tiny caps bottom */}
      {showLabel && (
        <div
          className="absolute leading-none"
          style={{
            bottom: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "4.5px",
            letterSpacing: "1.4px",
            color: "var(--bill-text)",
            opacity: 0.65,
            fontFamily: "Georgia, serif",
            textTransform: "uppercase",
          }}
        >
          One Dollar
        </div>
      )}
    </>
  );
}

function DollarBill({
  index,
  variant,
  bottom,
  isFalling = false,
}: {
  index: number;
  variant: BillVariant;
  bottom: number;
  isFalling?: boolean;
}) {
  // Deterministic pseudo-random offsets based on index.
  const baseRotation = ((index * 17) % 11) - 5; // -5 to +5 deg
  // Wider lane-based horizontal anchor: bills land in left/center/right of the jar.
  const jitterX = laneAnchor(variant, index);

  // Real US-bill aspect ~2.35:1. Default 75x32 (~2.34:1).
  const baseW = 75;
  const baseH = 32;

  // 3D perspective tilt: every bill leans back slightly (rotateX) and
  // bills in the left/right lanes angle toward the center (rotateY).
  // Determined by lane (matches laneAnchor).
  const lane = (index * 11) % 3;
  const yTilt = lane === 0 ? -3 : lane === 2 ? 3 : 0;
  const tilt3d = `rotateX(2deg) rotateY(${yTilt}deg)`;

  // Atmospheric depth: bills deep in the pile look slightly dimmer.
  const brightness = (0.92 + (index / 100) * 0.08).toFixed(3);

  // Stacking drop shadow — paper-on-paper feel, shared across all variants.
  const stackShadow = "var(--bill-stack-shadow)";

  const sharedShell: React.CSSProperties = {
    position: "absolute",
    left: `calc(50% + ${jitterX}px)`,
    bottom: `${bottom}px`,
    // The transform here is the resting transform; the falling animation
    // overrides it via the `bill-falling` class, ending at the same value.
    transform: `translateX(-50%) ${tilt3d} rotate(${baseRotation}deg)`,
    transformStyle: "preserve-3d",
    zIndex: index,
    filter: `brightness(${brightness})`,
    // CSS vars consumed by the @keyframes bill-drop animation so the
    // end-frame transform matches the static resting transform.
    ["--bill-end-rot" as string]: `${baseRotation}deg`,
    ["--bill-3d-tilt" as string]: tilt3d,
  };

  const billSurface: React.CSSProperties = {
    background: `linear-gradient(135deg, var(--bill-bg) 0%, var(--bill-bg-edge) 100%)`,
    border: `1px solid var(--bill-border)`,
    borderRadius: "3px",
    boxShadow: `${stackShadow}, 0 1px 2px var(--bill-shadow)`,
  };

  const fallingClass = isFalling ? "bill-falling" : "";

  if (variant === "halfFolded") {
    // Bill folded in half (wallet fold) — half the normal width, fold edge on
    // the right side with a thicker dark spine and a small thickness shadow.
    const w = Math.round(baseW / 2) + 2; // ~40px (the visible front face)
    const h = baseH; // 32
    // Pick which side hosts the fold spine deterministically (left or right).
    const foldRight = index % 2 === 0;
    return (
      <div className={fallingClass} style={{ ...sharedShell, width: `${w}px`, height: `${h}px` }}>
        <div
          className="absolute"
          style={{
            inset: 0,
            ...billSurface,
            overflow: "hidden",
            // Extra shadow under the fold edge to hint at the doubled paper thickness.
            boxShadow: `${billSurface.boxShadow}, ${
              foldRight
                ? "inset -3px 0 4px -2px var(--bill-crease)"
                : "inset 3px 0 4px -2px var(--bill-crease)"
            }`,
          }}
        >
          <BillFace width={w} height={h} compact />
          {/* Crisp fold spine on one edge */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              [foldRight ? "right" : "left"]: 0,
              width: "2px",
              background: "var(--bill-crease-strong)",
              boxShadow: foldRight
                ? "-1px 0 0 var(--bill-highlight)"
                : "1px 0 0 var(--bill-highlight)",
            }}
          />
          {/* Thin sliver of the back side peeking out behind the fold */}
          <div
            className="absolute"
            style={{
              [foldRight ? "right" : "left"]: "-2px",
              top: "1px",
              bottom: "1px",
              width: "2px",
              background: "var(--bill-bg-edge)",
              borderRadius: "1px",
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "foldedH") {
    // Folded along the long axis — short, with strong dark crease and shadow on lower half.
    const w = baseW; // 75
    const h = 20;
    return (
      <div className={fallingClass} style={{ ...sharedShell, width: `${w}px`, height: `${h}px` }}>
        <div
          className="absolute"
          style={{
            inset: 0,
            ...billSurface,
            overflow: "hidden",
            boxShadow: `0 2px 3px var(--bill-shadow), inset 0 -2px 3px -1px var(--bill-crease)`,
          }}
        >
          <BillFace width={w} height={h} compact />
          {/* Strong horizontal crease across middle */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "50%",
              height: "2px",
              background: "var(--bill-crease-strong)",
              boxShadow:
                "0 -1px 0 var(--bill-highlight), 0 2px 2px -1px var(--bill-shadow)",
            }}
          />
          {/* Darken lower half to suggest fold underside */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: "50%",
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.18))",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "foldedV") {
    // Folded edge-on — narrow (~half width), strong vertical crease.
    const w = 38;
    const h = baseH; // 32
    return (
      <div className={fallingClass} style={{ ...sharedShell, width: `${w}px`, height: `${h}px` }}>
        <div
          className="absolute"
          style={{
            inset: 0,
            ...billSurface,
            overflow: "hidden",
            boxShadow: `0 1px 3px var(--bill-shadow), inset -2px 0 3px -1px var(--bill-crease)`,
          }}
        >
          <BillFace width={w} height={h} compact />
          {/* Strong vertical crease */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: "50%",
              width: "2px",
              background: "var(--bill-crease-strong)",
              boxShadow:
                "-1px 0 0 var(--bill-highlight), 2px 0 2px -1px var(--bill-shadow)",
            }}
          />
          {/* Darken right half */}
          <div
            className="absolute top-0 bottom-0 right-0"
            style={{
              width: "50%",
              background:
                "linear-gradient(to right, rgba(0,0,0,0.05), rgba(0,0,0,0.18))",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "crumpled") {
    // Same rectangle as crisp, but with subtle wrinkle shadows + highlights.
    const w = baseW;
    const h = baseH;
    return (
      <div className={fallingClass} style={{ ...sharedShell, width: `${w}px`, height: `${h}px` }}>
        <div
          className="absolute"
          style={{
            inset: 0,
            ...billSurface,
            overflow: "hidden",
            boxShadow: `${stackShadow}, inset 0 0 6px var(--bill-highlight), inset 2px 0 4px -2px var(--bill-crease)`,
          }}
        >
          <BillFace width={w} height={h} />
          {/* Subtle wrinkle streaks */}
          <div
            className="absolute"
            style={{
              top: "26%",
              left: "10%",
              width: "70%",
              height: "1px",
              background: "var(--bill-highlight)",
              opacity: 0.55,
              transform: "rotate(-4deg)",
            }}
          />
          <div
            className="absolute"
            style={{
              top: "62%",
              left: "18%",
              width: "60%",
              height: "1px",
              background: "var(--bill-crease)",
              opacity: 0.45,
              transform: "rotate(3deg)",
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "rolled") {
    // Tightly rolled-up bill — a thicker vertical cylinder/tube.
    const w = 20;
    const h = 44;
    const extraRot = (((index * 13) % 51) - 25); // ±25°
    const totalRot = baseRotation + extraRot;
    return (
      <div
        className={fallingClass}
        style={{
          ...sharedShell,
          width: `${w}px`,
          height: `${h}px`,
          transform: `translateX(-50%) ${tilt3d} rotate(${totalRot}deg)`,
          filter: `brightness(${brightness}) drop-shadow(0 2px 2px var(--bill-shadow))`,
          ["--bill-end-rot" as string]: `${totalRot}deg`,
        }}
      >
        <div
          className="absolute"
          style={{
            inset: 0,
            background:
              "linear-gradient(to right, var(--bill-bg-edge) 0%, var(--bill-bg) 35%, var(--bill-bg) 65%, var(--bill-bg-edge) 100%)",
            border: `1px solid var(--bill-border)`,
            borderRadius: "7px",
            overflow: "hidden",
            boxShadow:
              "inset 2px 0 2px -1px var(--bill-highlight), inset -2px 0 3px -1px var(--bill-roll-stripe)",
          }}
        >
          {/* Darker stripes along the roll suggesting paper edges */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: "20%",
              width: "1px",
              background: "var(--bill-roll-stripe)",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: "55%",
              width: "1px",
              background: "var(--bill-roll-stripe)",
              opacity: 0.6,
            }}
          />
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: "78%",
              width: "1px",
              background: "var(--bill-roll-stripe)",
              opacity: 0.5,
            }}
          />
          {/* End caps — slightly darker ovals at top and bottom */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: 0,
              height: "3px",
              background: "var(--bill-roll-stripe)",
              borderRadius: "50% 50% 0 0",
              opacity: 0.6,
            }}
          />
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: 0,
              height: "3px",
              background: "var(--bill-roll-stripe)",
              borderRadius: "0 0 50% 50%",
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "tilted" || variant === "flipped") {
    // Larger rotation; "flipped" goes upside down.
    const w = baseW;
    const h = baseH;
    const tiltSign = index % 2 === 0 ? 1 : -1;
    const tiltMag = 30 + ((index * 11) % 16); // 30-45°
    const extraRot = variant === "flipped" ? 180 : tiltSign * tiltMag;
    const totalRot = baseRotation + extraRot;
    return (
      <div
        className={fallingClass}
        style={{
          ...sharedShell,
          width: `${w}px`,
          height: `${h}px`,
          transform: `translateX(-50%) ${tilt3d} rotate(${totalRot}deg)`,
          ["--bill-end-rot" as string]: `${totalRot}deg`,
        }}
      >
        <div
          className="absolute"
          style={{ inset: 0, ...billSurface, overflow: "hidden" }}
        >
          <BillFace width={w} height={h} />
          {variant === "flipped" && (
            // Mirror feel: faint horizontal sheen, washed-out content.
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(0,0,0,0.10))",
                mixBlendMode: "overlay",
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Crisp (default) — flat rectangle.
  const w = baseW;
  const h = baseH;
  return (
    <div className={fallingClass} style={{ ...sharedShell, width: `${w}px`, height: `${h}px` }}>
      <div
        className="absolute"
        style={{ inset: 0, ...billSurface, overflow: "hidden" }}
      >
        <BillFace width={w} height={h} />
      </div>
    </div>
  );
}

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
  const [animate, setAnimate] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  // The newest bill should fall in only after a fresh add — reuse `animate`.
  const wasJustAdded = animate;

  // Compute per-bill variant + cumulative bottom (deterministic, walks 0..N-1).
  const billCount = Math.min(total, 100);
  const bills = useMemo(() => {
    const out: { variant: BillVariant; bottom: number }[] = [];
    let cumulative = 0;
    for (let i = 0; i < billCount; i++) {
      const variant = pickVariant(i);
      out.push({ variant, bottom: cumulative });
      cumulative += variantStep(variant);
    }
    return out;
  }, [billCount]);

  const handleClick = () => {
    setAnimate(true);
    onAdd();
    // Keep the flag set for the full bill-drop duration (600ms) so the
    // newest-bill falling animation completes before isFalling flips back.
    setTimeout(() => setAnimate(false), 550);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2
        className="text-xl font-bold tracking-tight"
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

          {/* Stacked dollar bills */}
          {total > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 overflow-hidden"
              style={{
                height: "100%",
                borderRadius: "0 0 22px 22px",
                perspective: "600px",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Inner-bottom floor shadow — atmospheric depth under the pile */}
              <div
                className="absolute left-0 right-0 bottom-0 pointer-events-none"
                style={{
                  height: "40px",
                  background: "var(--jar-floor-shadow)",
                  zIndex: 0,
                }}
              />
              {bills.map((b, i) => (
                <DollarBill
                  key={i}
                  index={i}
                  variant={b.variant}
                  bottom={b.bottom}
                  isFalling={i === total - 1 && wasJustAdded}
                />
              ))}
            </div>
          )}

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
          className="text-4xl font-bold tabular-nums"
          style={{ color: config.color }}
        >
          ${total}
        </span>
        <div
          className="text-xs italic mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          {config.destination}
        </div>
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
  activeUser: string | null;
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
                    {renderWithLinks(s.suggestion)}
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

function SettingsButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="fixed top-4 right-14 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
      style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      aria-label="Open settings"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );
}

function SettingsModal({
  open,
  onClose,
  onUserAdded,
  suggestions,
  onSuggestionsChanged,
  users,
  onAdditionsChanged,
}: {
  open: boolean;
  onClose: () => void;
  onUserAdded: (name: string) => void;
  suggestions: Suggestion[];
  onSuggestionsChanged: () => void;
  users: string[];
  onAdditionsChanged: () => void;
}) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [additions, setAdditions] = useState<Addition[]>([]);
  const [additionsLoading, setAdditionsLoading] = useState(false);
  const [additionsError, setAdditionsError] = useState<string | null>(null);
  const [mutatingAdditionId, setMutatingAdditionId] = useState<number | null>(null);

  const loadAdditions = useCallback(
    async (pw: string) => {
      setAdditionsLoading(true);
      setAdditionsError(null);
      const res = await fetch("/api/jars/additions", {
        headers: { "x-settings-password": pw },
      });
      setAdditionsLoading(false);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setAdditionsError(j.error ?? `Error (${res.status})`);
        return;
      }
      const data = await res.json();
      setAdditions(data.additions ?? []);
    },
    []
  );

  useEffect(() => {
    if (!open) {
      setPassword("");
      setUnlocked(false);
      setName("");
      setError(null);
      setBusy(false);
      setJustAdded(null);
      setDeletingId(null);
      setManageError(null);
      setEditingId(null);
      setEditDraft("");
      setSavingEdit(false);
      setAdditions([]);
      setAdditionsLoading(false);
      setAdditionsError(null);
      setMutatingAdditionId(null);
    }
  }, [open]);

  const reassignAddition = async (id: number, added_by: string) => {
    setMutatingAdditionId(id);
    setAdditionsError(null);
    const res = await fetch("/api/jars/additions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-settings-password": password,
      },
      body: JSON.stringify({ id, added_by }),
    });
    setMutatingAdditionId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setAdditionsError(j.error ?? `Error (${res.status})`);
      return;
    }
    setAdditions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, added_by } : a))
    );
    onAdditionsChanged();
  };

  const deleteAddition = async (id: number) => {
    setMutatingAdditionId(id);
    setAdditionsError(null);
    const res = await fetch(`/api/jars/additions?id=${id}`, {
      method: "DELETE",
      headers: { "x-settings-password": password },
    });
    setMutatingAdditionId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setAdditionsError(j.error ?? `Error (${res.status})`);
      return;
    }
    setAdditions((prev) => prev.filter((a) => a.id !== id));
    onAdditionsChanged();
  };

  const deleteSuggestion = async (id: number) => {
    setDeletingId(id);
    setManageError(null);
    const res = await fetch(`/api/suggestions?id=${id}`, {
      method: "DELETE",
      headers: { "x-settings-password": password },
    });
    setDeletingId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setManageError(j.error ?? `Error (${res.status})`);
      return;
    }
    onSuggestionsChanged();
  };

  const startEdit = (s: Suggestion) => {
    setEditingId(s.id);
    setEditDraft(s.suggestion);
    setManageError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = async (id: number) => {
    const trimmed = editDraft.trim();
    if (!trimmed) {
      setManageError("Suggestion can't be empty");
      return;
    }
    setSavingEdit(true);
    setManageError(null);
    const res = await fetch(`/api/suggestions`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-settings-password": password,
      },
      body: JSON.stringify({ id, suggestion: trimmed }),
    });
    setSavingEdit(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setManageError(j.error ?? `Error (${res.status})`);
      return;
    }
    setEditingId(null);
    setEditDraft("");
    onSuggestionsChanged();
  };

  if (!open) return null;

  const tryUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    // Probe with an empty payload — server returns 401 on bad password,
    // 400 on a missing/invalid name when the password is correct.
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-settings-password": password,
      },
      body: JSON.stringify({}),
    });
    setBusy(false);
    if (res.status === 401) {
      setError("Wrong password");
      return;
    }
    if (res.status === 500) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Server error");
      return;
    }
    setUnlocked(true);
    loadAdditions(password);
  };

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-settings-password": password,
      },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? `Error (${res.status})`);
      return;
    }
    onUserAdded(trimmed);
    setJustAdded(trimmed);
    setName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: "var(--bg)", border: "1px solid var(--jar-glass-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        {!unlocked ? (
          <form onSubmit={tryUnlock} className="flex flex-col gap-3">
            <label
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Password
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md px-3 py-2 outline-none"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text)",
                border: "1px solid var(--jar-glass-border)",
              }}
            />
            {error && (
              <p className="text-xs" style={{ color: "var(--accent-pink)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !password}
              className="rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent-pink)", color: "white" }}
            >
              {busy ? "Checking..." : "Unlock"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <form onSubmit={submitName} className="flex flex-col gap-3">
              <label
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Add a name
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sam"
                className="rounded-md px-3 py-2 outline-none"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text)",
                  border: "1px solid var(--jar-glass-border)",
                }}
              />
              {error && (
                <p className="text-xs" style={{ color: "var(--accent-pink)" }}>
                  {error}
                </p>
              )}
              {justAdded && !error && (
                <p className="text-xs" style={{ color: "var(--accent-green)" }}>
                  Added “{justAdded}”. Add another or close.
                </p>
              )}
              <button
                type="submit"
                disabled={busy || !name.trim()}
                className="rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent-green)", color: "white" }}
              >
                {busy ? "Adding..." : "Add"}
              </button>
            </form>

            <div className="flex flex-col gap-2">
              <label
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Manage suggestions
              </label>
              {suggestions.length === 0 ? (
                <p
                  className="text-xs italic"
                  style={{ color: "var(--text-muted)" }}
                >
                  No suggestions yet.
                </p>
              ) : (
                <ul
                  className="flex flex-col divide-y max-h-64 overflow-y-auto rounded-md"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--jar-glass-border)",
                  }}
                >
                  {suggestions.map((s) => {
                    const jarColor = JAR_CONFIG[s.jar_name].color;
                    const isDeleting = deletingId === s.id;
                    const isEditing = editingId === s.id;
                    return (
                      <li
                        key={s.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm"
                      >
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold shrink-0"
                          style={{ color: jarColor }}
                        >
                          {JAR_CONFIG[s.jar_name].label.replace(/\s*Jar$/, "")}
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editDraft}
                            maxLength={80}
                            disabled={savingEdit}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEdit(s.id);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEdit();
                              }
                            }}
                            className="flex-1 min-w-0 rounded-md px-2 py-1 text-sm outline-none"
                            style={{
                              background: "var(--bg)",
                              color: "var(--text)",
                              border: `1px solid ${jarColor}`,
                            }}
                          />
                        ) : (
                          <span
                            className="flex-1 min-w-0 truncate"
                            style={{ color: "var(--text)" }}
                            title={s.suggestion}
                          >
                            {s.suggestion}
                          </span>
                        )}
                        {!isEditing && (
                          <span
                            className="text-[11px] tabular-nums shrink-0"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {s.voters.length} ♥
                          </span>
                        )}
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(s.id)}
                              disabled={savingEdit || !editDraft.trim()}
                              aria-label="Save edit"
                              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm leading-none transition-opacity disabled:opacity-50"
                              style={{
                                background: "var(--bg)",
                                color: "var(--accent-green)",
                                border: `1px solid ${JAR_CONFIG.good_girl.fillColor}`,
                              }}
                            >
                              {savingEdit ? "…" : "✓"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingEdit}
                              aria-label="Cancel edit"
                              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm leading-none transition-opacity disabled:opacity-50"
                              style={{
                                background: "var(--bg)",
                                color: "var(--text-muted)",
                                border: "1px solid var(--jar-glass-border)",
                              }}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(s)}
                              disabled={isDeleting || editingId !== null}
                              aria-label={`Edit suggestion: ${s.suggestion}`}
                              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs leading-none transition-opacity disabled:opacity-50"
                              style={{
                                background: "var(--bg)",
                                color: "var(--text-muted)",
                                border: "1px solid var(--jar-glass-border)",
                              }}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSuggestion(s.id)}
                              disabled={isDeleting || editingId !== null}
                              aria-label={`Delete suggestion: ${s.suggestion}`}
                              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm leading-none transition-opacity disabled:opacity-50"
                              style={{
                                background: "var(--bg)",
                                color: "var(--accent-pink)",
                                border: `1px solid ${JAR_CONFIG.caveats.fillColor}`,
                              }}
                            >
                              {isDeleting ? "…" : "×"}
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {manageError && (
                <p className="text-xs" style={{ color: "var(--accent-pink)" }}>
                  {manageError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Manage additions
              </label>
              {additionsLoading ? (
                <p
                  className="text-xs italic"
                  style={{ color: "var(--text-muted)" }}
                >
                  Loading…
                </p>
              ) : additions.length === 0 ? (
                <p
                  className="text-xs italic"
                  style={{ color: "var(--text-muted)" }}
                >
                  No additions yet.
                </p>
              ) : (
                <ul
                  className="flex flex-col divide-y max-h-64 overflow-y-auto rounded-md"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--jar-glass-border)",
                  }}
                >
                  {additions.map((a) => {
                    const jarColor = JAR_CONFIG[a.jar_name].color;
                    const busy = mutatingAdditionId === a.id;
                    const date = new Date(a.created_at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    );
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm"
                      >
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold shrink-0"
                          style={{ color: jarColor }}
                          title={JAR_CONFIG[a.jar_name].label}
                        >
                          {JAR_CONFIG[a.jar_name].label.replace(/\s*Jar$/, "")}
                        </span>
                        <span
                          className="text-xs tabular-nums shrink-0"
                          style={{ color: "var(--text)" }}
                        >
                          ${a.amount}
                        </span>
                        <span
                          className="text-[10px] tabular-nums shrink-0"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {date}
                        </span>
                        <select
                          value={a.added_by ?? ""}
                          disabled={busy}
                          onChange={(e) => {
                            const next = e.target.value;
                            if (next && next !== a.added_by) {
                              reassignAddition(a.id, next);
                            }
                          }}
                          className="flex-1 min-w-0 rounded-md px-2 py-1 text-xs outline-none"
                          style={{
                            background: "var(--bg)",
                            color: "var(--text)",
                            border: "1px solid var(--jar-glass-border)",
                          }}
                        >
                          {!a.added_by && <option value="">— unset —</option>}
                          {a.added_by && !users.includes(a.added_by) && (
                            <option value={a.added_by}>{a.added_by}</option>
                          )}
                          {users.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => deleteAddition(a.id)}
                          disabled={busy}
                          aria-label="Delete addition"
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm leading-none transition-opacity disabled:opacity-50"
                          style={{
                            background: "var(--bg)",
                            color: "var(--accent-pink)",
                            border: `1px solid ${JAR_CONFIG.caveats.fillColor}`,
                          }}
                        >
                          {busy ? "…" : "×"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {additionsError && (
                <p className="text-xs" style={{ color: "var(--accent-pink)" }}>
                  {additionsError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserSelector({
  users,
  selected,
  onSelect,
}: {
  users: string[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {users.map((name) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className="px-4 py-2 rounded-full text-sm font-bold transition-all"
          style={{
            background:
              selected === name ? "var(--accent-violet)" : "var(--bg-secondary)",
            color: selected === name ? "white" : "var(--text)",
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
  const [users, setUsers] = useState<string[]>([]);
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
      return (data.users ?? []) as string[];
    }
    return [] as string[];
  }, []);

  const fetchTotals = useCallback(async () => {
    const res = await fetch("/api/jars");
    if (res.ok) {
      const data = await res.json();
      setTotals(data);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    const res = await fetch("/api/suggestions");
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const list = await fetchUsers();
      const stored = localStorage.getItem("jarUser");
      if (stored && list.includes(stored)) setActiveUser(stored);
      await Promise.all([fetchTotals(), fetchSuggestions()]);
      setLoading(false);
    })();
  }, [fetchUsers, fetchTotals, fetchSuggestions]);

  const selectUser = (name: string) => {
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
      <SettingsButton onOpen={() => setSettingsOpen(true)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUserAdded={() => {
          fetchUsers();
        }}
        suggestions={suggestions}
        onSuggestionsChanged={fetchSuggestions}
        users={users}
        onAdditionsChanged={fetchTotals}
      />

      <h1
        className="text-4xl font-bold tracking-tight uppercase"
        style={{ color: "var(--text)" }}
      >
        The Jars
      </h1>

      <div className="flex flex-col items-center gap-2">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--text)" }}
        >
          Who did it?
        </span>
        <UserSelector users={users} selected={activeUser} onSelect={selectUser} />
      </div>

      <div
        className="flex flex-col sm:flex-row items-center sm:items-start gap-16"
        style={{ opacity: activeUser ? 1 : 0.75 }}
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
