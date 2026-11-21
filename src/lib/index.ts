import { localRepo } from './localRepo'
import { supabaseConfigured, supabaseRepo } from './supabaseRepo'
import type { Repo } from './repo'

export const repo: Repo = supabaseConfigured ? supabaseRepo : localRepo
