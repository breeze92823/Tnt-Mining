// Inline SVG icons for the HUD, drawn to match the chunky outlined style of
// the in-world billboards. All use a 0..100 viewBox.
const INK = '#1d1410'

function starPoints(cx, cy, r1, r2, n, rot = -Math.PI / 2) {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n
    const r = i % 2 ? r2 : r1
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`)
  }
  return pts.join(' ')
}

const Svg = ({ children, className }) => (
  <svg className={className} viewBox="0 0 100 100" aria-hidden strokeLinejoin="round" strokeLinecap="round">
    {children}
  </svg>
)

export const BurstIcon = (p) => (
  <Svg {...p}>
    <polygon points={starPoints(50, 50, 49, 30, 12, 0)} fill="#ff5a0a" stroke="#8a2400" strokeWidth="3" />
    <polygon points={starPoints(50, 50, 36, 21, 10, 0.3)} fill="#ffc21f" />
    <polygon points={starPoints(50, 50, 22, 13, 8, 0.1)} fill="#fff27a" />
    <circle cx="50" cy="50" r="9" fill="#fffdf0" />
  </Svg>
)

export const CashIcon = (p) => (
  <Svg {...p}>
    <g transform="rotate(-18 50 50)">
      <rect x="10" y="44" width="78" height="34" rx="3" fill="#1f8a2e" stroke={INK} strokeWidth="4" />
      <rect x="14" y="32" width="78" height="34" rx="3" fill="#2fae3d" stroke={INK} strokeWidth="4" />
      <rect x="10" y="22" width="78" height="34" rx="3" fill="#4ccf55" stroke={INK} strokeWidth="4" />
      <rect x="40" y="22" width="16" height="34" fill="#f5cf3a" stroke={INK} strokeWidth="3" />
      <circle cx="24" cy="39" r="6" fill="#8ff08f" />
      <circle cx="74" cy="39" r="6" fill="#8ff08f" />
    </g>
  </Svg>
)

export const ShellIcon = (p) => (
  <Svg {...p}>
    <path d="M12 50 Q14 88 50 90 Q86 88 88 50 L78 58 L70 44 L60 56 L50 42 L40 56 L30 44 L22 58 Z" fill="#f6efdf" stroke="#5b4a32" strokeWidth="4" />
    <path d="M22 66 Q30 82 50 84" fill="none" stroke="#d9cdb2" strokeWidth="5" />
    <path d="M30 30 L40 18 L48 28 L56 16 L64 30 Q56 36 46 35 Q36 35 30 30 Z" fill="#f6efdf" stroke="#5b4a32" strokeWidth="4" />
  </Svg>
)

export const RebirthIcon = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="50" r="42" fill="#e8f1ff" />
    <path d="M8 52 Q50 22 92 48 A42 42 0 0 0 8 52 Z" fill="#ff2f6d" />
    <path d="M20 62 Q50 40 84 58" fill="none" stroke="#c8d8f0" strokeWidth="6" />
    <circle cx="50" cy="50" r="42" fill="none" stroke="#1b1b2a" strokeWidth="6" />
    <ellipse cx="36" cy="26" rx="10" ry="6" fill="#ffffff" opacity="0.75" />
  </Svg>
)

export const GemIcon = (p) => (
  <Svg {...p}>
    <polygon points={starPoints(50, 50, 44, 44, 3, Math.PI / 6)} fill="#2fd13b" stroke="#0b4f14" strokeWidth="7" />
    <polygon points={starPoints(50, 50, 21, 21, 3, Math.PI / 6)} fill="#0f8a22" stroke="#0b4f14" strokeWidth="5" />
    <polygon points="28,30 40,22 44,30 32,38" fill="#8af58f" opacity="0.8" />
  </Svg>
)

export const BasketIcon = (p) => (
  <Svg {...p}>
    <path d="M28 44 Q30 12 50 12 Q70 12 72 44" fill="none" stroke="#5a5a62" strokeWidth="7" />
    <path d="M28 44 Q30 12 50 12 Q70 12 72 44" fill="none" stroke="#c9cbd2" strokeWidth="3" />
    <path d="M8 42 L92 42 L82 86 L18 86 Z" fill="#ef2a2a" stroke="#4a0b0b" strokeWidth="5" />
    <path d="M8 42 L92 42 L90 52 L10 52 Z" fill="#ff5c50" stroke="#4a0b0b" strokeWidth="4" />
    <g stroke="#a3121a" strokeWidth="5">
      <line x1="32" y1="56" x2="34" y2="82" />
      <line x1="50" y1="56" x2="50" y2="82" />
      <line x1="68" y1="56" x2="66" y2="82" />
    </g>
  </Svg>
)

export const BagIcon = (p) => (
  <Svg {...p}>
    <path d="M36 22 Q36 8 50 8 Q64 8 64 22" fill="none" stroke={INK} strokeWidth="6" />
    <rect x="18" y="20" width="64" height="72" rx="18" fill="#f2a41f" stroke={INK} strokeWidth="5" />
    <path d="M18 44 Q50 34 82 44" fill="none" stroke="#c97a0c" strokeWidth="5" />
    <rect x="30" y="54" width="40" height="30" rx="8" fill="#ffc94a" stroke={INK} strokeWidth="4" />
    <line x1="30" y1="64" x2="70" y2="64" stroke={INK} strokeWidth="4" />
    <circle cx="50" cy="64" r="4" fill="#8a5a10" />
  </Svg>
)

export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="12" y="18" width="76" height="72" rx="10" fill="#fff6fb" stroke={INK} strokeWidth="5" />
    <path d="M12 28 Q12 18 22 18 L78 18 Q88 18 88 28 L88 40 L12 40 Z" fill="#f0364f" stroke={INK} strokeWidth="5" />
    <rect x="28" y="8" width="8" height="20" rx="4" fill="#d8dbe3" stroke={INK} strokeWidth="3" />
    <rect x="64" y="8" width="8" height="20" rx="4" fill="#d8dbe3" stroke={INK} strokeWidth="3" />
    <polygon points={starPoints(50, 64, 20, 9, 5)} fill="#ffcf1f" stroke="#a56a00" strokeWidth="3" />
  </Svg>
)

export const TeleportIcon = (p) => (
  <Svg {...p}>
    <rect x="16" y="56" width="68" height="34" rx="6" fill="#9aa3b5" stroke={INK} strokeWidth="5" />
    <rect x="16" y="56" width="68" height="10" rx="4" fill="#c7cede" />
    <rect x="45" y="30" width="10" height="34" fill="#4b4f5c" stroke={INK} strokeWidth="4" />
    <circle cx="50" cy="26" r="16" fill="#ef2a2a" stroke={INK} strokeWidth="5" />
    <circle cx="44" cy="20" r="5" fill="#ff8f8f" />
  </Svg>
)

export const ScrollIcon = (p) => (
  <Svg {...p}>
    <rect x="24" y="20" width="56" height="62" rx="4" fill="#f4f1ea" stroke={INK} strokeWidth="5" />
    <rect x="14" y="12" width="64" height="14" rx="7" fill="#dcd6c8" stroke={INK} strokeWidth="5" />
    <rect x="26" y="76" width="64" height="14" rx="7" fill="#dcd6c8" stroke={INK} strokeWidth="5" />
    <g stroke="#7b7f8c" strokeWidth="4">
      <line x1="34" y1="38" x2="70" y2="38" />
      <line x1="34" y1="50" x2="70" y2="50" />
      <line x1="34" y1="62" x2="60" y2="62" />
    </g>
  </Svg>
)

export const GearIcon = (p) => (
  <Svg {...p}>
    <polygon points={starPoints(50, 50, 44, 34, 8, 0)} fill="#c3c8d2" stroke="#3a3f4a" strokeWidth="6" />
    <circle cx="50" cy="50" r="27" fill="#c3c8d2" />
    <circle cx="50" cy="50" r="13" fill="#3a3f4a" />
  </Svg>
)

export const PotionIcon = (p) => (
  <Svg {...p}>
    <rect x="40" y="6" width="20" height="14" rx="3" fill="#b07a3c" stroke={INK} strokeWidth="4" />
    <path d="M42 20 L58 20 L58 32 Q84 40 84 64 Q84 92 50 92 Q16 92 16 64 Q16 40 42 32 Z" fill="#ffe4d8" stroke={INK} strokeWidth="5" />
    <path d="M20 62 Q20 88 50 88 Q80 88 80 62 Q64 54 50 60 Q34 66 20 62 Z" fill="#e8262b" />
    <polygon points={starPoints(50, 64, 20, 10, 9, 0)} fill="#ffb21f" />
    <polygon points={starPoints(50, 64, 10, 5, 7, 0.3)} fill="#fff27a" />
    <ellipse cx="34" cy="46" rx="6" ry="10" fill="#ffffff" opacity="0.7" />
  </Svg>
)

export const GiftIcon = (p) => (
  <Svg {...p}>
    <path d="M50 30 Q30 6 22 18 Q16 30 50 30 Q84 30 78 18 Q70 6 50 30 Z" fill="#ffcf1f" stroke={INK} strokeWidth="4" />
    <rect x="14" y="30" width="72" height="20" rx="3" fill="#ff3b3b" stroke={INK} strokeWidth="5" />
    <rect x="20" y="50" width="60" height="40" rx="3" fill="#e01b24" stroke={INK} strokeWidth="5" />
    <rect x="43" y="30" width="14" height="60" fill="#ffcf1f" stroke={INK} strokeWidth="4" />
  </Svg>
)

export const PlusIcon = (p) => (
  <Svg {...p}>
    <path d="M40 12 H60 V40 H88 V60 H60 V88 H40 V60 H12 V40 H40 Z" fill="#fff" stroke={INK} strokeWidth="6" />
  </Svg>
)

// Isometric block for the hotbar: top, left and right faces.
function IsoCube({ top, left, right, band }) {
  return (
    <>
      <polygon points="50,8 90,28 50,48 10,28" fill={top} stroke={INK} strokeWidth="4" />
      <polygon points="10,28 50,48 50,94 10,74" fill={left} stroke={INK} strokeWidth="4" />
      <polygon points="50,48 90,28 90,74 50,94" fill={right} stroke={INK} strokeWidth="4" />
      {band && (
        <>
          <polygon points="10,44 50,64 50,78 10,58" fill="#f4f4ee" />
          <polygon points="50,64 90,44 90,58 50,78" fill="#e2e2da" />
        </>
      )}
    </>
  )
}

export const TntIcon = ({ top = '#3fd25a', left = '#1f9a3a', right = '#2bb84a', ...p }) => (
  <Svg {...p}>
    <IsoCube top={top} left={left} right={right} band />
  </Svg>
)

export const DirtIcon = (p) => (
  <Svg {...p}>
    <IsoCube top="#a8643a" left="#7a4222" right="#8f512c" />
  </Svg>
)

export const PickaxeIcon = (p) => (
  <Svg {...p}>
    <rect x="44" y="30" width="12" height="64" rx="4" transform="rotate(35 50 60)" fill="#7a5a3a" stroke={INK} strokeWidth="4" />
    <path d="M10 34 Q40 4 88 20 L84 30 Q46 22 20 44 Z" fill="#b8bec8" stroke={INK} strokeWidth="5" />
    <path d="M22 30 Q46 12 78 20" fill="none" stroke="#e6e9ef" strokeWidth="4" />
  </Svg>
)

export const UpgradeIcon = (p) => (
  <Svg {...p}>
    <path d="M50 8 L90 40 V58 L50 28 L10 58 V40 Z" fill="#5be03a" stroke={INK} strokeWidth="5" />
    <path d="M50 44 L90 76 V94 L50 64 L10 94 V76 Z" fill="#3fc22a" stroke={INK} strokeWidth="5" />
  </Svg>
)

export const BoltIcon = (p) => (
  <Svg {...p}>
    <polygon points="58,6 18,56 44,56 36,94 82,40 54,40" fill="#ffd21f" stroke={INK} strokeWidth="5" />
  </Svg>
)

export const MagnetIcon = (p) => (
  <Svg {...p}>
    <path d="M18 60 V42 A32 32 0 0 1 82 42 V60" fill="none" stroke={INK} strokeWidth="30" />
    <path d="M18 60 V42 A32 32 0 0 1 82 42 V60" fill="none" stroke="#e8262b" strokeWidth="20" />
    <rect x="8" y="58" width="20" height="26" fill="#e6e9ef" stroke={INK} strokeWidth="5" />
    <rect x="72" y="58" width="20" height="26" fill="#e6e9ef" stroke={INK} strokeWidth="5" />
  </Svg>
)

export const SparkleIcon = (p) => (
  <Svg {...p}>
    <polygon points={starPoints(50, 50, 46, 18, 4, -Math.PI / 2)} fill="#a35bff" stroke="#4a1a8a" strokeWidth="4" />
    <polygon points={starPoints(50, 50, 30, 12, 4, -Math.PI / 4)} fill="#d6b0ff" />
  </Svg>
)
