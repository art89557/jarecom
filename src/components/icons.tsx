// Set ikon garis (SVG 24 px). Tidak memakai emoji.
// Tiap nilai adalah data jalur SVG (atribut `d`); nama kunci = nama ikon yang dipakai di <Icon name=... />.
const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7',
  lock: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4',
  star: 'M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.8 6.4 20l1.3-6.2L3 9.5l6.3-.7z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3',
  book: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7z',
  award: 'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM8.5 14 7 22l5-3 5 3-1.5-8',
  play: 'M7 4v16l13-8z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18-3-3.5-3-14.5 0-18',
  hash: 'M5 9h14M5 15h14M10 4 8 20M16 4l-2 16',
  share: 'M18 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
  wave: 'M3 12h4l3-8 4 16 3-8h4',
  grid: 'M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zM15 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z',
  split: 'M12 21v-9M12 12 5 5M12 12l7-7M5 9V5h4M15 5h4v4',
  route: 'M6 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  shieldcheck: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  x: 'M6 6l12 12M18 6 6 18',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01',
  chevd: 'm6 9 6 6 6-6',
  chevl: 'm15 6-6 6 6 6',
  type: 'M4 7V4h16v3M9 20h6M12 4v16',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  share2: 'M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  volume: 'M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
  motion: 'M4 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M4 16h6',
  phone: 'M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  key: 'M8 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM11 12l9-9M16 7l3 3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  users: 'M16 21v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  sim: 'M3 4h18v12H3zM8 20h8M12 16v4M10 7.5l4.5 2.5-4.5 2.5z',
  chat: 'M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.6A8.4 8.4 0 1 1 21 11.5z',
  chest: 'M3 10h18v10H3zM3 10l2-5h14l2 5M10 14h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  sliders: 'M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2M14 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM16 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'
} as const

/** Nama ikon yang tersedia. */
export type IconName = keyof typeof PATHS

/** Ikon garis dari PATHS. `sw` = tebal garis, `fill` = isi (kosong secara bawaan). */
export function Icon({ name, size = 24, sw = 2, fill = 'none', className }: { name: IconName; size?: number; sw?: number; fill?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={PATHS[name]} />
    </svg>
  )
}

// Ikon lencana untuk level 1 sampai 11, urut sesuai nomor level.
const LEVEL_ICON: IconName[] = ['globe', 'hash', 'share', 'layers', 'wave', 'grid', 'split', 'route', 'shield', 'sliders', 'shieldcheck']


/** Lencana level (heksagon). Status: emas = skor 100, got = lulus (biru), off = terkunci (abu-abu bergembok). */
export function LevelBadge({ level, state, size = 92 }: { level: number; state: 'gold' | 'got' | 'off'; size?: number }) {
  const hex = 'M46 4l36 20v44L46 88 10 68V24z'
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" aria-hidden="true">
      {state === 'off' ? (
        <>
          <path d={hex} fill="#E4E9F2" stroke="#C9D1DE" strokeWidth="3" strokeLinejoin="round" />
          <g transform="translate(34 34)" color="#66738A"><Icon name="lock" size={24} sw={2.4} /></g>
        </>
      ) : (
        <>
          <path d={hex} fill={state === 'gold' ? '#FACC15' : '#2457F5'} stroke={state === 'gold' ? '#B8860B' : '#143AA8'} strokeWidth="3" strokeLinejoin="round" />
          <g transform="translate(31 30)" color={state === 'gold' ? '#5C3A00' : '#fff'}><Icon name={LEVEL_ICON[level - 1] ?? 'award'} size={30} sw={2.3} /></g>
          {state === 'gold' && (
            <g transform="translate(58 58)"><circle cx="12" cy="12" r="12" fill="#fff" stroke="#B8860B" strokeWidth="2" /><g transform="translate(4 4)" color="#B8860B"><Icon name="star" size={16} fill="#FACC15" /></g></g>
          )}
        </>
      )}
    </svg>
  )
}

/** Lencana "siap": heksagon ungu putus-putus dengan piala (kuis bisa dikerjakan). */
export function ReadyBadge({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" aria-hidden="true">
      <path d="M46 4l36 20v44L46 88 10 68V24z" fill="#F3EAFD" stroke="#7E22CE" strokeWidth="3.5" strokeDasharray="7 5" strokeLinejoin="round" />
      <g transform="translate(30 30)" color="#7E22CE"><Icon name="trophy" size={32} sw={2.3} /></g>
    </svg>
  )
}
