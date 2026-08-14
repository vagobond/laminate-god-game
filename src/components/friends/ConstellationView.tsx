import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Friend } from "./types";
import { getFriendshipShortLabel } from "@/lib/friendship-labels";

const tierConfig: Record<string, { fill: string; glow: string; ring: number }> = {
  close_friend:          { fill: "hsl(142, 71%, 45%)", glow: "hsl(142, 71%, 60%)", ring: 0 },
  family:                { fill: "hsl(280, 60%, 55%)", glow: "hsl(280, 60%, 70%)", ring: 1 },
  buddy:                 { fill: "hsl(217, 91%, 60%)", glow: "hsl(217, 91%, 75%)", ring: 2 },
  friendly_acquaintance: { fill: "hsl(45, 85%, 50%)",  glow: "hsl(45, 85%, 65%)",  ring: 3 },
  secret_friend:         { fill: "hsl(180, 50%, 45%)", glow: "hsl(180, 50%, 60%)", ring: 4 },
};

const ringLabels = ["Oath Bound", "Blood Bound", "Companion", "Wayfarer", "Invisible Ally"];

interface Star {
  friend: Friend;
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
  glowColor: string;
}

interface Props {
  friends: Friend[];
  anonymous?: boolean;
  centerLabel?: string;
}

export function ConstellationView({ friends, anonymous = false, centerLabel = "you" }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDims({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const pad = 50;
    const cx = dims.width / 2;
    const cy = dims.height / 2;
    const maxR = Math.min(dims.width, dims.height) / 2 - pad;
    const ringCount = 5;

    // Group by tier ring
    const grouped = new Map<number, Friend[]>();
    for (const f of friends) {
      const cfg = tierConfig[f.level];
      if (!cfg) continue; // skip secret_enemy, not_friend
      const ring = cfg.ring;
      if (!grouped.has(ring)) grouped.set(ring, []);
      grouped.get(ring)!.push(f);
    }

    const next: Star[] = [];

    for (const [ring, tierFriends] of grouped) {
      const innerR = (ring / ringCount) * maxR * 0.85;
      const outerR = ((ring + 1) / ringCount) * maxR * 0.85;
      const midR = (innerR + outerR) / 2;
      const width = outerR - innerR;
      const cfg = tierConfig[tierFriends[0].level];

      tierFriends.forEach((friend, i) => {
        const baseAngle = (i / tierFriends.length) * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * (Math.PI / Math.max(tierFriends.length, 1));
        const angle = baseAngle + jitter;
        const radJitter = (Math.random() - 0.5) * width * 0.5;
        const r = midR + radJitter;

        next.push({
          friend,
          x: Math.max(pad, Math.min(dims.width - pad, cx + Math.cos(angle) * r)),
          y: Math.max(pad, Math.min(dims.height - pad, cy + Math.sin(angle) * r)),
          size: 6 + Math.random() * 4,
          delay: Math.random() * 3,
          color: cfg.fill,
          glowColor: cfg.glow,
        });
      });
    }
    setStars(next);
  }, [friends, dims]);

  // Connection lines between same-tier stars
  const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number; color: string }[] = [];
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      if (stars[i].friend.level !== stars[j].friend.level) continue;
      const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
      if (d < 120 && lines.length < 60) {
        lines.push({
          x1: stars[i].x, y1: stars[i].y,
          x2: stars[j].x, y2: stars[j].y,
          opacity: 0.2 * (1 - d / 120),
          color: stars[i].color,
        });
      }
    }
  }

  const maxR = Math.min(dims.width, dims.height) / 2 - 50;
  const cx = dims.width / 2;
  const cy = dims.height / 2;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, hsl(220 20% 8%) 0%, hsl(220 25% 4%) 100%)" }}
    >
      {/* Ring guides */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {ringLabels.map((label, i) => {
          const r = ((i + 1) / 5) * maxR * 0.85;
          const vals = Object.values(tierConfig);
          const cfg = vals.find(v => v.ring === i);
          return (
            <g key={i}>
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={cfg?.fill ?? "#666"}
                strokeWidth="1"
                opacity={0.15}
                strokeDasharray="4 4"
              />
              {/* Ring label */}
              <text
                x={cx + r - 4}
                y={cy - 6}
                fill={cfg?.fill ?? "#666"}
                opacity={0.35}
                fontSize="10"
                textAnchor="end"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Connection lines */}
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color} strokeWidth="1" opacity={l.opacity} />
        ))}
      </svg>

      {/* "You" dot at center */}
      <div
        className="absolute rounded-full"
        style={{
          left: cx, top: cy,
          width: 10, height: 10,
          transform: "translate(-50%, -50%)",
          backgroundColor: "hsl(0 0% 90%)",
          boxShadow: "0 0 12px hsl(0 0% 90% / 0.6)",
        }}
      />
      <span
        className="absolute text-[10px] text-white/50 pointer-events-none"
        style={{ left: cx, top: cy + 10, transform: "translateX(-50%)" }}
      >
        {centerLabel}
      </span>

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.friend.id}
          className={`absolute transition-transform duration-200 ${anonymous ? "" : "cursor-pointer hover:scale-[1.8]"}`}
          style={{
            left: star.x, top: star.y,
            transform: "translate(-50%, -50%)",
          }}
          onClick={anonymous ? undefined : () => navigate(`/u/${star.friend.friend_id}`)}
          onMouseEnter={anonymous ? undefined : () => setHoveredStar(star)}
          onMouseLeave={anonymous ? undefined : () => setHoveredStar(null)}
        >
          {/* Glow */}
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              width: star.size * 3, height: star.size * 3,
              left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, ${star.glowColor}55 0%, transparent 70%)`,
              animationDelay: `${star.delay}s`,
              animationDuration: "4s",
            }}
          />
          {/* Dot */}
          <div
            className="relative rounded-full"
            style={{
              width: star.size, height: star.size,
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size}px ${star.glowColor}`,
            }}
          />
        </div>
      ))}

      {/* Tooltip — hidden in anonymous mode */}
      {!anonymous && hoveredStar && (
        <div
          className="absolute z-20 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border/50 pointer-events-none"
          style={{
            left: Math.min(hoveredStar.x + 15, dims.width - 180),
            top: Math.max(hoveredStar.y - 10, 10),
            borderLeftColor: hoveredStar.color,
            borderLeftWidth: "3px",
          }}
        >
          <p className="text-sm font-medium text-foreground">
            {hoveredStar.friend.profile?.display_name || "Anonymous"}
          </p>
          <p className="text-xs" style={{ color: hoveredStar.color }}>
            {getFriendshipShortLabel(hoveredStar.friend.level)}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2.5 text-[10px]">
        {Object.entries(tierConfig).map(([level, cfg]) => (
          <div key={level} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cfg.fill, boxShadow: `0 0 4px ${cfg.glow}` }}
            />
            <span className="text-white/50">{getFriendshipShortLabel(level)}</span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {stars.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
          Add friends to see your constellation
        </div>
      )}
    </div>
  );
}
