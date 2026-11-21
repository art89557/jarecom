const {chromium}=require('playwright');const fs=require('fs');
const L1=JSON.parse(fs.readFileSync('src/content/level-1.json','utf8'));
const A='ABCD';
(async()=>{
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
await p.goto('http://localhost:4173/');
await p.screenshot({path:'/tmp/s_splash.png'});
await p.click('text=Lewati');
await p.click('a:has-text("Daftar")');
// validasi
await p.click('button:has-text("Daftar")');
ok(await p.locator('text=Nama wajib diisi').count()===1,'validasi daftar kosong');
await p.fill('#name','Budi Santoso');await p.fill('#email','budi@example.com');await p.fill('#pw','rahasia123');
await p.click('button:has-text("Daftar")');
await p.waitForURL('**/beranda');
ok(await p.locator('text=Selamat datang, Budi').count()===1,'beranda setelah daftar');
ok(await p.locator('[aria-label="Lanjutkan belajar"]').count()===1,'beranda: kartu Lanjutkan belajar');
await p.screenshot({path:'/tmp/s_home.png'});
// peta: level 2 terkunci
await p.click('nav >> text=Materi');
await p.screenshot({path:'/tmp/s_map.png'});
await p.click('button[aria-disabled=true]:has-text("Level 2")',{force:true});
ok(await p.locator('[role=status]:has-text("Level 2 terkunci")').count()===1,'toast level terkunci');
// materi 1
await p.goto('http://localhost:4173/materi/2');
await p.waitForTimeout(800);ok(p.url().endsWith('/materi'),'akses langsung level 2 dialihkan');
await p.click('a[aria-label*="lanjutkan di sini"]');
for(let i=0;i<L1.subtopik.length;i++){
  const s=L1.subtopik[i];
  const wrong=(s.cek.benar+1)%3;
  if(i===0){await p.click(`button.opt:has-text("${s.cek.opsi[wrong]}")`);ok(await p.locator('text=Belum tepat').count()===1,'cek salah memberi umpan balik');
    ok(await p.locator('button:has-text("Sub-topik berikutnya")').isDisabled(),'lanjut nonaktif sebelum benar');}
  await p.click(`button.opt:has-text("${s.cek.opsi[s.cek.benar]}")`);
  if(i===0) await p.screenshot({path:'/tmp/s_material.png'});
  await p.click(i===L1.subtopik.length-1?'button:has-text("Tandai materi selesai")':'button:has-text("Sub-topik berikutnya")');
}
await p.waitForURL('**/selesai');await p.waitForTimeout(600);
ok(await p.locator('text=+20 XP').count()>=1,'+20 XP materi selesai');
await p.screenshot({path:'/tmp/s_done.png'});
// kuis, jawab semua benar
await p.click('a:has-text("Kerjakan kuis Level 1")');
for(let i=0;i<10;i++){
  const k=L1.kuis[i];
  if(i===3){ // satu jawaban salah dulu untuk cek tampilan, lalu ulang kuis nanti
  }
  await p.click(`button.opt:has-text("${k.opsi[k.benar].replace(/"/g,'\\"')}")`);
  await p.click('button:has-text("Periksa jawaban")');
  if(i===3) await p.screenshot({path:'/tmp/s_quizfb.png'});
  await p.click(i===9?'button:has-text("Lihat hasil")':'button:has-text("Soal berikutnya")');
}
await p.waitForURL('**/hasil');
ok(await p.locator('text=+70 XP').count()>=1,'kuis 100: +50 +20 = +70 XP');
ok(await p.locator('text=Level 2 sekarang terbuka').count()===1,'level 2 terbuka');
ok(await p.locator('text=Lencana Level 1 diraih').count()>=1,'hasil: lencana Level 1 diraih');
await p.screenshot({path:'/tmp/s_result.png'});
await p.goto('http://localhost:4173/materi');await p.waitForTimeout(700);await p.screenshot({path:'/tmp/s_map2.png',fullPage:true});
ok(await p.locator('a[aria-label*="lanjutkan di sini"]').count()===1,'peta: satu node aktif di Level 2');
ok(await p.locator('[role=img][aria-label="Lencana emas"]').count()===1,'peta: lencana emas Level 1');
await p.goto('http://localhost:4173/progres');
await p.waitForSelector('[aria-label="Ringkasan progres"]');
ok(await p.locator('[aria-label="90 XP"]').count()===1,'total XP 90 di Progres');
await p.screenshot({path:'/tmp/s_progress.png',fullPage:true});
await p.click('a:has-text("Lencana")');await p.waitForTimeout(300);
ok(await p.locator('text=1 dari 11 lencana').count()===1,'lencana: 1 dari 11');
await p.screenshot({path:'/tmp/s_badge.png',fullPage:true});
await p.click('a:has-text("Ringkasan")');
// reload mempertahankan sesi dan progres
await p.reload();await p.waitForSelector('[aria-label="Ringkasan progres"]');
ok(await p.locator('[aria-label="90 XP"]').count()===1,'progres bertahan setelah reload');
// ulang kuis tidak menambah XP: jawab semua salah (pilih opsi non-benar) -> skor rendah
await p.goto('http://localhost:4173/kuis');
await p.click('button[aria-label*="Level 1"]');
ok(await p.locator('[role=dialog][aria-label="Persiapan kuis Level 1"]').count()===1,'sheet persiapan kuis terbuka');
await p.click('a:has-text("Ulangi kuis")');await p.waitForURL('**/kuis/1');
for(let i=0;i<10;i++){const k=L1.kuis[i];const w=(k.benar+1)%4;
  await p.click(`button.opt:has-text("${k.opsi[w].replace(/"/g,'\\"')}")`);await p.click('button:has-text("Periksa jawaban")');
  await p.click(i===9?'button:has-text("Lihat hasil")':'button:has-text("Soal berikutnya")');}
await p.waitForURL('**/hasil');
ok(await p.locator('h1:has-text("Belum lulus")').count()===1,'skor rendah belum lulus');
await p.goto('http://localhost:4173/progres');await p.waitForSelector('[aria-label="Ringkasan progres"]');
ok(await p.locator('[aria-label="90 XP"]').count()===1,'XP tidak berubah setelah gagal ulang');
// keluar dan masuk lagi, salah sandi
await p.goto('http://localhost:4173/profil');await p.click('main button:has-text("Keluar")');
await p.waitForURL('**/masuk');
await p.fill('#email','budi@example.com');await p.fill('#pw','salahsalah');await p.click('button:has-text("Masuk")');
ok(await p.locator('[role=alert]:has-text("Email atau kata sandi salah")').count()===1,'login salah menampilkan galat');
await p.screenshot({path:'/tmp/s_loginerr.png'});
await p.fill('#pw','rahasia123');await p.click('button:has-text("Masuk")');await p.waitForURL('**/beranda');
ok(true,'login ulang berhasil');
// desktop
const d=await b.newContext({viewport:{width:1440,height:900}});
const dp=await d.newPage();await dp.goto('http://localhost:4173/');
await dp.evaluate(()=>0);
await dp.goto('http://localhost:4173/masuk');await dp.fill('#email','x@y.z');
await b.close();
console.log('errors:',errs.filter(e=>!/Failed to load resource|fonts\.g/.test(e)));
})().catch(e=>{console.error('E2E ERROR',e.message.slice(0,500));process.exit(1)});
