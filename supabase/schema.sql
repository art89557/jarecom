-- Jar'ecom: skema, RLS, dan fungsi aturan sistem.
-- Jalankan di Supabase SQL Editor, lalu jalankan supabase/seed.sql.
-- Semua penghitungan XP, skor, dan unlock terjadi di fungsi di bawah (bukan di klien).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.levels (
  kode int primary key check (kode between 1 and 11),
  judul text not null
);

create table if not exists public.quiz_questions (
  level int not null references public.levels(kode),
  nomor int not null,
  pertanyaan text not null,
  opsi jsonb not null,
  benar int not null check (benar between 0 and 3),
  penjelasan text not null default '',
  primary key (level, nomor)
);

create table if not exists public.material_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level int not null references public.levels(kode),
  selesai_at timestamptz not null default now(),
  primary key (user_id, level)
);

create table if not exists public.quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  level int not null references public.levels(kode),
  skor int not null check (skor between 0 and 100),
  lulus boolean not null,
  dibuat_at timestamptz not null default now()
);
create index if not exists quiz_attempts_user_level on public.quiz_attempts (user_id, level);

create table if not exists public.xp_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  level int not null references public.levels(kode),
  jenis text not null check (jenis in ('materi', 'kuis', 'bonus')),
  jumlah int not null,
  dibuat_at timestamptz not null default now(),
  primary key (user_id, level, jenis)
);

-- Posisi baca terakhir per level (jumlah subtopik yang sudah dibuka, maks 20)
create table if not exists public.subtopic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level int not null references public.levels(kode),
  done int not null check (done between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, level)
);

-- Row Level Security: klien hanya membaca barisnya sendiri; tidak ada policy tulis,
-- jadi semua perubahan lewat fungsi security definer.
alter table public.profiles enable row level security;
alter table public.levels enable row level security;
alter table public.quiz_questions enable row level security; -- tanpa policy: kunci jawaban tidak bisa dibaca klien
alter table public.material_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.xp_events enable row level security;
alter table public.subtopic_progress enable row level security; -- tanpa policy: dibaca lewat get_state, ditulis lewat save_position

drop policy if exists "profil sendiri" on public.profiles;
create policy "profil sendiri" on public.profiles for select using (id = (select auth.uid()));
drop policy if exists "ubah profil sendiri" on public.profiles;
create policy "ubah profil sendiri" on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "baca level" on public.levels;
create policy "baca level" on public.levels for select to authenticated using (true);
drop policy if exists "progres sendiri" on public.material_progress;
create policy "progres sendiri" on public.material_progress for select using (user_id = (select auth.uid()));
drop policy if exists "percobaan sendiri" on public.quiz_attempts;
create policy "percobaan sendiri" on public.quiz_attempts for select using (user_id = (select auth.uid()));
drop policy if exists "xp sendiri" on public.xp_events;
create policy "xp sendiri" on public.xp_events for select using (user_id = (select auth.uid()));

-- Profil otomatis saat pendaftaran
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nama) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Level n terbuka: n = 1, atau materi n-1 selesai dan kuis n-1 pernah lulus (skor >= 70)
create or replace function public.is_unlocked(p_user uuid, p_level int) returns boolean
language sql stable security definer set search_path = public as $$
  select p_level = 1 or (
    exists (select 1 from material_progress where user_id = p_user and level = p_level - 1)
    and exists (select 1 from quiz_attempts where user_id = p_user and level = p_level - 1 and lulus)
  );
$$;

create or replace function public.get_state() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'completed', coalesce((select jsonb_agg(level order by level) from material_progress where user_id = auth.uid()), '[]'::jsonb),
    'passed', coalesce((select jsonb_agg(distinct level order by level) from quiz_attempts where user_id = auth.uid() and lulus), '[]'::jsonb),
    'perfect', coalesce((select jsonb_agg(level order by level) from xp_events where user_id = auth.uid() and jenis = 'bonus'), '[]'::jsonb),
    'xp', coalesce((select sum(jumlah) from xp_events where user_id = auth.uid()), 0),
    'best', coalesce((select jsonb_object_agg(level::text, m) from (select level, max(skor) as m from quiz_attempts where user_id = auth.uid() group by level) t), '{}'::jsonb),
    'pos', coalesce((select jsonb_object_agg(level::text, done) from subtopic_progress where user_id = auth.uid()), '{}'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('type', jenis, 'level', level, 'xp', jumlah, 'at', (extract(epoch from dibuat_at) * 1000)::bigint) order by dibuat_at desc) from xp_events where user_id = auth.uid()), '[]'::jsonb)
  );
$$;

-- Tandai materi selesai: +20 XP satu kali per level
create or replace function public.complete_material(p_level int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_new int; v_xp int := 0;
begin
  if v_user is null then raise exception 'Belum masuk'; end if;
  if not is_unlocked(v_user, p_level) then raise exception 'Level masih terkunci'; end if;
  insert into material_progress (user_id, level) values (v_user, p_level) on conflict do nothing;
  insert into xp_events (user_id, level, jenis, jumlah) values (v_user, p_level, 'materi', 20) on conflict do nothing;
  get diagnostics v_new = row_count;
  if v_new = 1 then v_xp := 20; end if;
  return jsonb_build_object('xp_gained', v_xp);
end $$;

-- Simpan posisi baca: hanya bertambah, dibatasi 0..20, dan hanya untuk level yang terbuka
create or replace function public.save_position(p_level int, p_done int) returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Belum masuk'; end if;
  if not is_unlocked(v_user, p_level) then raise exception 'Level masih terkunci'; end if;
  insert into subtopic_progress (user_id, level, done)
  values (v_user, p_level, least(greatest(p_done, 0), 20))
  on conflict (user_id, level) do update
    set done = greatest(subtopic_progress.done, excluded.done), updated_at = now();
end $$;

-- Jawaban kuis yang sedang berjalan. Jawaban pertama per soal dikunci, dan skor dihitung dari tabel ini,
-- bukan dari kiriman klien. Tanpa policy: hanya bisa disentuh lewat fungsi di bawah.
create table if not exists public.quiz_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  level int not null references public.levels(kode),
  nomor int not null,
  pilihan int not null,
  dijawab_at timestamptz not null default now(),
  primary key (user_id, level, nomor)
);
alter table public.quiz_answers enable row level security;

-- Soal tanpa kunci jawaban; hanya jika materi level itu sudah selesai. Membuka kuis = percobaan baru:
-- sisa jawaban percobaan sebelumnya untuk level ini dihapus.
create or replace function public.get_quiz(p_level int) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Belum masuk'; end if;
  if not exists (select 1 from material_progress where user_id = auth.uid() and level = p_level) then
    raise exception 'Selesaikan materi dulu';
  end if;
  delete from quiz_answers where user_id = auth.uid() and level = p_level;
  return (select coalesce(jsonb_agg(jsonb_build_object('pertanyaan', pertanyaan, 'opsi', opsi) order by nomor), '[]'::jsonb)
          from quiz_questions where level = p_level);
end $$;

-- Umpan balik per soal. Jawaban pertama untuk soal itu dicatat dan dikunci; memanggil ulang dengan pilihan lain
-- tidak mengubahnya. Kunci jawaban baru terlihat setelah jawaban terkunci, jadi tidak bisa dipakai untuk soal itu.
create or replace function public.check_answer(p_level int, p_index int, p_choice int) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare r record; v_pick int;
begin
  if auth.uid() is null then raise exception 'Belum masuk'; end if;
  if not exists (select 1 from material_progress where user_id = auth.uid() and level = p_level) then
    raise exception 'Selesaikan materi dulu';
  end if;
  select benar, penjelasan into r from quiz_questions where level = p_level and nomor = p_index + 1;
  if not found then raise exception 'Soal tidak ada'; end if;
  if p_choice is null or p_choice < 0 or p_choice > 3 then raise exception 'Pilihan tidak valid'; end if;
  insert into quiz_answers (user_id, level, nomor, pilihan) values (auth.uid(), p_level, p_index + 1, p_choice)
    on conflict (user_id, level, nomor) do nothing;
  select pilihan into v_pick from quiz_answers where user_id = auth.uid() and level = p_level and nomor = p_index + 1;
  return jsonb_build_object('benar', r.benar, 'penjelasan', r.penjelasan, 'dipilih', v_pick);
end $$;

-- Hitung skor di server dari jawaban yang terkunci (quiz_answers), bukan dari p_answers kiriman klien.
-- Soal yang belum diperiksa dihitung salah. Lulus >= 70: +50 XP (sekali). Skor 100: +20 XP bonus (sekali).
-- p_answers tetap diterima supaya klien lama tidak rusak, tetapi tidak dipakai untuk menilai.
create or replace function public.submit_quiz(p_level int, p_answers int[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_total int; v_correct int; v_score int; v_pass boolean; v_xp int := 0; v_new int;
begin
  if v_user is null then raise exception 'Belum masuk'; end if;
  if not exists (select 1 from material_progress where user_id = v_user and level = p_level) then
    raise exception 'Selesaikan materi dulu';
  end if;
  select count(*) into v_total from quiz_questions where level = p_level;
  if v_total = 0 then raise exception 'Kuis belum tersedia'; end if;
  select count(*) into v_correct from quiz_questions q
    join quiz_answers a on a.user_id = v_user and a.level = q.level and a.nomor = q.nomor
    where q.level = p_level and a.pilihan = q.benar;
  delete from quiz_answers where user_id = v_user and level = p_level;
  v_score := round(v_correct * 100.0 / v_total);
  v_pass := v_score >= 70;
  insert into quiz_attempts (user_id, level, skor, lulus) values (v_user, p_level, v_score, v_pass);
  if v_pass then
    insert into xp_events (user_id, level, jenis, jumlah) values (v_user, p_level, 'kuis', 50) on conflict do nothing;
    get diagnostics v_new = row_count;
    if v_new = 1 then v_xp := v_xp + 50; end if;
  end if;
  if v_score = 100 then
    insert into xp_events (user_id, level, jenis, jumlah) values (v_user, p_level, 'bonus', 20) on conflict do nothing;
    get diagnostics v_new = row_count;
    if v_new = 1 then v_xp := v_xp + 20; end if;
  end if;
  return jsonb_build_object('score', v_score, 'passed', v_pass, 'xp_gained', v_xp, 'correct', v_correct, 'total', v_total);
end $$;

-- Hanya pengguna masuk yang boleh memanggil fungsi
revoke all on function public.is_unlocked(uuid, int), public.get_state(), public.complete_material(int), public.get_quiz(int),
  public.check_answer(int, int, int), public.submit_quiz(int, int[]), public.save_position(int, int) from public, anon;
grant execute on function public.get_state(), public.complete_material(int), public.get_quiz(int),
  public.check_answer(int, int, int), public.submit_quiz(int, int[]), public.save_position(int, int) to authenticated;

-- Indeks untuk foreign key level (saran advisor Supabase: unindexed_foreign_keys)
create index if not exists material_progress_level_idx on public.material_progress (level);
create index if not exists quiz_attempts_level_idx on public.quiz_attempts (level);
create index if not exists subtopic_progress_level_idx on public.subtopic_progress (level);
create index if not exists xp_events_level_idx on public.xp_events (level);
create index if not exists quiz_answers_level_idx on public.quiz_answers (level);

-- Hapus akun sendiri beserta seluruh datanya. Semua tabel progres memakai "on delete cascade" ke auth.users,
-- jadi cukup menghapus baris pengguna di auth.users. Hanya bisa menghapus akun milik pemanggil.
create or replace function public.delete_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Belum masuk'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
