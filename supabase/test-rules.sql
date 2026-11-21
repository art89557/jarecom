-- Uji aturan di Postgres lokal dengan skema auth tiruan (lihat README). Akun uji: 00000000-0000-0000-0000-000000000001
select (select array_agg(case when nomor<=6 then benar else (benar+1)%4 end order by nomor) from public.quiz_questions where level=1)::text as a60,
       (select array_agg(case when nomor<=7 then benar else (benar+1)%4 end order by nomor) from public.quiz_questions where level=1)::text as a70,
       (select array_agg(benar order by nomor) from public.quiz_questions where level=1)::text as a100 \gset
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select 'materi 1', public.complete_material(1);
select 'skor 60', public.submit_quiz(1, :'a60'::int[]);
select 'state', public.get_state();
select 'skor 70', public.submit_quiz(1, :'a70'::int[]);
select 'state', public.get_state();
select 'skor 100', public.submit_quiz(1, :'a100'::int[]);
select 'skor 100 lagi', public.submit_quiz(1, :'a100'::int[]);
select 'state akhir', public.get_state();
select 'materi level 2 (terbuka)', public.complete_material(2);
