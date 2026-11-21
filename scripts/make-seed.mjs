// Membuat supabase/seed.sql dari src/content/level-*.json. Jalankan: npm run seed:sql
import { readFileSync, writeFileSync } from 'node:fs'
const esc = (s) => String(s).replace(/'/g, "''")
let sql = '-- Dibuat otomatis oleh scripts/make-seed.mjs. Jangan ubah manual.\n'
const levels = []
const qs = []
for (let n = 1; n <= 11; n++) {
  const l = JSON.parse(readFileSync(new URL(`../src/content/level-${n}.json`, import.meta.url), 'utf8'))
  levels.push(`(${n}, '${esc(l.judul)}')`)
  l.kuis.forEach((k, i) => qs.push(`(${n}, ${i + 1}, '${esc(k.pertanyaan)}', '${esc(JSON.stringify(k.opsi))}'::jsonb, ${k.benar}, '${esc(k.penjelasan)}')`))
}
sql += `insert into public.levels (kode, judul) values\n${levels.join(',\n')}\non conflict (kode) do update set judul = excluded.judul;\n\n`
sql += `insert into public.quiz_questions (level, nomor, pertanyaan, opsi, benar, penjelasan) values\n${qs.join(',\n')}\non conflict (level, nomor) do update set pertanyaan = excluded.pertanyaan, opsi = excluded.opsi, benar = excluded.benar, penjelasan = excluded.penjelasan;\n`
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql)
console.log('seed.sql: 11 level,', qs.length, 'soal')
