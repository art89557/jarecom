import { describe, expect, it } from 'vitest'
import { applyMaterial, applyQuiz, computeScore, emptyProgress, isUnlocked, levelPct, nextLevel, quizAvailable, userLevel } from './engine'

describe('unlock', () => {
  it('hanya level 1 terbuka di awal', () => {
    const p = emptyProgress()
    expect(isUnlocked(1, p)).toBe(true)
    expect(isUnlocked(2, p)).toBe(false)
  })
  it('level 2 butuh materi 1 selesai dan kuis 1 lulus', () => {
    let p = applyMaterial(emptyProgress(), 1).next
    expect(isUnlocked(2, p)).toBe(false)
    p = applyQuiz(p, 1, 70).next
    expect(isUnlocked(2, p)).toBe(true)
  })
  it('skor di bawah 70 tidak membuka level berikutnya dan tidak memberi XP', () => {
    const p = applyMaterial(emptyProgress(), 1).next
    const r = applyQuiz(p, 1, 60)
    expect(r.passed).toBe(false)
    expect(r.xpGained).toBe(0)
    expect(isUnlocked(2, r.next)).toBe(false)
  })
})

describe('XP', () => {
  it('materi +20 sekali saja', () => {
    const a = applyMaterial(emptyProgress(), 1)
    expect(a.xpGained).toBe(20)
    expect(applyMaterial(a.next, 1).xpGained).toBe(0)
  })
  it('kuis lulus +50, ulang tidak menambah', () => {
    const p = applyMaterial(emptyProgress(), 1).next
    const a = applyQuiz(p, 1, 80)
    expect(a.xpGained).toBe(50)
    expect(applyQuiz(a.next, 1, 90).xpGained).toBe(0)
  })
  it('bonus skor 100 +20 hanya sekali', () => {
    const p = applyMaterial(emptyProgress(), 1).next
    const a = applyQuiz(p, 1, 100)
    expect(a.xpGained).toBe(70)
    expect(applyQuiz(a.next, 1, 100).xpGained).toBe(0)
  })
  it('lulus dulu, 100 kemudian: hanya bonus 20', () => {
    const p = applyMaterial(emptyProgress(), 1).next
    const a = applyQuiz(p, 1, 70)
    expect(applyQuiz(a.next, 1, 100).xpGained).toBe(20)
  })
})

describe('lain-lain', () => {
  it('materi terkunci ditolak', () => {
    expect(() => applyMaterial(emptyProgress(), 2)).toThrow()
  })
  it('kuis butuh materi selesai', () => {
    expect(quizAvailable(1, emptyProgress())).toBe(false)
    expect(() => applyQuiz(emptyProgress(), 1, 100)).toThrow()
  })
  it('skor dibulatkan', () => {
    expect(computeScore(7, 10)).toBe(70)
    expect(computeScore(2, 3)).toBe(67)
  })
  it('level pengguna dan persen', () => {
    let p = applyMaterial(emptyProgress(), 1).next
    expect(userLevel(p)).toBe(1)
    expect(levelPct(1, p)).toBe(50)
    p = applyQuiz(p, 1, 70).next
    expect(userLevel(p)).toBe(2)
    expect(levelPct(1, p)).toBe(100)
    expect(nextLevel(p)).toBe(2)
  })
})

import { badgeState, nodeState, bestScore, heatState, isTamat, levelLabel, levelXp, normalizeProgress, overallPct, quizStatus } from './engine'
describe('lencana dan node jalur', () => {
  it('lencana: off, got saat lulus, gold saat pernah skor 100', () => {
    let p = applyMaterial(emptyProgress(), 1).next
    expect(badgeState(1, p)).toBe('off')
    p = applyQuiz(p, 1, 80).next
    expect(badgeState(1, p)).toBe('got')
    p = applyQuiz(p, 1, 100).next
    expect(badgeState(1, p)).toBe('gold')
  })
  it('node: selesai, aktif, belum', () => {
    expect([0, 1, 2, 3].map((i) => nodeState(i, 2, false))).toEqual(['done', 'done', 'active', 'next'])
    expect(nodeState(3, 0, true)).toBe('done')
  })
})

describe('skor terbaik, riwayat XP, status tampilan', () => {
  it('skor terbaik mengambil yang tertinggi, termasuk percobaan gagal', () => {
    let p = applyMaterial(emptyProgress(), 1).next
    expect(bestScore(1, p)).toBeNull()
    p = applyQuiz(p, 1, 50).next
    expect(bestScore(1, p)).toBe(50)
    p = applyQuiz(p, 1, 80).next
    p = applyQuiz(p, 1, 60).next
    expect(bestScore(1, p)).toBe(80)
  })
  it('riwayat XP tercatat sekali per jenis, terbaru di depan; jumlahnya sama dengan XP', () => {
    let p = applyMaterial(emptyProgress(), 1, 1).next
    p = applyQuiz(p, 1, 100, 2).next
    p = applyQuiz(p, 1, 100, 3).next
    expect(p.events.map((e) => e.type)).toEqual(['bonus', 'kuis', 'materi'])
    expect(p.events.reduce((a, e) => a + e.xp, 0)).toBe(p.xp)
    expect(levelXp(1, p)).toBe(90)
  })
  it('status kuis dan petak peta panas', () => {
    let p = emptyProgress()
    expect(quizStatus(1, p)).toBe('locked')
    expect(heatState(1, p)).toBe('locked')
    p = applyMaterial(p, 1).next
    expect(quizStatus(1, p)).toBe('ready')
    expect(heatState(1, p)).toBe('materi')
    p = applyQuiz(p, 1, 80).next
    expect(quizStatus(1, p)).toBe('pass')
    expect(heatState(1, p)).toBe('pass')
    p = applyQuiz(p, 1, 100).next
    expect(quizStatus(1, p)).toBe('gold')
    expect(heatState(1, p)).toBe('gold')
  })
  it('data lama dilengkapi dan persen total dihitung', () => {
    const old = normalizeProgress({ completed: [1], passed: [], perfect: [], xp: 20 })
    expect(old.best).toEqual({})
    expect(old.events).toEqual([])
    expect(overallPct(old)).toBe(5)
  })
  it('Level tampil Tamat setelah 11 kuis lulus', () => {
    const p = { ...emptyProgress(), passed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
    expect(isTamat(p)).toBe(true)
    expect(levelLabel(p)).toBe('Tamat')
    expect(levelLabel(emptyProgress())).toBe('1')
  })
})
