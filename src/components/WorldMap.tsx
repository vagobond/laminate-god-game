import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface MapLocation {
  id: string;
  label: string;
  description: string;
  path: string;
  disabled?: boolean;
}

const locations: MapLocation[] = [
  { id: "river", label: "The River", description: "See what your friends are up to", path: "/the-river" },
  { id: "forest", label: "The Forest", description: "Play games and explore", path: "/the-forest" },
  { id: "village", label: "The Village", description: "Your groups and communities", path: "/the-village" },
  { id: "town", label: "The Town", description: "Local classifieds & listings", path: "/the-town" },
  { id: "world", label: "The World", description: "Explore the IRL map", path: "/irl-layer" },
  { id: "brooks", label: "The Brooks", description: "Private streams with friends", path: "/the-forest?tab=brooks" },
  { id: "you", label: "YOU", description: "Your profile & scroll of life", path: "/profile" },
  { id: "strata", label: "The Strata", description: "Your settings & layers", path: "/settings" },
  { id: "castle", label: "The Castle", description: "Coming Soon", path: "", disabled: true },
];

const WorldMap = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleClick = (loc: MapLocation) => {
    if (loc.disabled) return;
    navigate(loc.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent, loc: MapLocation) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(loc);
    }
  };

  const loc = (id: string) => locations.find((l) => l.id === id)!;

  return (
    <div className="w-full max-w-[900px] mx-auto select-none">
      <svg
        viewBox="0 0 900 620"
        className="w-full h-auto"
        role="img"
        aria-label="Interactive world map navigation"
      >
        <defs>
          {/* Sky — deep night falling to a teal horizon */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(228, 45%, 8%)" />
            <stop offset="35%" stopColor="hsl(222, 42%, 14%)" />
            <stop offset="70%" stopColor="hsl(210, 38%, 20%)" />
            <stop offset="100%" stopColor="hsl(196, 36%, 26%)" />
          </linearGradient>
          <linearGradient id="horizon-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(185, 50%, 42%)" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(180, 55%, 48%)" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id="moon-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45, 60%, 85%)" stopOpacity="0.35" />
            <stop offset="55%" stopColor="hsl(45, 60%, 85%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(45, 60%, 85%)" stopOpacity="0" />
          </radialGradient>
          {/* Aerial perspective — ranges fade cooler and lighter with distance */}
          <linearGradient id="mtn-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(214, 30%, 28%)" />
            <stop offset="100%" stopColor="hsl(210, 28%, 22%)" />
          </linearGradient>
          <linearGradient id="mtn-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(218, 26%, 23%)" />
            <stop offset="100%" stopColor="hsl(216, 24%, 17%)" />
          </linearGradient>
          <linearGradient id="mtn-castle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(220, 20%, 38%)" />
            <stop offset="100%" stopColor="hsl(222, 22%, 24%)" />
          </linearGradient>
          {/* Ground layers */}
          <linearGradient id="hills-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(150, 22%, 17%)" />
            <stop offset="100%" stopColor="hsl(142, 20%, 12%)" />
          </linearGradient>
          <linearGradient id="hills-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(135, 25%, 19%)" />
            <stop offset="100%" stopColor="hsl(128, 22%, 13%)" />
          </linearGradient>
          <linearGradient id="ground-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(120, 26%, 17%)" />
            <stop offset="100%" stopColor="hsl(114, 22%, 10%)" />
          </linearGradient>
          {/* Water */}
          <linearGradient id="water" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(198, 65%, 30%)" />
            <stop offset="40%" stopColor="hsl(192, 60%, 44%)" />
            <stop offset="70%" stopColor="hsl(196, 62%, 36%)" />
            <stop offset="100%" stopColor="hsl(198, 65%, 30%)" />
          </linearGradient>
          {/* Foliage shading — each shape gets its own moonlit-top sphere */}
          <radialGradient id="canopy" cx="40%" cy="28%" r="80%">
            <stop offset="0%" stopColor="hsl(145, 40%, 33%)" />
            <stop offset="55%" stopColor="hsl(142, 36%, 25%)" />
            <stop offset="100%" stopColor="hsl(140, 32%, 17%)" />
          </radialGradient>
          <radialGradient id="canopy-you" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="hsl(140, 46%, 37%)" />
            <stop offset="60%" stopColor="hsl(142, 38%, 27%)" />
            <stop offset="100%" stopColor="hsl(145, 34%, 18%)" />
          </radialGradient>
          <linearGradient id="trunk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(30, 35%, 32%)" />
            <stop offset="100%" stopColor="hsl(28, 30%, 20%)" />
          </linearGradient>
          {/* Warm light pools */}
          <radialGradient id="window-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(42, 95%, 65%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(42, 95%, 65%)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orb-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45, 95%, 72%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(45, 95%, 72%)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="crystal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(280, 70%, 65%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(280, 70%, 65%)" stopOpacity="0" />
          </radialGradient>
          {/* Globe as a lit sphere */}
          <radialGradient id="globe-shade" cx="35%" cy="30%" r="85%">
            <stop offset="0%" stopColor="hsl(200, 48%, 42%)" />
            <stop offset="60%" stopColor="hsl(202, 44%, 28%)" />
            <stop offset="100%" stopColor="hsl(206, 46%, 17%)" />
          </radialGradient>
          {/* Painted finish */}
          <radialGradient id="vignette" cx="50%" cy="45%" r="72%">
            <stop offset="0%" stopColor="hsl(228, 45%, 5%)" stopOpacity="0" />
            <stop offset="72%" stopColor="hsl(228, 45%, 5%)" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(228, 45%, 5%)" stopOpacity="0.45" />
          </radialGradient>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <filter id="soften">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          {/* Hover glow */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sky background */}
        <rect x="0" y="0" width="900" height="620" fill="url(#sky)" />

        {/* Stars — small static field plus shimmering ones */}
        {[
          [90, 95], [210, 110], [310, 85], [380, 55], [520, 90], [590, 60],
          [660, 100], [730, 35], [850, 95], [40, 40], [480, 120], [280, 130],
        ].map(([cx, cy], i) => (
          <circle key={`s${i}`} cx={cx} cy={cy} r={0.9} fill="hsl(45, 70%, 88%)" opacity={0.35 + (i % 4) * 0.1} />
        ))}
        {[
          [120, 30], [250, 55], [400, 20], [550, 45], [700, 25], [800, 60],
          [60, 70], [340, 40], [620, 15], [780, 50], [180, 15], [460, 65],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={1.5} fill="hsl(45, 80%, 85%)" opacity={0.6 + (i % 3) * 0.15}>
            <animate attributeName="opacity" values={`${0.3 + (i % 3) * 0.2};${0.8};${0.3 + (i % 3) * 0.2}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {/* Four-point sparkles */}
        {[
          [330, 25], [680, 70], [150, 55],
        ].map(([x, y], i) => (
          <path
            key={`sp${i}`}
            d={`M ${x},${y - 5} L ${x + 1.2},${y - 1.2} L ${x + 5},${y} L ${x + 1.2},${y + 1.2} L ${x},${y + 5} L ${x - 1.2},${y + 1.2} L ${x - 5},${y} L ${x - 1.2},${y - 1.2} Z`}
            fill="hsl(45, 90%, 80%)"
            opacity="0.7"
          >
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${3 + i}s`} repeatCount="indefinite" />
          </path>
        ))}

        {/* Moon with halo */}
        <circle cx="780" cy="70" r="60" fill="url(#moon-halo)" />
        <circle cx="780" cy="70" r="25" fill="hsl(45, 30%, 85%)" opacity="0.9" />
        <circle cx="790" cy="62" r="22" fill="url(#sky)" />

        {/* Horizon glow band */}
        <rect x="0" y="180" width="900" height="140" fill="url(#horizon-glow)" />

        {/* Distant ranges — aerial perspective, softened */}
        <g filter="url(#soften)">
          <polygon points="120,270 260,165 400,270" fill="url(#mtn-far)" opacity="0.55" />
          <polygon points="470,270 610,160 750,270" fill="url(#mtn-far)" opacity="0.55" />
          <polygon points="20,280 150,195 290,280" fill="url(#mtn-mid)" opacity="0.75" />
          <polygon points="540,275 690,190 840,275" fill="url(#mtn-mid)" opacity="0.75" />
          <polygon points="760,280 850,215 900,260 900,280" fill="url(#mtn-mid)" opacity="0.7" />
        </g>

        {/* Ground — rolling layered hills */}
        <path d="M 0,362 Q 150,322 310,350 Q 460,375 600,348 Q 750,325 900,356 L 900,620 L 0,620 Z" fill="url(#hills-back)" />
        <path d="M 0,362 Q 150,322 310,350" fill="none" stroke="hsl(45, 45%, 65%)" strokeWidth="1.5" opacity="0.1" />
        <path d="M 600,348 Q 750,325 900,356" fill="none" stroke="hsl(45, 45%, 65%)" strokeWidth="1.5" opacity="0.16" />
        <path d="M 0,425 Q 200,372 430,408 Q 650,440 900,398 L 900,620 L 0,620 Z" fill="url(#hills-mid)" />
        <path d="M 650,432 Q 780,410 900,398" fill="none" stroke="hsl(45, 45%, 65%)" strokeWidth="1.5" opacity="0.12" />
        <ellipse cx="450" cy="650" rx="580" ry="260" fill="url(#ground-front)" />

        {/* === THE CASTLE (top, disabled) === */}
        <g
          role="link"
          aria-label="The Castle — Unlock by inviting 3 friends who complete their profiles"
          tabIndex={0}
          data-tutorial="castle"
          onMouseEnter={() => setHovered("castle")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("castle"))}
          onKeyDown={(e) => handleKeyDown(e, loc("castle"))}
          className="cursor-not-allowed"
          opacity={0.4}
        >
          <title>Unlock by inviting 3 friends who complete their profiles</title>
          {/* Mountain with moonlit east face */}
          <polygon points="450,90 380,220 520,220" fill="url(#mtn-castle)" />
          <polygon points="450,90 520,220 462,210" fill="hsl(220, 22%, 44%)" opacity="0.5" />
          <polygon points="450,90 380,220 438,210" fill="hsl(224, 25%, 18%)" opacity="0.55" />
          {/* Snow cap */}
          <polygon points="450,90 435,120 465,120" fill="hsl(210, 20%, 88%)" />
          <polygon points="450,90 465,120 456,116" fill="hsl(45, 40%, 94%)" opacity="0.8" />
          {/* Castle towers */}
          <rect x="435" y="120" width="8" height="20" fill="hsl(220, 20%, 40%)" />
          <rect x="457" y="115" width="8" height="25" fill="hsl(220, 20%, 40%)" />
          <rect x="440" y="135" width="20" height="10" fill="hsl(220, 20%, 38%)" />
          {/* Battlements */}
          {[440, 444, 448, 452, 456].map((x) => (
            <rect key={x} x={x} y="132" width="2" height="4" fill="hsl(220, 20%, 45%)" />
          ))}
          {/* One lit window keeps it alive */}
          <rect x="460" y="122" width="3" height="4" fill="hsl(42, 90%, 65%)" opacity="0.9" rx="0.5" />
          <text x="450" y="240" textAnchor="middle" fill="hsl(0, 0%, 60%)" fontSize="13" fontWeight="600" fontFamily="Cinzel Variable, serif">
            The Castle
          </text>
          <text x="450" y="255" textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize="10" fontFamily="Cinzel Variable, serif" fontStyle="italic">
            Coming Soon
          </text>
        </g>

        {/* === THE FOREST (upper left) === */}
        <g
          role="link"
          aria-label={loc("forest").description}
          tabIndex={0}
          data-tutorial="forest"
          onMouseEnter={() => setHovered("forest")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("forest"))}
          onKeyDown={(e) => handleKeyDown(e, loc("forest"))}
          className="cursor-pointer"
          filter={hovered === "forest" ? "url(#glow)" : undefined}
        >
          {/* Hill */}
          <ellipse cx="170" cy="300" rx="135" ry="62" fill="url(#hills-mid)" />
          {/* Back row of trees — small, dark, misty */}
          {[85, 108, 132, 156, 180, 204, 228, 248].map((x, i) => (
            <polygon
              key={`bt${i}`}
              points={`${x},${242 + (i % 3) * 4} ${x - 8},${266 + (i % 3) * 3} ${x + 8},${266 + (i % 3) * 3}`}
              fill="hsl(150, 24%, 15%)"
              opacity="0.85"
            />
          ))}
          {/* Front trees with shaded canopies and moonlit edges */}
          {[100, 130, 160, 190, 220].map((x, i) => (
            <g key={i}>
              <polygon
                points={`${x},${260 - i * 3} ${x - 12},${290 - i * 2} ${x + 12},${290 - i * 2}`}
                fill="url(#canopy)"
              />
              <polygon
                points={`${x},${248 - i * 3} ${x - 9},${270 - i * 2} ${x + 9},${270 - i * 2}`}
                fill="url(#canopy)"
              />
              {/* Moonlit right edge */}
              <polygon
                points={`${x},${248 - i * 3} ${x + 9},${270 - i * 2} ${x + 4},${268 - i * 2}`}
                fill="hsl(140, 40%, 42%)"
                opacity="0.5"
              />
              <rect x={x - 2} y={290 - i * 2} width="4" height="8" fill="url(#trunk)" />
            </g>
          ))}
          {/* Fireflies */}
          {[115, 148, 175, 205, 235].map((x, i) => (
            <circle key={i} cx={x} cy={272 - (i % 3) * 8} r="1.8" fill="hsl(60, 90%, 70%)" opacity="0.7">
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${1.5 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <text
            x="160" y="320"
            textAnchor="middle"
            fill={hovered === "forest" ? "hsl(45, 95%, 70%)" : "hsl(45, 60%, 80%)"}
            fontSize="14" fontWeight="700" fontFamily="Cinzel Variable, serif"
            style={{ transition: "fill 0.3s" }}
          >
            The Forest
          </text>
          {hovered === "forest" && (
            <text x="160" y="336" textAnchor="middle" fill="hsl(45, 40%, 65%)" fontSize="10" fontFamily="Cinzel Variable, serif">
              {loc("forest").description}
            </text>
          )}
        </g>

        {/* === THE RIVER (winding through center) === */}
        <g
          role="link"
          aria-label={loc("river").description}
          tabIndex={0}
          data-tutorial="river"
          onMouseEnter={() => setHovered("river")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("river"))}
          onKeyDown={(e) => handleKeyDown(e, loc("river"))}
          className="cursor-pointer"
          filter={hovered === "river" ? "url(#glow)" : undefined}
        >
          {/* Bank shadow */}
          <path
            d="M 300,200 Q 350,260 400,300 Q 460,350 500,380 Q 540,400 580,390 Q 640,370 700,380"
            fill="none"
            stroke="hsl(210, 45%, 12%)"
            strokeWidth="22"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M 300,200 Q 350,260 400,300 Q 460,350 500,380 Q 540,400 580,390 Q 640,370 700,380"
            fill="none"
            stroke="url(#water)"
            strokeWidth="15"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Central sheen */}
          <path
            d="M 300,200 Q 350,260 400,300 Q 460,350 500,380 Q 540,400 580,390 Q 640,370 700,380"
            fill="none"
            stroke="hsl(190, 70%, 60%)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Flowing sparkle */}
          <path
            d="M 300,200 Q 350,260 400,300 Q 460,350 500,380 Q 540,400 580,390 Q 640,370 700,380"
            fill="none"
            stroke="hsl(195, 60%, 62%)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
            strokeDasharray="8 12"
          >
            <animate attributeName="stroke-dashoffset" values="0;-40" dur="3s" repeatCount="indefinite" />
          </path>
          {/* Moonlight caught on the far bend */}
          <path
            d="M 610,383 Q 650,371 690,379"
            fill="none"
            stroke="hsl(45, 70%, 78%)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.28"
          />
          <text
            x="490" y="340"
            textAnchor="middle"
            fill={hovered === "river" ? "hsl(45, 95%, 70%)" : "hsl(195, 60%, 80%)"}
            fontSize="15" fontWeight="700" fontFamily="Cinzel Variable, serif"
            style={{ transition: "fill 0.3s" }}
          >
            The River
          </text>
          {hovered === "river" && (
            <text x="490" y="356" textAnchor="middle" fill="hsl(195, 40%, 65%)" fontSize="10" fontFamily="Cinzel Variable, serif">
              {loc("river").description}
            </text>
          )}
        </g>

        {/* === THE BROOKS (small streams branching off) === */}
        <g
          role="link"
          aria-label={loc("brooks").description}
          tabIndex={0}
          data-tutorial="brooks"
          onMouseEnter={() => setHovered("brooks")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("brooks"))}
          onKeyDown={(e) => handleKeyDown(e, loc("brooks"))}
          className="cursor-pointer"
          filter={hovered === "brooks" ? "url(#glow)" : undefined}
        >
          <path d="M 380,310 Q 350,340 320,360" fill="none" stroke="hsl(210, 45%, 14%)" strokeWidth="9" strokeLinecap="round" opacity="0.5" />
          <path d="M 380,310 Q 350,340 320,360" fill="none" stroke="hsl(196, 55%, 38%)" strokeWidth="6" strokeLinecap="round" opacity="0.75" />
          <path d="M 370,320 Q 340,355 300,380" fill="none" stroke="hsl(196, 55%, 36%)" strokeWidth="5" strokeLinecap="round" opacity="0.65" />
          <path d="M 380,310 Q 350,340 320,360" fill="none" stroke="hsl(192, 65%, 58%)" strokeWidth="2" strokeLinecap="round" opacity="0.5" strokeDasharray="4 8">
            <animate attributeName="stroke-dashoffset" values="0;-24" dur="2s" repeatCount="indefinite" />
          </path>
          <text
            x="310" y="400"
            textAnchor="middle"
            fill={hovered === "brooks" ? "hsl(45, 95%, 70%)" : "hsl(195, 50%, 70%)"}
            fontSize="12" fontWeight="600" fontFamily="Cinzel Variable, serif"
            style={{ transition: "fill 0.3s" }}
          >
            The Brooks
          </text>
          {hovered === "brooks" && (
            <text x="310" y="414" textAnchor="middle" fill="hsl(195, 35%, 60%)" fontSize="9" fontFamily="Cinzel Variable, serif">
              {loc("brooks").description}
            </text>
          )}
        </g>

        {/* === THE VILLAGE (left-center, houses) === */}
        <g
          role="link"
          aria-label={loc("village").description}
          tabIndex={0}
          data-tutorial="village"
          onMouseEnter={() => setHovered("village")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("village"))}
          onKeyDown={(e) => handleKeyDown(e, loc("village"))}
          className="cursor-pointer"
          filter={hovered === "village" ? "url(#glow)" : undefined}
        >
          {/* Warm ambient pool of light */}
          <ellipse cx="145" cy="428" rx="78" ry="42" fill="url(#window-glow)" opacity="0.25" />
          {/* Dirt lane toward the river */}
          <path d="M 185,435 Q 240,420 295,392" fill="none" stroke="hsl(35, 25%, 30%)" strokeWidth="5" strokeLinecap="round" opacity="0.45" />
          {/* Houses */}
          {[
            { x: 100, y: 410, w: 28, h: 22 },
            { x: 140, y: 400, w: 32, h: 26 },
            { x: 180, y: 408, w: 26, h: 20 },
            { x: 125, y: 435, w: 30, h: 24 },
          ].map((h, i) => (
            <g key={i}>
              <rect x={h.x} y={h.y} width={h.w} height={h.h} fill={`hsl(30, ${25 + i * 5}%, ${28 + i * 3}%)`} rx="2" />
              {/* Moonlit roof edge */}
              <polygon points={`${h.x - 4},${h.y} ${h.x + h.w / 2},${h.y - 14} ${h.x + h.w + 4},${h.y}`} fill={`hsl(15, ${30 + i * 5}%, ${25 + i * 2}%)`} />
              <path d={`M ${h.x + h.w / 2},${h.y - 14} L ${h.x + h.w + 4},${h.y}`} stroke="hsl(45, 40%, 62%)" strokeWidth="1" opacity="0.35" />
              {/* Window with light spill */}
              <circle cx={h.x + h.w / 2} cy={h.y + 9} r="8" fill="url(#window-glow)" opacity="0.6" />
              <rect x={h.x + h.w / 2 - 3} y={h.y + 6} width="6" height="6" fill="hsl(45, 85%, 68%)" rx="1" opacity="0.95" />
            </g>
          ))}
          {/* Smoke from chimney */}
          <circle cx="155" cy="378" r="4" fill="hsl(0, 0%, 60%)" opacity="0.3">
            <animate attributeName="cy" values="378;360" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0" dur="4s" repeatCount="indefinite" />
          </circle>
          <text
            x="145" y="480"
            textAnchor="middle"
            fill={hovered === "village" ? "hsl(45, 95%, 70%)" : "hsl(45, 60%, 80%)"}
            fontSize="14" fontWeight="700" fontFamily="Cinzel Variable, serif"
            style={{ transition: "fill 0.3s" }}
          >
            The Village
          </text>
          {hovered === "village" && (
            <text x="145" y="496" textAnchor="middle" fill="hsl(45, 40%, 65%)" fontSize="10" fontFamily="Cinzel Variable, serif">
              {loc("village").description}
            </text>
          )}
        </g>

        {/* === THE TOWN (center-right, buildings) === */}
        <g
          role="link"
          aria-label={loc("town").description}
          tabIndex={0}
          data-tutorial="town"
          onMouseEnter={() => setHovered("town")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("town"))}
          onKeyDown={(e) => handleKeyDown(e, loc("town"))}
          className="cursor-pointer"
          filter={hovered === "town" ? "url(#glow)" : undefined}
        >
          {/* Town glow against the night */}
          <ellipse cx="614" cy="440" rx="80" ry="46" fill="url(#window-glow)" opacity="0.22" />
          {/* Buildings */}
          {[
            { x: 560, y: 420, w: 22, h: 35 },
            { x: 588, y: 430, w: 26, h: 25 },
            { x: 620, y: 415, w: 20, h: 40 },
            { x: 645, y: 425, w: 24, h: 30 },
          ].map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={`hsl(220, ${15 + i * 5}%, ${25 + i * 3}%)`} rx="1" />
              {/* Moonlit rooftop */}
              <rect x={b.x} y={b.y} width={b.w} height="2" fill="hsl(45, 35%, 55%)" opacity="0.35" />
              {/* Windows */}
              {[0, 1, 2].map((row) => (
                <g key={row}>
                  <circle cx={b.x + 6} cy={b.y + 7 + row * 10} r="5" fill="url(#window-glow)" opacity="0.5" />
                  <rect x={b.x + 4} y={b.y + 5 + row * 10} width="4" height="4" fill="hsl(45, 75%, 62%)" opacity="0.85" rx="0.5" />
                </g>
              ))}
            </g>
          ))}
          {/* Market stall */}
          <polygon points="575,455 595,445 615,455" fill="hsl(15, 50%, 40%)" opacity="0.7" />
          <text
            x="610" y="480"
            textAnchor="middle"
            fill={hovered === "town" ? "hsl(45, 95%, 70%)" : "hsl(45, 60%, 80%)"}
            fontSize="14" fontWeight="700" fontFamily="Cinzel Variable, serif"
            style={{ transition: "fill 0.3s" }}
          >
            The Town
          </text>
          {hovered === "town" && (
            <text x="610" y="496" textAnchor="middle" fill="hsl(45, 40%, 65%)" fontSize="10" fontFamily="Cinzel Variable, serif">
              {loc("town").description}
            </text>
          )}
        </g>

        {/* === THE WORLD (globe, far right) === */}
        <g
          role="link"
          aria-label={loc("world").description}
          tabIndex={0}
          data-tutorial="world"
          onMouseEnter={() => setHovered("world")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("world"))}
          onKeyDown={(e) => handleKeyDown(e, loc("world"))}
          className="cursor-pointer"
          filter={hovered === "world" ? "url(#glow)" : undefined}
        >
          {/* Aura */}
          <circle cx="790" cy="320" r="48" fill="url(#orb-glow)" opacity="0.25" />
          {/* Globe as shaded sphere */}
          <circle cx="790" cy="320" r="35" fill="url(#globe-shade)" stroke="hsl(45, 60%, 55%)" strokeWidth="2" />
          <ellipse cx="790" cy="320" rx="35" ry="15" fill="none" stroke="hsl(45, 40%, 45%)" strokeWidth="1" />
          <ellipse cx="790" cy="320" rx="15" ry="35" fill="none" stroke="hsl(45, 40%, 45%)" strokeWidth="1" />
          <line x1="755" y1="320" x2="825" y2="320" stroke="hsl(45, 40%, 45%)" strokeWidth="1" />
          {/* Continents suggestion */}
          <path d="M 775,305 Q 785,300 795,308 Q 800,315 790,318" fill="hsl(120, 28%, 34%)" opacity="0.7" />
          <path d="M 800,325 Q 808,330 805,338" fill="hsl(120, 28%, 34%)" opacity="0.7" />
          {/* Specular highlight */}
          <ellipse cx="778" cy="306" rx="10" ry="6" fill="hsl(45, 60%, 85%)" opacity="0.2" transform="rotate(-25 778 306)" />
          {/* Compass rose */}
          <polygon points="790,278 787,285 793,285" fill="hsl(45, 80%, 60%)" />
          <text
            x="790" y="375"
            textAnchor="middle"
            fill={hovered === "world" ? "hsl(45, 95%, 70%)" : "hsl(45, 60%, 80%)"}
            fontSize="14" fontWeight="700" fontFamily="Cinzel Variable, serif"
            style={{ transition: "fill 0.3s" }}
          >
            The World
          </text>
          {hovered === "world" && (
            <text x="790" y="391" textAnchor="middle" fill="hsl(45, 40%, 65%)" fontSize="10" fontFamily="Cinzel Variable, serif">
              {loc("world").description}
            </text>
          )}
        </g>

        {/* === YOU (Tree of Life, bottom center) === */}
        <g
          role="link"
          aria-label={loc("you").description}
          tabIndex={0}
          data-tutorial="you"
          onMouseEnter={() => setHovered("you")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("you"))}
          onKeyDown={(e) => handleKeyDown(e, loc("you"))}
          className="cursor-pointer"
          filter={hovered === "you" ? "url(#glow-strong)" : undefined}
        >
          {/* Soft ground light beneath the tree */}
          <ellipse cx="450" cy="528" rx="55" ry="16" fill="url(#orb-glow)" opacity="0.2" />
          {/* Tree trunk */}
          <rect x="443" y="480" width="14" height="50" fill="url(#trunk)" rx="3" />
          {/* Roots */}
          <path d="M 443,525 Q 430,540 420,545" fill="none" stroke="hsl(30, 30%, 25%)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 457,525 Q 470,540 480,545" fill="none" stroke="hsl(30, 30%, 25%)" strokeWidth="3" strokeLinecap="round" />
          {/* Canopy — shaded spheres */}
          <circle cx="450" cy="470" r="30" fill="url(#canopy-you)" />
          <circle cx="435" cy="460" r="20" fill="url(#canopy-you)" />
          <circle cx="465" cy="458" r="22" fill="url(#canopy-you)" />
          <circle cx="450" cy="448" r="18" fill="url(#canopy-you)" />
          {/* Moonlit crown edge */}
          <path d="M 434,442 Q 450,432 466,444" fill="none" stroke="hsl(140, 45%, 48%)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          {/* Glow orb heart */}
          <circle cx="450" cy="465" r="16" fill="url(#orb-glow)" opacity="0.5">
            <animate attributeName="opacity" values="0.35;0.65;0.35" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="450" cy="465" r="8" fill="hsl(45, 90%, 65%)" opacity="0.6">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
            <animate attributeName="r" values="7;9;7" dur="3s" repeatCount="indefinite" />
          </circle>
          <text
            x="450" y="570"
            textAnchor="middle"
            fill={hovered === "you" ? "hsl(45, 95%, 75%)" : "hsl(45, 80%, 85%)"}
            fontSize="16" fontWeight="800" fontFamily="Cinzel Variable, serif"
            style={{ transition: "fill 0.3s" }}
          >
            YOU
          </text>
          {hovered === "you" && (
            <text x="450" y="586" textAnchor="middle" fill="hsl(45, 40%, 65%)" fontSize="10" fontFamily="Cinzel Variable, serif">
              {loc("you").description}
            </text>
          )}
        </g>

        {/* === THE STRATA (bottom right, layers) === */}
        <g
          role="link"
          aria-label={loc("strata").description}
          tabIndex={0}
          data-tutorial="strata"
          onMouseEnter={() => setHovered("strata")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("strata"))}
          onKeyDown={(e) => handleKeyDown(e, loc("strata"))}
          className="cursor-pointer"
          filter={hovered === "strata" ? "url(#glow)" : undefined}
        >
          {/* Layered rock strata with lit top edges */}
          {[
            { y: 510, color: "hsl(30, 20%, 22%)", w: 80 },
            { y: 520, color: "hsl(20, 25%, 25%)", w: 90 },
            { y: 530, color: "hsl(15, 22%, 20%)", w: 100 },
            { y: 540, color: "hsl(25, 18%, 18%)", w: 95 },
            { y: 550, color: "hsl(10, 20%, 16%)", w: 105 },
          ].map((layer, i) => (
            <g key={i}>
              <rect x={720 - layer.w / 2} y={layer.y} width={layer.w} height="12" fill={layer.color} rx="2" />
              <rect x={720 - layer.w / 2} y={layer.y} width={layer.w} height="1.5" fill="hsl(40, 30%, 50%)" opacity="0.25" rx="1" />
            </g>
          ))}
          {/* Crystals with inner light */}
          <circle cx="725" cy="502" r="16" fill="url(#crystal-glow)" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
          </circle>
          <polygon points="720,490 715,510 725,510" fill="hsl(280, 45%, 52%)" opacity="0.85" />
          <polygon points="720,490 725,510 721,508" fill="hsl(280, 60%, 70%)" opacity="0.7" />
          <polygon points="730,495 726,512 734,512" fill="hsl(280, 40%, 45%)" opacity="0.75" />
          <text
            x="720" y="580"
            textAnchor="middle"
            fill={hovered === "strata" ? "hsl(45, 95%, 70%)" : "hsl(45, 60%, 80%)"}
            fontSize="13" fontWeight="700" fontFamily="Cinzel Variable, serif"
            style={{ transition: "fill 0.3s" }}
          >
            The Strata
          </text>
          {hovered === "strata" && (
            <text x="720" y="596" textAnchor="middle" fill="hsl(45, 40%, 65%)" fontSize="10" fontFamily="Cinzel Variable, serif">
              {loc("strata").description}
            </text>
          )}
        </g>

        {/* Painted finish — vignette and canvas grain (non-interactive) */}
        <rect x="0" y="0" width="900" height="620" fill="url(#vignette)" pointerEvents="none" />
        <rect x="0" y="0" width="900" height="620" filter="url(#grain)" opacity="0.05" pointerEvents="none" />

        {/* Tooltip overlay for hovered item */}
        {hovered && !["castle"].includes(hovered) && (
          <rect x="0" y="0" width="900" height="620" fill="transparent" pointerEvents="none" />
        )}
      </svg>
    </div>
  );
};

export default WorldMap;
