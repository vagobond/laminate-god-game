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
          {/* Sky gradient */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(220, 40%, 12%)" />
            <stop offset="40%" stopColor="hsl(220, 35%, 18%)" />
            <stop offset="100%" stopColor="hsl(200, 30%, 22%)" />
          </linearGradient>
          {/* Ground gradient */}
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(120, 25%, 18%)" />
            <stop offset="100%" stopColor="hsl(120, 20%, 12%)" />
          </linearGradient>
          {/* Water gradient */}
          <linearGradient id="water" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(195, 60%, 35%)" />
            <stop offset="50%" stopColor="hsl(195, 50%, 45%)" />
            <stop offset="100%" stopColor="hsl(195, 60%, 35%)" />
          </linearGradient>
          {/* Glow filter */}
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
          {/* Star shimmer */}
          <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45, 95%, 80%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(45, 95%, 80%)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky background */}
        <rect x="0" y="0" width="900" height="620" fill="url(#sky)" />

        {/* Stars */}
        {[
          [120, 30], [250, 55], [400, 20], [550, 45], [700, 25], [800, 60],
          [60, 70], [340, 40], [620, 15], [780, 50], [180, 15], [460, 65],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={1.5} fill="hsl(45, 80%, 85%)" opacity={0.6 + (i % 3) * 0.15}>
            <animate attributeName="opacity" values={`${0.3 + (i % 3) * 0.2};${0.8};${0.3 + (i % 3) * 0.2}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Moon */}
        <circle cx="780" cy="70" r="25" fill="hsl(45, 30%, 85%)" opacity="0.9" />
        <circle cx="790" cy="62" r="22" fill="url(#sky)" />

        {/* Ground / hills base */}
        <ellipse cx="450" cy="620" rx="550" ry="280" fill="url(#ground)" />
        <ellipse cx="200" cy="540" rx="280" ry="160" fill="hsl(120, 20%, 16%)" />
        <ellipse cx="700" cy="560" rx="300" ry="150" fill="hsl(120, 22%, 15%)" />

        {/* === THE CASTLE (top, disabled) === */}
        <g
          role="link"
          aria-label="The Castle — Unlock by inviting 3 friends who complete their profiles"
          tabIndex={0}
          onMouseEnter={() => setHovered("castle")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("castle"))}
          onKeyDown={(e) => handleKeyDown(e, loc("castle"))}
          className="cursor-not-allowed"
          opacity={0.4}
        >
          <title>Unlock by inviting 3 friends who complete their profiles</title>
          {/* Mountain */}
          <polygon points="450,90 380,220 520,220" fill="hsl(220, 15%, 30%)" />
          <polygon points="450,90 420,160 480,160" fill="hsl(220, 15%, 35%)" />
          {/* Snow cap */}
          <polygon points="450,90 435,120 465,120" fill="hsl(0, 0%, 85%)" />
          {/* Castle towers */}
          <rect x="435" y="120" width="8" height="20" fill="hsl(220, 20%, 40%)" />
          <rect x="457" y="115" width="8" height="25" fill="hsl(220, 20%, 40%)" />
          <rect x="440" y="135" width="20" height="10" fill="hsl(220, 20%, 38%)" />
          {/* Battlements */}
          {[440, 444, 448, 452, 456].map((x) => (
            <rect key={x} x={x} y="132" width="2" height="4" fill="hsl(220, 20%, 45%)" />
          ))}
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
          onMouseEnter={() => setHovered("forest")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("forest"))}
          onKeyDown={(e) => handleKeyDown(e, loc("forest"))}
          className="cursor-pointer"
          filter={hovered === "forest" ? "url(#glow)" : undefined}
        >
          {/* Hill */}
          <ellipse cx="170" cy="300" rx="130" ry="60" fill="hsl(120, 25%, 20%)" />
          {/* Trees */}
          {[100, 130, 160, 190, 220].map((x, i) => (
            <g key={i}>
              <polygon
                points={`${x},${260 - i * 3} ${x - 12},${290 - i * 2} ${x + 12},${290 - i * 2}`}
                fill={`hsl(${140 + i * 5}, ${30 + i * 3}%, ${22 + i * 2}%)`}
              />
              <polygon
                points={`${x},${248 - i * 3} ${x - 9},${270 - i * 2} ${x + 9},${270 - i * 2}`}
                fill={`hsl(${140 + i * 5}, ${35 + i * 3}%, ${26 + i * 2}%)`}
              />
              <rect x={x - 2} y={290 - i * 2} width="4" height="8" fill="hsl(30, 30%, 25%)" />
            </g>
          ))}
          {/* Fireflies */}
          {[115, 175, 205].map((x, i) => (
            <circle key={i} cx={x} cy={270 - i * 5} r="2" fill="hsl(60, 90%, 70%)" opacity="0.7">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${1.5 + i * 0.5}s`} repeatCount="indefinite" />
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
          onMouseEnter={() => setHovered("river")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("river"))}
          onKeyDown={(e) => handleKeyDown(e, loc("river"))}
          className="cursor-pointer"
          filter={hovered === "river" ? "url(#glow)" : undefined}
        >
          <path
            d="M 300,200 Q 350,260 400,300 Q 460,350 500,380 Q 540,400 580,390 Q 640,370 700,380"
            fill="none"
            stroke="url(#water)"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 300,200 Q 350,260 400,300 Q 460,350 500,380 Q 540,400 580,390 Q 640,370 700,380"
            fill="none"
            stroke="hsl(195, 60%, 55%)"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.5"
            strokeDasharray="8 12"
          >
            <animate attributeName="stroke-dashoffset" values="0;-40" dur="3s" repeatCount="indefinite" />
          </path>
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
          onMouseEnter={() => setHovered("brooks")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("brooks"))}
          onKeyDown={(e) => handleKeyDown(e, loc("brooks"))}
          className="cursor-pointer"
          filter={hovered === "brooks" ? "url(#glow)" : undefined}
        >
          <path d="M 380,310 Q 350,340 320,360" fill="none" stroke="hsl(195, 50%, 40%)" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
          <path d="M 370,320 Q 340,355 300,380" fill="none" stroke="hsl(195, 50%, 40%)" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
          <path d="M 380,310 Q 350,340 320,360" fill="none" stroke="hsl(195, 60%, 55%)" strokeWidth="2" strokeLinecap="round" opacity="0.5" strokeDasharray="4 8">
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
          onMouseEnter={() => setHovered("village")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("village"))}
          onKeyDown={(e) => handleKeyDown(e, loc("village"))}
          className="cursor-pointer"
          filter={hovered === "village" ? "url(#glow)" : undefined}
        >
          {/* Houses */}
          {[
            { x: 100, y: 410, w: 28, h: 22 },
            { x: 140, y: 400, w: 32, h: 26 },
            { x: 180, y: 408, w: 26, h: 20 },
            { x: 125, y: 435, w: 30, h: 24 },
          ].map((h, i) => (
            <g key={i}>
              <rect x={h.x} y={h.y} width={h.w} height={h.h} fill={`hsl(30, ${25 + i * 5}%, ${28 + i * 3}%)`} rx="2" />
              <polygon points={`${h.x - 4},${h.y} ${h.x + h.w / 2},${h.y - 14} ${h.x + h.w + 4},${h.y}`} fill={`hsl(15, ${30 + i * 5}%, ${25 + i * 2}%)`} />
              {/* Window */}
              <rect x={h.x + h.w / 2 - 3} y={h.y + 6} width="6" height="6" fill="hsl(45, 80%, 65%)" rx="1" opacity="0.8" />
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
          onMouseEnter={() => setHovered("town")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("town"))}
          onKeyDown={(e) => handleKeyDown(e, loc("town"))}
          className="cursor-pointer"
          filter={hovered === "town" ? "url(#glow)" : undefined}
        >
          {/* Buildings */}
          {[
            { x: 560, y: 420, w: 22, h: 35 },
            { x: 588, y: 430, w: 26, h: 25 },
            { x: 620, y: 415, w: 20, h: 40 },
            { x: 645, y: 425, w: 24, h: 30 },
          ].map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={`hsl(220, ${15 + i * 5}%, ${25 + i * 3}%)`} rx="1" />
              {/* Windows */}
              {[0, 1, 2].map((row) => (
                <rect key={row} x={b.x + 4} y={b.y + 5 + row * 10} width="4" height="4" fill="hsl(45, 70%, 60%)" opacity="0.7" rx="0.5" />
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
          onMouseEnter={() => setHovered("world")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("world"))}
          onKeyDown={(e) => handleKeyDown(e, loc("world"))}
          className="cursor-pointer"
          filter={hovered === "world" ? "url(#glow)" : undefined}
        >
          {/* Globe */}
          <circle cx="790" cy="320" r="35" fill="hsl(200, 40%, 25%)" stroke="hsl(45, 60%, 55%)" strokeWidth="2" />
          <ellipse cx="790" cy="320" rx="35" ry="15" fill="none" stroke="hsl(45, 40%, 45%)" strokeWidth="1" />
          <ellipse cx="790" cy="320" rx="15" ry="35" fill="none" stroke="hsl(45, 40%, 45%)" strokeWidth="1" />
          <line x1="755" y1="320" x2="825" y2="320" stroke="hsl(45, 40%, 45%)" strokeWidth="1" />
          {/* Continents suggestion */}
          <path d="M 775,305 Q 785,300 795,308 Q 800,315 790,318" fill="hsl(120, 25%, 30%)" opacity="0.6" />
          <path d="M 800,325 Q 808,330 805,338" fill="hsl(120, 25%, 30%)" opacity="0.6" />
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
          onMouseEnter={() => setHovered("you")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("you"))}
          onKeyDown={(e) => handleKeyDown(e, loc("you"))}
          className="cursor-pointer"
          filter={hovered === "you" ? "url(#glow-strong)" : undefined}
        >
          {/* Tree trunk */}
          <rect x="443" y="480" width="14" height="50" fill="hsl(30, 35%, 28%)" rx="3" />
          {/* Roots */}
          <path d="M 443,525 Q 430,540 420,545" fill="none" stroke="hsl(30, 30%, 25%)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 457,525 Q 470,540 480,545" fill="none" stroke="hsl(30, 30%, 25%)" strokeWidth="3" strokeLinecap="round" />
          {/* Canopy */}
          <circle cx="450" cy="470" r="30" fill="hsl(140, 35%, 25%)" />
          <circle cx="435" cy="460" r="20" fill="hsl(140, 30%, 28%)" />
          <circle cx="465" cy="458" r="22" fill="hsl(140, 32%, 27%)" />
          <circle cx="450" cy="448" r="18" fill="hsl(140, 38%, 30%)" />
          {/* Glow orb */}
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
          onMouseEnter={() => setHovered("strata")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleClick(loc("strata"))}
          onKeyDown={(e) => handleKeyDown(e, loc("strata"))}
          className="cursor-pointer"
          filter={hovered === "strata" ? "url(#glow)" : undefined}
        >
          {/* Layered rock strata */}
          {[
            { y: 510, color: "hsl(30, 20%, 22%)", w: 80 },
            { y: 520, color: "hsl(20, 25%, 25%)", w: 90 },
            { y: 530, color: "hsl(15, 22%, 20%)", w: 100 },
            { y: 540, color: "hsl(25, 18%, 18%)", w: 95 },
            { y: 550, color: "hsl(10, 20%, 16%)", w: 105 },
          ].map((layer, i) => (
            <rect key={i} x={720 - layer.w / 2} y={layer.y} width={layer.w} height="12" fill={layer.color} rx="2" />
          ))}
          {/* Crystal */}
          <polygon points="720,490 715,510 725,510" fill="hsl(280, 40%, 45%)" opacity="0.7" />
          <polygon points="730,495 726,512 734,512" fill="hsl(280, 35%, 40%)" opacity="0.6" />
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

        {/* Tooltip overlay for hovered item */}
        {hovered && !["castle"].includes(hovered) && (
          <rect x="0" y="0" width="900" height="620" fill="transparent" pointerEvents="none" />
        )}
      </svg>
    </div>
  );
};

export default WorldMap;
