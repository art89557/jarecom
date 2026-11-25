// Suara panduan untuk tur. Urutan: file rekaman /voice/tur-N.mp3 bila ada, kalau tidak
// suara bawaan perangkat (Web Speech, bahasa Indonesia). Tidak pernah berbunyi sendiri:
// hanya dari tombol "Dengarkan" (WCAG 1.4.2).
// ===== Pengaturan suara panduan =====
const KEY = 'jarecom:voice'
let enabled = true
try { enabled = localStorage.getItem(KEY) !== 'off' } catch { /* abaikan */ }
/** Apakah suara panduan aktif? */
export const voiceOn = () => enabled
/** Aktifkan atau matikan suara panduan; mematikan juga menghentikan suara yang sedang berbunyi. */
export const setVoice = (v: boolean) => {
  enabled = v
  try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* abaikan */ }
  if (!v) stopVoice()
}

// ===== Sumber suara =====
// Web Speech API (suara bawaan perangkat); null jika browser tidak mendukung.
const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
/** Apakah perangkat bisa membacakan teks? */
export const voiceSupported = () => !!synth

// File rekaman dianggap ada bila server menjawab audio. Ditanyakan sekali agar klik tetap langsung.
const files: Record<number, boolean> = {}
/** Cek sekali apakah file rekaman tur-1 sampai tur-N ada di server. */
export function probeVoiceFiles(count: number): Promise<void> {
  return Promise.all(Array.from({ length: count }, async (_, k) => {
    try {
      const r = await fetch(`/voice/tur-${k + 1}.mp3`, { method: 'HEAD' })
      files[k] = r.ok && (r.headers.get('content-type') ?? '').startsWith('audio')
    } catch { files[k] = false }
  })).then(() => undefined)
}
/** Apakah rekaman untuk langkah ke-k tersedia? */
export const hasVoiceFile = (k: number) => !!files[k]

/** Ada suara bahasa Indonesia di perangkat ini? Daftar suara bisa belum terisi; anggap ada. */
export function hasIndonesianVoice(): boolean {
  if (!synth) return false
  const v = synth.getVoices()
  return v.length === 0 || v.some((x) => x.lang.toLowerCase().startsWith('id'))
}

// ===== Pemutaran =====
let audio: HTMLAudioElement | null = null
let onEnd: (() => void) | null = null

/** Hentikan rekaman dan suara bawaan, lalu panggil callback `done` yang tertunda. */
export function stopVoice() {
  if (audio) { audio.onended = null; audio.pause(); audio = null }
  synth?.cancel()
  const cb = onEnd; onEnd = null
  cb?.()
}

/** Putar langkah ke-k (0, 1, ...). `done` dipanggil saat selesai atau dihentikan. */
export function speak(k: number, text: string, done: () => void): boolean {
  stopVoice()
  onEnd = done
  // Prioritas 1: file rekaman.
  if (hasVoiceFile(k)) {
    audio = new Audio(`/voice/tur-${k + 1}.mp3`)
    audio.onended = () => stopVoice()
    audio.onerror = () => stopVoice()
    void audio.play().catch(() => stopVoice())
    return true
  }
  // Prioritas 2: suara bawaan perangkat berbahasa Indonesia. Jika tidak ada, tidak berbunyi (return false).
  if (!synth || !hasIndonesianVoice()) { onEnd = null; return false }
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'id-ID'
    u.rate = 0.95
    const id = synth.getVoices().find((x) => x.lang.toLowerCase().startsWith('id'))
    if (id) u.voice = id
    u.onend = () => stopVoice()
    u.onerror = () => stopVoice()
    synth.speak(u)
    return true
  } catch { onEnd = null; return false }
}
