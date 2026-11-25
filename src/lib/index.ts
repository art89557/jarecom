import { localRepo } from './localRepo'
import { supabaseConfigured, supabaseRepo } from './supabaseRepo'
import type { Repo } from './repo'

// Titik pemilihan sumber data: Supabase jika variabel lingkungannya terisi, jika tidak mode demo di perangkat.
// Semua halaman mengimpor `repo` dari sini.
export const repo: Repo = supabaseConfigured ? supabaseRepo : localRepo
