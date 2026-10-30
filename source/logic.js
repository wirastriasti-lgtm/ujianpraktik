/* ================= KUNCI ================= */
// KUNCI & KUNCI_SRC diisi oleh kunci_default.js (versi offline) atau dari Supabase (versi online).
if(typeof KUNCI==="undefined"){var KUNCI=[];var KUNCI_SRC="Belum ada kunci";}
// Kunci per jabatan: tiap jabatan punya sheet master sendiri.
//   terampil  ← MasterPraktik…_TerampilMahirPA  (Terampil / Mahir)
//   penyelia  ← MasterPraktik…_PenyeliaPertama  (Penyelia / Ahli Pertama)
//   muda      ← MasterPraktik…_Muda             (Ahli Muda)
const JAB_SHEET={terampil:{label:"TerampilMahirPA",re:[/TerampilMahir/i,/Ter?a?mpil/i,/Mahir/i]},penyelia:{label:"PenyeliaPertama",re:[/PenyeliaPertama/i,/Penyelia/i,/Pertama/i]},muda:{label:"Muda",re:[/Muda/i]}};
if(typeof KJ==="undefined"){var KJ={terampil:KUNCI,penyelia:KUNCI,muda:KUNCI};var KJ_META={};}
const kunciJab=j=>(KJ&&KJ[j])||[];
// Unsur uraian bawaan per kunci yang sudah direview tim (dicocokkan lewat KK + kata penanda di uraian/indeks).
// UNSUR_PRESET: offline dari kunci_default.js, online dari tabel preset_unsur (setelah login).
if(typeof UNSUR_PRESET==="undefined"){var UNSUR_PRESET=[];}
function unsurBawaan(k){
  const p=UNSUR_PRESET.find(x=>x.kk===normKK(k.kk)&&x.cue.test(String(k.uraian||"")+" "+String(k.indeks||"")));if(p)return p.u;
  // pecah indeks: kata sebelum penanda subjek = kegiatan; sisanya = subjek/objek
  const t=String(k.indeks||k.uraian).replace(/^\s*berkas\s+(tentang\s+)?/i,"").replace(/^\s*(rekomendasi|permohonan|usulan)\s+/i,"");
  const m=t.match(/^(.*?)\s+((di\s+lingkungan|di|pada|kepada|dari|a\.?\s?n\.?|siswa|mahasiswa|pegawai|bpsdm|kementerian|kemen\w*|pemerintah|politeknik|universitas|smk\w*|provinsi|kabupaten|kota|direktorat|dit\.?|sekretariat|badan|dinas)\b.*)$/i);
  const keg=tokens(m?m[1]:t).filter(w=>w!=="berkas"),sub=m?tokens(m[2]).filter(w=>w!=="lingkungan"&&w!=="mahasiswa"&&w!=="siswa"&&w!=="pegawai"):[];
  return "kegiatan: "+keg.join(" ")+(sub.length?"\nsubjek: "+sub.join(" "):"");
}
const kwKey=k=>"unsurUraian|"+k.kk+"|"+k.uraian;
// HOOK: titik simpan. Versi offline = localStorage; versi online (online.js) menimpa dengan Supabase.
const HOOK={unsur:k=>{try{localStorage.setItem(kwKey(k),k.unsur)}catch(e){}},unsurHapus:k=>{try{localStorage.removeItem(kwKey(k))}catch(e){}}};
function muatKataWajib(){[...new Set(Object.values(KJ))].flat().forEach(k=>{let v=null;if(!window.ONLINE)try{v=localStorage.getItem(kwKey(k))}catch(e){}k.unsur=v||k.unsurSimpan||unsurBawaan(k)})}
function simpanKataWajib(k){k.unsurSimpan=k.unsur;HOOK.unsur(k)}
function parseUnsur(txt){return String(txt||"").split(/\n+/).map(l=>l.trim()).filter(Boolean).map(l=>{const m=l.match(/^([^:]+):(.*)$/);const label=m?m[1].trim():"unsur";const alts=(m?m[2]:l).split("|").map(a=>tokens(a).filter(w=>w!=="berkas")).filter(a=>a.length);return{label,alts}}).filter(u=>u.alts.length)}

const ya=v=>/^(ya|y|v|√|✓|x|1|true)$/i.test(String(v||"").trim());
function statusUsul(k){return{
  pindah:k.pindah!==""?ya(k.pindah):true,
  musnah:k.musnah!==""?ya(k.musnah):/^\s*musnah/i.test(k.nasib),
  serah:k.serah!==""?ya(k.serah):/^\s*permanen/i.test(k.nasib)}}

/* ================= KOMPONEN & JABATAN ================= */
const KOMP={
 X:"Kode Klasifikasi",Y:"Uraian Informasi Berkas",Z:"Jumlah (folder)",AB:"SKKA",AC:"Retensi Aktif",AD:"Retensi Inaktif",AE:"Status/Nasib Akhir",AH:"Usul Pindah",AI:"Usul Musnah",AJ:"Usul Serah"};
const KOMP_COLS=Object.keys(KOMP);
const JAWAB={X:"kk",Z:"jumlah",AB:"skka",AC:"aktif",AD:"inaktif",AE:"nasib"};
const JAB={
 muda:{label:"Ahli Muda",cols:KOMP_COLS,div:10},
 penyelia:{label:"Penyelia / Ahli Pertama",cols:["X","Y","Z","AB","AC","AD","AE"],div:7},
 terampil:{label:"Terampil / Mahir",cols:["X","Y","Z","AB"],div:4}
};

/* ================= UTIL TEKS ================= */
const ABBR={stlh:"setelah",sth:"setelah",sblm:"sebelum",kep:"keputusan",kepka:"keputusan kepala",jateng:"jawa tengah",jatim:"jawa timur",jabar:"jawa barat",diy:"daerah istimewa yogyakarta",dki:"daerah khusus ibukota",pemkab:"pemerintah kabupaten",pemprov:"pemerintah provinsi",pemkot:"pemerintah kota",pkl:"praktik kerja lapangan",jfa:"jabatan fungsional arsiparis",smkn:"smk negeri",pns:"pegawai negeri sipil",praktek:"praktik",dilingkungan:"di lingkungan",kab:"kabupaten",prov:"provinsi",kemenpan:"kementerian pendayagunaan aparatur negara",kemenkes:"kementerian kesehatan",kemenko:"kementerian koordinator",polhukam:"politik hukum keamanan",sdmks:"sdm kearsipan sertifikasi",dit:"direktorat",satyalancana:"satya lancana",satyalencana:"satya lancana",lencana:"lancana",stialan:"stia lan",anri:"arsip nasional republik indonesia"};
const STOP=new Set(["di","dan","yang","dari","ke","untuk","pada","dalam","an","a","n","tentang","oleh","dengan"]);
function tokens(s){
  let t=String(s||"").toLowerCase().replace(/\b(smk|sma|smp|sd|man|mtsn?)\s*\.?\s*n\b\.?/g,"$1 negeri").replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(Boolean);
  t=t.flatMap(w=>ABBR[w]?ABBR[w].split(" "):[w]).filter(w=>!STOP.has(w));
  return [...new Set(t)];
}
function lev(a,b){const m=a.length,n=b.length;if(Math.abs(m-n)>1)return 9;const d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
const mirip=(a,b)=>a===b||(a.length>=5&&b.length>=5&&lev(a,b)<=1);
const flat=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
const normKK=s=>String(s||"").toUpperCase().replace(/\s+/g,"").replace(/,/g,".");
const firstNum=s=>{const m=String(s||"").match(/\d+/);return m?m[0]:null};

/* ================= RULES (sesuai notes) ================= */
function nilaiKK(j,k){ // 33 per level; 100 benar; 20 salah
  const a=normKK(j).split("."),b=normKK(k).split(".");
  if(!a[0])return[20,"tidak membuat"];
  let n=0;for(let i=0;i<3;i++)if(a[i]&&a[i]===b[i])n++;
  return n===3?[100,"benar"]:n===0?[20,"salah"]:[33*n,n+" level benar"];
}
function nilaiUraian(j,unsurTxt){ // pola: kegiatan (inti) + subjek/objek; skala notes 100/90/80/70/60/20
  const J=tokens(j);
  if(!J.length)return[20,"tidak membuat",[]];
  const U=parseUnsur(unsurTxt);if(!U.length)return[100,"unsur kunci belum diisi",[]];
  const hasil=U.map((u,i)=>{let best=null;u.alts.forEach(a=>{const ada=a.filter(w=>J.some(x=>mirip(w,x)));const r=ada.length/a.length;if(!best||r>best.r)best={r,kurang:a.filter(w=>!ada.includes(w))}});
    const st=best.r===1?"lengkap":best.r>=0.5?"kurang sebagian":"hilang";return{label:u.label,st,kurang:best.kurang,inti:i===0}});
  const kurang=hasil.filter(x=>x.st!=="lengkap").flatMap(x=>x.kurang);
  const ket=hasil.filter(x=>x.st!=="lengkap").map(x=>x.label+" "+x.st).join("; ");
  if(hasil[0].st==="hilang")return[20,"salah ("+hasil[0].label+" tidak sesuai)",kurang];
  const pot=hasil.reduce((a,x)=>a+(x.st==="hilang"?20:x.st==="kurang sebagian"?10:0),0);
  const n=Math.max(60,100-pot);
  return[n,n===100?"semua unsur lengkap":ket,kurang];
}

const SATUAN={folder:"folder",foder:"folder",fodler:"folder",map:"folder",berkas:"berkas",item:"item",arsip:"item",naskah:"item"};
function pasangJumlah(s){const out=[];String(s||"").toLowerCase().replace(/(\d+)\s*([a-z]+)/g,(m,n,u)=>{out.push(Number(n)+" "+(SATUAN[u]||u));return m});return out}
function nilaiFolder(j,k){
  const J=String(j||"").trim();if(!J)return[20,"tidak membuat"];
  if(flat(J)===flat(k))return[100,"sama dengan kunci"];
  const kunci=new Set(pasangJumlah(k)),jaw=pasangJumlah(J);
  if(!jaw.length)return[20,"salah (tanpa angka/satuan)"];
  const salah=jaw.filter(x=>!kunci.has(x));
  return salah.length?[20,"salah ("+salah.join(", ")+")"]:[100,"benar ("+jaw.join(", ")+")"];
}
function tingkatSKKA(s){s=String(s||"").toLowerCase();return /sangat\s*rahasia/.test(s)?"Sangat Rahasia":/rahasia/.test(s)?"Rahasia":/terbatas/.test(s)?"Terbatas":/biasa|terbuka/.test(s)?"Biasa/Terbuka":""}
function nilaiSKKA(j,k){if(!String(j||"").trim())return[20,"tidak membuat"];const a=tingkatSKKA(j),b=tingkatSKKA(k);if(!a)return[20,"tidak dikenali"];return a===b?[100,"benar"]:[20,"salah, kunci "+b]}
function nilaiSama(j,k){if(!String(j||"").trim())return[20,"tidak membuat"];return flat(j)===flat(k)?[100,"benar"]:[20,"salah"]}
// helper: status satu unsur keterangan (lengkap / kurang sebagian / hilang)
function statusKet(jaw,ketKunci){
  const K=tokens(ketKunci).filter(w=>w!=="berkas"&&!/^\d+$/.test(w));
  if(!K.length)return{st:"lengkap",kurang:[]};
  const J=tokens(jaw);const kurang=K.filter(w=>!J.some(x=>mirip(w,x)));const r=1-kurang.length/K.length;
  return{st:r===1?"lengkap":r>=0.5?"kurang sebagian":"hilang",kurang};
}
// Keterangan retensi/nasib akhir (syarat "setelah …", pengecualian "kecuali …"):
// cukup ada minimal satu kata kunci keterangan → dianggap lengkap (ditulis singkat atau panjang nilainya sama);
// keterangan tidak ada sama sekali → 50 (mengikuti form penilaian manual).
const KET_UMUM=new Set(["setelah","sesudah","kecuali","masuk","ditetapkan","habis","berakhir","selesai","berlaku","menjadi","sejak","tahun","bulan","hari","masa","permanen","musnah","dinilai","kembali","daftar"]);
function adaKet(jaw,ketKunci){
  const all=tokens(ketKunci).filter(w=>w!=="berkas"&&!/^\d+$/.test(w));
  if(!all.length)return{ada:true,cocok:[],kunci:[]};
  const inti=all.filter(w=>!KET_UMUM.has(w)),K=inti.length?inti:all;
  const J=tokens(jaw);const cocok=K.filter(w=>J.some(x=>mirip(w,x)||(x.length>=3&&w.startsWith(x))));
  return{ada:cocok.length>0,cocok,kunci:K};
}
const NILAI_KET_KURANG=50;
const SAT_WAKTU={tahun:"tahun",thn:"tahun",th:"tahun",bulan:"bulan",bln:"bulan",hari:"hari"};
function jangka(s){const m=String(s||"").toLowerCase().match(/(\d+)\s*(tahun|thn|th|bulan|bln|hari)\b/);return m?Number(m[1])+" "+SAT_WAKTU[m[2]]:null}
function nilaiRetensi(j,k){ // inti = jangka waktu; unsur = keterangan syarat (mis. "setelah SK ditetapkan")
  if(!String(j||"").trim())return[20,"tidak membuat"];
  const jk=jangka(k),jj=jangka(j);
  if(jk&&jj!==jk)return[20,"jangka waktu salah (kunci "+jk+")"];
  const ketK=String(k).replace(/(\d+)\s*(tahun|thn|th|bulan|bln|hari)\b/i,"");
  const s=adaKet(j,ketK);
  return s.ada?[100,"benar"]:[NILAI_KET_KURANG,"jangka benar, keterangan tidak ada ("+ketK.trim()+")"];
}
function jenisNasib(s){s=String(s||"").toLowerCase();const m=s.match(/musnah|permanen|serah|statis|dinilai\s*kembali/);if(!m)return"";return/permanen|serah|statis/.test(m[0])?"permanen":m[0].startsWith("dinilai")?"dinilai kembali":"musnah"}
function nilaiNasib(j,k){ // inti = jenis nasib akhir; unsur = pengecualian ("kecuali ...")
  if(!String(j||"").trim())return[20,"tidak membuat"];
  const a=jenisNasib(j),b=jenisNasib(k);
  if(!a)return[20,"jenis nasib akhir tidak dikenali"];
  if(a!==b)return[20,"salah (kunci "+b+")"];
  const m=String(k).match(/kecuali(.*)$/is);
  if(!m)return[100,"benar"];
  const s=adaKet(String(j).replace(/^\s*\S+/,""),m[1]);
  return s.ada?[100,"benar"]:[NILAI_KET_KURANG,"jenis benar, pengecualian tidak ada (kecuali "+m[1].trim()+")"];
}
function nilaiUsul(adaSheet,row,seharusnya,k,jenis){
  if(!adaSheet)return[20,"sheet tidak dibuat"];
  const masuk=!!row;
  if(masuk!==seharusnya)return[20,seharusnya?"seharusnya dicantumkan":"seharusnya tidak dicantumkan"];
  if(!seharusnya)return[100,"tidak dicantumkan (benar)"];
  // berkas tepat → isi baris dibandingkan dengan kunci
  const cek=[];
  // uraian & SKKA tidak dinilai ulang di daftar usul (sudah dinilai di DAFTAR BERKAS), supaya satu kesalahan tidak terhitung berkali-kali
  if(row.tahun!==null){const th=String(k.kurun).match(/\d{4}/g)||[];cek.push(["tahun",row.tahun&&th.every(y=>row.tahun.includes(y))?100:20])}
  if(row.jumlah!==null)cek.push(["jumlah",nilaiFolder(row.jumlah,k.jumlah)[0]]);
  if(jenis==="musnah"){
    if(row.aktif!==null)cek.push(["retensi aktif",nilaiRetensi(row.aktif,k.aktif)[0]]);
    if(row.inaktif!==null)cek.push(["retensi inaktif",nilaiRetensi(row.inaktif,k.inaktif)[0]]);
  }
  if((jenis==="musnah"||jenis==="serah")&&row.nasib!==null)cek.push(["nasib akhir",nilaiNasib(row.nasib,k.nasib)[0]]);
  if(!cek.length)return[100,"tercantum (benar)"];
  const n=Math.round(cek.reduce((a,c)=>a+c[1],0)/cek.length*100)/100;
  const kurang=cek.filter(c=>c[1]<100).map(c=>c[0]+" "+c[1]);
  return[n,"tercantum; "+(kurang.length?"isi: "+kurang.join(", "):"isi sesuai kunci")];
}

/* ================= BACA FILE JAWABAN ================= */
function grid(ws){return XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false,blankrows:true})}
function cariSheet(wb,fn){return wb.SheetNames.find(n=>fn(n.toUpperCase()))}
function cariHeader(g,re){for(let r=0;r<Math.min(g.length,40);r++){const c=g[r].findIndex(v=>re.test(String(v)));if(c>=0)return[r,c]}return null}
function kolom(g,hr,re,startCol=0){for(const r of [hr,hr+1])if(g[r])for(let c=startCol;c<g[r].length;c++)if(re.test(String(g[r][c]).trim()))return c;return -1}

function bacaDaftarBerkas(g){
  const h=cariHeader(g,/kode\s*klasifikasi/i);if(!h)return null;
  const hr=h[0];
  const col={kk:h[1],uraian:kolom(g,hr,/uraian/i),jumlah:kolom(g,hr,/^jumlah/i),skka:kolom(g,hr,/keamanan/i),
    aktif:kolom(g,hr,/^(retensi\s*)?(arsip\s*)?(jra\s*)?aktif$/i),inaktif:kolom(g,hr,/^(retensi\s*)?(arsip\s*)?(jra\s*)?in\s*-?\s*aktif$/i),nasib:kolom(g,hr,/nasib|keterangan\s*akhir|status\s*akhir/i)};
  const rows=[];let kosong=0;
  for(let r=hr+1;r<g.length&&kosong<5;r++){
    const kk=String(g[r][col.kk]||"").trim();
    if(!kk||/aktif|kode/i.test(kk)){if(rows.length)kosong++;continue}
    kosong=0;const o={};for(const k in col)o[k]=col[k]>=0?String(g[r][col[k]]||"").trim():"";rows.push(o);
  }
  return rows;
}
function bacaIsiBerkas(g){
  const h=cariHeader(g,/kode\s*klasifikasi/i);if(!h)return{};
  const hr=h[0],cKK=h[1],cU=kolom(g,hr,/uraian/i);const cnt={};let cur=null;
  for(let r=hr+1;r<g.length;r++){
    const kk=normKK(g[r][cKK]);if(/^[A-Z]{2}\.\d/.test(kk))cur=kk;
    if(cur&&cU>=0&&String(g[r][cU]).trim())cnt[cur]=(cnt[cur]||0)+1;
  }
  return cnt;
}
function bacaUsul(g){
  const h=cariHeader(g,/kode\s*klasifikasi/i);if(!h)return new Map();
  const hr=h[0];
  const col={kk:h[1],uraian:kolom(g,hr,/uraian/i),tahun:kolom(g,hr,/tahun|kurun/i),jumlah:kolom(g,hr,/^jumlah/i),skka:kolom(g,hr,/keamanan/i),
    aktif:kolom(g,hr,/^(retensi\s*)?(arsip\s*)?aktif$/i),inaktif:kolom(g,hr,/^(retensi\s*)?(arsip\s*)?in\s*-?\s*aktif$/i),nasib:kolom(g,hr,/nasib/i)};
  const m=new Map();
  for(let r=hr+1;r<g.length;r++){const kk=normKK(g[r][col.kk]);if(!/^[A-Z]{2}\.\d/.test(kk)||m.has(kk))continue;
    const o={_col:col};for(const k in col)o[k]=col[k]>=0?String(g[r][col[k]]||"").trim():null;m.set(kk,o)}
  return m;
}
function namaDariFile(f){return f.replace(/\.[^.]+$/,"").replace(/^daftar[_\s-]*arsip[_\s-]*/i,"").replace(/_/g," ").replace(/\s+/g," ").trim()}

// parseWb: baca isi file jawaban jadi data polos (bisa disimpan sebagai JSON / dikirim ke Supabase)
function parseWb(wb){
  const catatan=[];
  const sDB=cariSheet(wb,n=>/BERKAS/.test(n)&&!/ISI/.test(n)&&!/USUL/.test(n));
  const sIsi=cariSheet(wb,n=>/ISI/.test(n));
  const sP=cariSheet(wb,n=>/PINDAH/.test(n)),sM=cariSheet(wb,n=>/MUSNAH/.test(n)),sS=cariSheet(wb,n=>/SERAH/.test(n));
  let db=sDB?bacaDaftarBerkas(grid(wb.Sheets[sDB])):null;
  if(!db){catatan.push("Sheet DAFTAR BERKAS tidak ditemukan / kolom Kode Klasifikasi tidak ada");db=[]}
  const isi=sIsi?bacaIsiBerkas(grid(wb.Sheets[sIsi])):{};
  if(!sIsi)catatan.push("Sheet DAFTAR ISI BERKAS tidak ditemukan");
  const obj=m=>m?Object.fromEntries([...m].map(([k,v])=>{const o={...v};delete o._col;return[k,o]})):null;
  const usul={pindah:sP?obj(bacaUsul(grid(wb.Sheets[sP]))):null,musnah:sM?obj(bacaUsul(grid(wb.Sheets[sM]))):null,serah:sS?obj(bacaUsul(grid(wb.Sheets[sS]))):null};
  return{v:1,db,isi,usul,catatan};
}
function nilaiFile(wb,file,jabKey){return nilaiParsed(parseWb(wb),file,jabKey)}
function nilaiParsed(p,file,jabKey){
  const KUNCI=kunciJab(jabKey);
  const catatan=[...p.catatan],db=p.db,isi=p.isi,usul=p.usul;
  const J=JAB[jabKey];
  if(jabKey==="muda")["pindah","musnah","serah"].forEach(u=>{if(!usul[u])catatan.push("Sheet usul "+u+" tidak ditemukan")});
  const used=new Set();
  const berkas=KUNCI.map(k=>{
    let idx=db.findIndex((r,i)=>!used.has(i)&&normKK(r.kk)===normKK(k.kk)),cara="kode sama";
    if(idx<0){ // cari padanan lewat uraian
      let best=-1,bs=0;db.forEach((r,i)=>{if(used.has(i))return;const K=tokens(k.uraian+" "+k.indeks).filter(w=>w!=="berkas");const s=tokens(r.uraian).filter(w=>K.some(x=>mirip(w,x))).length;if(s>bs){bs=s;best=i}});
      if(bs>=2){idx=best;cara="dipadankan lewat uraian";}
    }
    const r=idx>=0?db[idx]:{kk:"",uraian:"",jumlah:"",skka:"",aktif:"",inaktif:"",nasib:""};
    if(idx>=0)used.add(idx);else catatan.push(`Berkas ${k.no} (${k.kk}) tidak ditemukan di DAFTAR BERKAS`);
    const st=statusUsul(k),kkJ=normKK(r.kk);
    const S={},D={};
    [S.X,D.X]=nilaiKK(r.kk,k.kk);
    let kurang;[S.Y,D.Y,kurang]=nilaiUraian(r.uraian,k.unsur);
    [S.Z,D.Z]=nilaiFolder(r.jumlah,k.jumlah);
    [S.AB,D.AB]=nilaiSKKA(r.skka,k.skka);
    [S.AC,D.AC]=nilaiRetensi(r.aktif,k.aktif);
    [S.AD,D.AD]=nilaiRetensi(r.inaktif,k.inaktif);
    [S.AE,D.AE]=nilaiNasib(r.nasib,k.nasib);
    [S.AH,D.AH]=nilaiUsul(!!usul.pindah,usul.pindah&&kkJ?usul.pindah[kkJ]:null,st.pindah,k,"pindah");
    [S.AI,D.AI]=nilaiUsul(!!usul.musnah,usul.musnah&&kkJ?usul.musnah[kkJ]:null,st.musnah,k,"musnah");
    [S.AJ,D.AJ]=nilaiUsul(!!usul.serah,usul.serah&&kkJ?usul.serah[kkJ]:null,st.serah,k,"serah");
    KOMP_COLS.forEach(c=>{if(!J.cols.includes(c)){S[c]=null}});
    const da=J.cols.reduce((a,c)=>a+S[c],0)/J.div;
    return{no:k.no,kkKunci:k.kk,cara:idx>=0?cara:"tidak ditemukan",S,D,da,jaw:r,kurang,item:kkJ?(isi[kkJ]||0):0};
  });
  // koreksi manual penilai & tanda "sudah dicek" (VER diisi ui.js / online.js)
  const V=(typeof VER!=="undefined"&&VER&&VER[jabKey+"|"+file])||null;
  berkas.forEach(b=>{b.kor={};b.cek=null;if(!V)return;
    const kb=V.kor&&V.kor[b.no];
    if(kb)Object.entries(kb).forEach(([c,o])=>{if(!J.cols.includes(c)||o==null||o.v===undefined)return;b.kor[c]={auto:b.S[c],autoD:b.D[c],...o};b.S[c]=Number(o.v);b.D[c]="dikoreksi"+(o.alasan?": "+o.alasan:"")+" · otomatis "+String(b.kor[c].auto).replace(".",",")});
    if(Object.keys(b.kor).length)b.da=J.cols.reduce((a,c)=>a+b.S[c],0)/J.div;
    b.cek=(V.cek&&V.cek[b.no])||null;});
  const rata=KUNCI.length?berkas.reduce((a,b)=>a+b.da,0)/KUNCI.length:0;
  return{nama:namaDariFile(file),file,jab:jabKey,berkas,rata,catatan,parsed:p};
}

