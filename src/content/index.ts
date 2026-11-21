import l1 from './level-1.json'
import l2 from './level-2.json'
import l3 from './level-3.json'
import l4 from './level-4.json'
import l5 from './level-5.json'
import l6 from './level-6.json'
import l7 from './level-7.json'
import l8 from './level-8.json'
import l9 from './level-9.json'
import l10 from './level-10.json'
import l11 from './level-11.json'

export interface CekQ { pertanyaan: string; opsi: string[]; benar: number; penjelasan: string }
export interface SubTopik { id: number; judul: string; uraian: string; poin: string[]; cek: CekQ }
export interface LevelContent { level: number; judul: string; sumber: string; subtopik: SubTopik[]; kuis: CekQ[] }

export const LEVELS: LevelContent[] = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11] as LevelContent[]
export const TOTAL_LEVELS = LEVELS.length
export const getLevel = (n: number): LevelContent | undefined => LEVELS.find((l) => l.level === n)
