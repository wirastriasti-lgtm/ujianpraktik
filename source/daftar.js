/* ================= DAFTAR PESERTA =================
   Daftar resmi peserta (nama, NIP, instansi, jenis sertifikasi, tujuan jabatan).
   File jawaban dicocokkan ke daftar ini; jabatan penilaian diambil dari tujuan jabatan. */
var DAFTAR=[];            // [{id,no,nama,nip,instansi,jenis,tujuan,jab,fileHint,file}]  file = nama file jawaban yang terhubung
const DKEY="daftarPeserta_v1";
if(!window.ONLINE)try{DAFTAR=JSON.parse(localStorage.getItem(DKEY)||"[]")||[]}catch(e){DAFTAR=[]}
function simpanDaftarLokal(){if(!window.ONLINE)try{localStorage.setItem(DKEY,JSON.stringify(DAFTAR))}catch(e){}}

function jabDariTujuan(t){t=String(t||"").toLowerCase();
  if(/muda/.test(t))return"muda";if(/pertama|penyelia/.test(t))return"penyelia";if(/terampil|mahir|pelaksana/.test(t))return"terampil";return null}

/* ---------- baca file daftar peserta ---------- */
// Sumber: template Excel, ekspor sistem, atau langsung surat pemanggilan (.docx, Lampiran I "Daftar Tujuan Surat dan Asesi").
const DPOLA=[["fileHint",/nama\s*file|file\s*jawaban/i],["instansi",/tujuan\s*surat|instansi|unit\s*kerja|satuan\s*kerja|^asal|^unit/i],["nip",/^nip\b|\bnip$/i],
  ["kini",/jabatan\s*(saat\s*ini|sekarang|terakhir|asal)/i],["jenis",/jenis|sertifikasi/i],["tujuan",/uji\s*kompetensi|tujuan\s*jabatan|jabatan\s*(yang\s*)?(dituju|tujuan)|^tujuan$|jenjang/i],
  ["nama",/^(nama(\s*(lengkap|peserta|asesi))?|asesi|peserta)$/i],["no",/^no\.?$/i]];
// tujuan jabatan / uji kompetensi → kunci yang dipakai (PAD = Pengelolaan Arsip Dinamis dinilai dengan kunci Terampil/Mahir/PA)
function jabDariTujuan(t){t=String(t||"").toLowerCase();
  if(/muda/.test(t))return"muda";if(/pertama|penyelia/.test(t))return"penyelia";if(/terampil|mahir|pelaksana|pengelola(an)?\s*arsip|\bpad\b/.test(t))return"terampil";return null}
// jenis sertifikasi bila tidak ada kolomnya: disimpulkan dari jabatan saat ini → uji kompetensi
function jenisDariJabatan(kini,tujuan){const k=String(kini||"").toLowerCase(),t=String(tujuan||"").toLowerCase();if(!t)return"";
  if(/pengelola(an)?\s*arsip|\bpad\b/.test(t))return"Kompetensi Teknis (Pengelolaan Arsip Dinamis)";
  if(/ars[ip]+ar?is|arspiris/.test(k))return"Kenaikan Jenjang";return k?"Perpindahan Jabatan":""}
function tabelDocx(buf){
  const z=XLSX.CFB.read(new Uint8Array(buf),{type:"array"});const e=XLSX.CFB.find(z,"/word/document.xml");if(!e)throw new Error("file .docx tidak berisi dokumen");
  const xml=new TextDecoder("utf-8").decode(e.content),doc=new DOMParser().parseFromString(xml,"application/xml"),W="http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const teks=el=>[...el.getElementsByTagNameNS(W,"p")].map(p=>[...p.getElementsByTagNameNS(W,"t")].map(t=>t.textContent).join("")).join("\n").trim();
  // sel gabungan: gridSpan (melebar ke samping) diulang sebanyak span; vMerge lanjutan (gabung ke bawah) mengambil isi sel di atasnya
  const anak=(el,n)=>[...el.children].filter(c=>c.localName===n);
  return[...doc.getElementsByTagNameNS(W,"tbl")].map(tb=>{const out=[];anak(tb,"tr").forEach(tr=>{const row=[];
    anak(tr,"tc").forEach(tc=>{const pr=anak(tc,"tcPr")[0],gs=pr&&anak(pr,"gridSpan")[0],vm=pr&&anak(pr,"vMerge")[0];
      const span=gs?Number(gs.getAttributeNS(W,"val")||gs.getAttribute("w:val"))||1:1;let t=teks(tc);
      if(vm&&!/restart/.test(vm.getAttributeNS(W,"val")||vm.getAttribute("w:val")||"")&&out.length)t=(out[out.length-1][row.length]??"");
      for(let i=0;i<span;i++)row.push(t)});out.push(row)});return out});
}
function bacaGridPeserta(g,sumber){
  for(let r=0;r<Math.min(g.length,15);r++){
    const lab=(g[r]||[]).map(v=>String(v??"").replace(/\s+/g," ").trim());
    if(!lab.some(l=>/^(nama|asesi|peserta)/i.test(l)&&l.length<=30))continue;
    const col={},used=new Set();
    DPOLA.forEach(([f,re])=>{
      const cand=lab.map((l,i)=>i).filter(i=>!used.has(i)&&lab[i]&&lab[i].length<=40&&re.test(lab[i]));if(!cand.length)return;
      // judul ganda (sel gabungan, mis. "ASESI | ASESI"): pilih kolom yang paling banyak terisi
      const isi=i=>g.slice(r+1).filter(x=>String((x||[])[i]??"").trim()).length;const c=cand.sort((a,b)=>isi(b)-isi(a))[0];col[f]=c;cand.forEach(i=>used.add(i))});
    if(col.nama===undefined)continue;
    const s=(row,f)=>col[f]===undefined?"":String((g[row]||[])[col[f]]??"").trim();
    const rows=[],err=[],warn=[];let disimpulkan=0;
    for(let i=r+1;i<g.length;i++){
      let sel=s(i,"nama");if(!sel)continue;
      // sel nama bisa memuat NIP: "Ratna Dewi P., S.H.\nNIP. 1980…"
      let nip=s(i,"nip").replace(/\D/g,"");const m=sel.match(/NIP\.?\s*:?\s*([\d\s]{18,23})/i)||sel.match(/(\d{18})/);
      if(m){if(!nip)nip=m[1].replace(/\D/g,"");sel=sel.slice(0,m.index)}
      const nama=sel.replace(/\s+/g," ").replace(/[\s,;-]+$/,"").trim();if(!nama||/^(nama|asesi)$/i.test(nama))continue;
      const o={id:"p"+i,no:rows.length+1,nama,nip,instansi:s(i,"instansi").replace(/\s+/g," "),jabatanKini:s(i,"kini").replace(/\s+/g," "),jenis:s(i,"jenis").replace(/\s+/g," "),tujuan:s(i,"tujuan").replace(/\s+/g," "),fileHint:s(i,"fileHint"),file:null};
      if(!o.jenis&&o.tujuan){o.jenis=jenisDariJabatan(o.jabatanKini,o.tujuan);if(o.jenis){o.jenisAuto=true;disimpulkan++}}
      o.jab=jabDariTujuan(o.tujuan);
      if(!o.jab)warn.push(`${nama}: tujuan/uji kompetensi "${o.tujuan||"kosong"}" tidak dikenali — jabatan dipilih saat upload jawaban`);
      rows.push(o);
    }
    if(!rows.length)continue;
    // kolom instansi yang isinya sama untuk semua baris (mis. "Tujuan Surat" = alamat surat, bukan instansi asal) diabaikan
    if(rows.length>3&&rows.every(o=>o.instansi===rows[0].instansi)){if(rows[0].instansi)warn.push(`Kolom instansi berisi teks yang sama untuk semua peserta ("${rows[0].instansi.slice(0,60)}") — diabaikan.`);rows.forEach(o=>o.instansi="")}
    const seen={};rows.forEach(o=>{const k=o.nip||normNama(o.nama);if(seen[k])warn.push(`${o.nama}: tercantum dua kali (no ${seen[k]} dan ${o.no})`);seen[k]=o.no});
    if(col.tujuan===undefined)warn.push("Kolom tujuan jabatan / uji kompetensi tidak ditemukan — jabatan tiap peserta dipilih saat upload jawaban.");
    if(disimpulkan)warn.push(`Jenis sertifikasi ${disimpulkan} peserta disimpulkan dari jabatan saat ini → uji kompetensi (PAD = kompetensi teknis; sudah Arsiparis = kenaikan jenjang; belum Arsiparis = perpindahan jabatan).`);
    return{sheet:sumber,rows,err,warn,kolom:Object.fromEntries(Object.entries(col).map(([f,c])=>[f,XLSX.utils.encode_col(c)]))};
  }
  return null;
}
function bacaDaftarPeserta(wb){
  for(const sn of wb.SheetNames){const r=bacaGridPeserta(grid(wb.Sheets[sn]),sn);if(r)return r}
  throw new Error("kolom Nama/Asesi tidak ditemukan. Pakai template daftar peserta atau surat pemanggilan (.docx) yang memuat Lampiran daftar asesi.");
}
/* ---------- pencocokan file jawaban ↔ peserta ---------- */
const NOISE=new Set(["ujian","praktik","praktek","daftar","arsip","berkas","jawaban","ahli","pertama","muda","terampil","mahir","penyelia","arsiparis","sertifikasi","final","revisi","rev","copy","salinan","fix","new","baru","xlsx","xls","jfa","uji","kompetensi","tes","test","peserta","nama","dan","di","ke"]);
const GELAR=/\b(s|a|d|m)\s*\.?\s*(kom|ap|ip|sos|e|h|pd|si|ak|ikom|i\.?kom|m|t|psi|hum|kes|ag|stp|tr)\b\.?|\b(dr|drs|dra|ir|h|hj|prof|amd|a\.md|se|sh|st|mm|mt|msi|mpa|map|mkom|ssos|skom|sap|sip|spd|mpd|sstp|mh|sh)\b\.?/gi;
function normNama(n){return String(n||"").toLowerCase().replace(/,.*$/,"").replace(GELAR," ").replace(/[^a-z\s]/g," ").replace(/\s+/g," ").trim()}
function tokNama(n){return normNama(n).split(" ").filter(w=>w&&!NOISE.has(w))}
function tokFile(f){return String(f).replace(/\.[^.]+$/,"").toLowerCase().replace(/\(\d+\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(w=>w&&!NOISE.has(w))}
// kecocokan satu kata nama (a = kata di nama peserta, b = kata di nama file):
// 1 = sama / salah ketik 1 huruf (≥5 huruf) / awalan panjang; 0.5 = inisial di nama file ("M." untuk Muhammad); 0 = tidak
function cocokTok(a,b){
  if(a===b)return 1;
  if(a.length===1)return b.startsWith(a)?1:0;                 // inisial di daftar ("Andi Jumiarti L")
  if(b.length===1)return a.startsWith(b)?.5:0;                 // inisial di nama file → setengah
  if(a.length>=5&&b.length>=5&&lev(a,b)<=1)return 1;
  if(a.length>=5&&b.length>=5&&(a.startsWith(b)||b.startsWith(a)))return 1;
  return 0;
}
// skor 0..1 = bagian nama peserta yang muncul di nama file / identitas di dalam file
function skorPeserta(d,teksTok,digits){
  if(d.nip&&digits.includes(d.nip))return{s:1,dasar:"NIP"};
  if(d.fileHint){const fh=tokFile(d.fileHint);if(fh.length&&fh.every(w=>teksTok.some(x=>cocokTok(w,x)===1)))return{s:.99,dasar:"nama file di daftar"}}
  const N=tokNama(d.nama);if(!N.length)return{s:0};
  // nama satu kata (mis. "Weni", "Martini") harus sama persis
  if(N.length===1)return teksTok.includes(N[0])?{s:.9,dasar:"nama (satu kata)"}:{s:0};
  const nilai=N.map(w=>Math.max(0,...teksTok.map(x=>cocokTok(w,x))));
  const utuh=nilai.filter((v,i)=>v===1&&N[i].length>1).length;
  if(!utuh)return{s:0};                                       // minimal satu kata nama utuh
  return{s:nilai.reduce((a,b)=>a+b,0)/N.length,dasar:"nama"};
}
function cocokkanFile(nama,p){
  const teks=nama+" "+(p.identitas?Object.values(p.identitas).join(" "):"");
  const T=tokFile(teks),digits=teks.replace(/\D+/g," ");
  const kand=DAFTAR.map(d=>({d,...skorPeserta(d,T,digits)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||tokNama(b.d.nama).length-tokNama(a.d.nama).length);
  const top=kand[0],dua=kand[1];
  if(!top||top.s<.6)return{d:null,kand:kand.slice(0,5),status:"tidak cocok"};
  // dua nama sama kuat: pilih yang lebih spesifik bila semua katanya ada (mis. "Muhammad Luthfi Al Hadad" vs "Muhammad Luthfi")
  const lebihSpesifik=dua&&top.s>=.99&&dua.s>=.99&&tokNama(top.d.nama).length>tokNama(dua.d.nama).length;
  if(dua&&dua.s>=top.s-.05&&dua.d!==top.d&&!lebihSpesifik)return{d:null,kand:kand.slice(0,5),status:"ragu"};
  return{d:top.d,s:top.s,dasar:top.dasar,kand:kand.slice(0,5),status:top.s>=.99?"pasti":"cocok"};
}
// identitas yang tertulis di file jawaban (mis. "Nama : …", "NIP : …" di baris atas sheet)
function bacaIdentitas(wb){
  const out={};
  for(const sn of wb.SheetNames.slice(0,4)){const g=grid(wb.Sheets[sn]);
    for(let r=0;r<Math.min(g.length,12);r++)(g[r]||[]).forEach((v,c)=>{const t=String(v??"").trim();
      const m=t.match(/^(nama(\s*(lengkap|peserta))?|nip|instansi)\s*(:\s*(.*))?$/i);if(!m)return;
      let val=(m[5]||"").trim();if(!val){for(let k=c+1;k<Math.min(c+5,(g[r]||[]).length);k++){const x=String(g[r][k]??"").replace(/^:\s*/,"").trim();if(x&&x!==":"){val=x;break}}}
      const key=/^nama/i.test(m[1])?"nama":/^nip/i.test(m[1])?"nip":"instansi";if(val&&!out[key])out[key]=val})}
  return out;
}
const pesertaDari=h=>DAFTAR.find(d=>d.file===h.file&&(!d.jab||d.jab===h.jab))||DAFTAR.find(d=>d.file===h.file)||null;
function hubungkan(d,file,jab){DAFTAR.forEach(x=>{if(x!==d&&x.file===file)x.file=null});d.file=file;if(!d.jab)d.jab=jab;d.jabPakai=jab;simpanDaftarLokal();if(window.ONLINE)ONL.simpanLink(d)}
function lepas(d){d.file=null;simpanDaftarLokal();if(window.ONLINE)ONL.simpanLink(d)}
// hubungkan otomatis peserta yang sudah dimuat dengan daftar (setelah daftar diunggah)
function hubungkanOtomatis(){let n=0;semua.forEach(h=>{if(pesertaDari(h))return;const m=cocokkanFile(h.file,h.parsed||{});if(m.d&&!m.d.file&&(!m.d.jab||m.d.jab===h.jab)){hubungkan(m.d,h.file,h.jab);n++}});return n}

/* ---------- dialog pratinjau daftar ---------- */
function dialogDaftar(r,fname){
  return new Promise(res=>{
    const per={};r.rows.forEach(o=>{const k=o.jab||"?";per[k]=(per[k]||0)+1});
    const jenis={};r.rows.forEach(o=>{if(o.jenis)jenis[o.jenis]=(jenis[o.jenis]||0)+1});
    const el=document.createElement("div");el.className="modal";
    el.innerHTML=`<div class="mbox" role="dialog" aria-modal="true"><div class="eyebrow">Periksa daftar peserta</div>
      <h2>${r.err.length?"Daftar <em>belum valid</em>.":`${r.rows.length} peserta <em>siap dipakai</em>.`}</h2>
      <p class="sub" style="font-size:13.5px;margin:0 0 12px">${esc(fname)} · sheet ${esc(r.sheet)} · kolom terbaca: ${Object.entries(r.kolom).filter(([f])=>f!=="no").map(([f,c])=>`${({nama:"nama",nip:"NIP",instansi:"instansi/tujuan surat",kini:"jabatan saat ini",jenis:"jenis sertifikasi",tujuan:"tujuan jabatan/uji kompetensi",fileHint:"nama file"})[f]} ${c}`).join(", ")}</p>
      <div class="chips">${Object.keys(JAB).map(j=>`<span class="pill ok">${JAB[j].label}: ${per[j]||0}</span>`).join(" ")}${per["?"]?`<span class="pill warn">Tujuan tidak dikenali: ${per["?"]}</span>`:""}${Object.entries(jenis).map(([k,n])=>`<span class="pill no">${esc(k)}: ${n}</span>`).join(" ")}</div>
      <div class="tw" style="max-height:40vh;margin-top:12px"><table><thead><tr><th>No</th><th>Nama</th><th>NIP</th><th>Instansi</th><th>Jabatan saat ini</th><th>Tujuan / uji kompetensi</th><th>Jenis sertifikasi</th><th>Dinilai sebagai</th></tr></thead><tbody>
      ${r.rows.slice(0,300).map(o=>`<tr><td class="sub">${o.no}</td><td><b>${esc(o.nama)}</b></td><td class="sub">${esc(o.nip)}</td><td>${esc(o.instansi)}</td><td>${esc(o.jabatanKini||"")}</td><td>${esc(o.tujuan)}</td><td>${esc(o.jenis)}${o.jenisAuto?' <span class="sub">(disimpulkan)</span>':""}</td><td>${o.jab?esc(JAB[o.jab].label):'<span class="pill warn">belum jelas</span>'}</td></tr>`).join("")}</tbody></table></div>
      ${r.err.length?`<ul class="ml bad">${r.err.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:""}${r.warn.length?`<ul class="ml warn">${r.warn.slice(0,20).map(t=>`<li>${esc(t)}</li>`).join("")}${r.warn.length>20?`<li>… dan ${r.warn.length-20} lainnya</li>`:""}</ul>`:""}
      ${DAFTAR.length&&!r.err.length?(()=>{const dobel=r.rows.filter(o=>DAFTAR.some(d=>samaPeserta(d,o))).length;return`<div class="cnote info" style="margin-top:12px">Sudah ada ${DAFTAR.length} peserta di daftar kunci ini. <b>Tambahkan</b> = peserta baru ditambahkan (${r.rows.length-dobel} baru${dobel?`, ${dobel} sudah ada dilewati`:""}). <b>Ganti</b> = daftar lama dihapus dan diganti daftar ini.</div>`})():""}
      <div class="mbar"><button class="btn ghost" data-t="tpl">Unduh template daftar</button><span style="flex:1"></span><button class="btn" data-t="batal">${r.err.length?"Tutup":"Batal"}</button>${r.err.length?"":DAFTAR.length?`<button class="btn" data-t="ganti">Ganti daftar</button><button class="btn pri" data-t="ok">Tambahkan ke daftar</button>`:`<button class="btn pri" data-t="ok">Pakai daftar ini</button>`}</div></div>`;
    document.body.appendChild(el);
    const tutup=v=>{el.remove();res(v)};
    el.querySelector("[data-t=tpl]").onclick=unduhTemplateDaftar;el.querySelector("[data-t=batal]").onclick=()=>tutup(false);
    const ok=el.querySelector("[data-t=ok]");if(ok){ok.onclick=()=>tutup(DAFTAR.length?"tambah":"ganti");ok.focus()}
    const gt=el.querySelector("[data-t=ganti]");if(gt)gt.onclick=()=>tutup("ganti");
  });
}
// peserta yang sama: NIP sama, atau nama (tanpa gelar) sama
function samaPeserta(a,b){if(a.nip&&b.nip)return a.nip===b.nip;return normNama(a.nama)===normNama(b.nama)}
async function tambahKeDaftar(baru){
  const masuk=baru.filter((o,i)=>!DAFTAR.some(d=>samaPeserta(d,o))&&!baru.slice(0,i).some(x=>samaPeserta(x,o)));let no=DAFTAR.reduce((m,d)=>Math.max(m,d.no||0),0);
  masuk.forEach(o=>{o.no=++no;o.id="p"+Date.now().toString(36)+no});
  if(window.ONLINE){const ok=await ONL.tambahDaftar(masuk);if(!ok)return null}else DAFTAR=DAFTAR.concat(masuk);
  return{masuk:masuk.length,lewat:baru.length-masuk.length};
}
/* ---------- tambah satu peserta manual ---------- */
const TUJUAN_OPSI=["Arsiparis Terampil","Arsiparis Mahir","Arsiparis Penyelia","Arsiparis Ahli Pertama","Arsiparis Ahli Muda","Pengelolaan Arsip Dinamis"];
function dialogTambahPeserta(){
  return new Promise(res=>{
    const el=document.createElement("div");el.className="modal cf";
    el.innerHTML=`<div class="cbox tanya" role="dialog" aria-modal="true" style="max-width:560px"><div class="cic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="8" r="4"/><path d="M3 21c0-4 3-6 7-6s7 2 7 6M19 5v6M16 8h6"/></svg></div>
      <div class="eyebrow">Daftar peserta</div><h2>Tambah <em>peserta</em>.</h2>
      <form id="tpF" class="tpf">
        <label class="mfield">Nama<input id="tpN" required placeholder="Nama lengkap, gelar boleh"></label>
        <div class="tp2"><label class="mfield">NIP<input id="tpP" inputmode="numeric" placeholder="18 digit (opsional)"></label>
        <label class="mfield">Instansi<input id="tpI" placeholder="opsional"></label></div>
        <div class="tp2"><label class="mfield">Jabatan saat ini<input id="tpK" list="tpKL" placeholder="mis. Pelaksana"></label>
        <label class="mfield">Uji kompetensi / tujuan<select id="tpT" required><option value="">Pilih…</option>${TUJUAN_OPSI.map(t=>`<option>${t}</option>`).join("")}</select></label></div>
        <datalist id="tpKL"><option>Pelaksana</option>${TUJUAN_OPSI.slice(0,5).map(t=>`<option>${t}</option>`).join("")}</datalist>
        <p class="sub" id="tpInfo" style="margin:-4px 0 0">Jenis sertifikasi dan kunci penilaian ditentukan otomatis.</p>
        <div class="cbar"><span style="flex:1"></span><button type="button" class="btn" data-t="batal">Batal</button><button class="btn pri" type="submit">Tambahkan</button></div></form></div>`;
    document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("in"));
    const tutup=v=>{el.classList.remove("in");setTimeout(()=>el.remove(),140);res(v)};
    const info=()=>{const t=el.querySelector("#tpT").value,k=el.querySelector("#tpK").value,j=jabDariTujuan(t);el.querySelector("#tpInfo").textContent=t?`Jenis: ${jenisDariJabatan(k,t)||"–"} · dinilai dengan kunci ${j?JAB[j].label:"–"}`:"Jenis sertifikasi dan kunci penilaian ditentukan otomatis."};
    el.querySelector("#tpT").onchange=info;el.querySelector("#tpK").oninput=info;
    el.querySelector("[data-t=batal]").onclick=()=>tutup(null);el.onclick=e=>{if(e.target===el)tutup(null)};
    el.querySelector("#tpF").onsubmit=e=>{e.preventDefault();const v=id=>el.querySelector(id).value.trim(),t=v("#tpT"),k=v("#tpK");
      tutup({nama:v("#tpN"),nip:v("#tpP").replace(/\D/g,""),instansi:v("#tpI"),jabatanKini:k,tujuan:t,jenis:jenisDariJabatan(k,t),jenisAuto:true,jab:jabDariTujuan(t),fileHint:"",file:null})};
    setTimeout(()=>el.querySelector("#tpN").focus(),50);
  });
}
async function tambahSatuPeserta(){
  const o=await dialogTambahPeserta();if(!o)return;
  const h=await tambahKeDaftar([o]);if(!h)return;
  if(!h.masuk){toast(o.nama+" sudah ada di daftar");return}
  const n=hubungkanOtomatis();simpanDaftarLokal();render();toast(o.nama+" ditambahkan"+(n?" · langsung terhubung ke file jawabannya":""));
}

async function muatDaftar(f){
  try{
    const buf=await f.arrayBuffer();let r;
    if(/\.docx$/i.test(f.name)){const T=tabelDocx(buf);for(let i=0;i<T.length&&!r;i++)r=bacaGridPeserta(T[i],"tabel "+(i+1)+" di dokumen");if(!r)throw new Error("tidak ada tabel daftar asesi (kolom Nama/Asesi) di dokumen ini.")}
    else{const wb=XLSX.read(buf,{type:"array"});if(wb.SheetNames.some(n=>/^MasterPraktik/i.test(n)))throw new Error("ini file kunci jawaban, bukan daftar peserta.");r=bacaDaftarPeserta(wb)}
    const mode=await dialogDaftar(r,f.name);if(!mode)return;
    let pesan;
    if(mode==="tambah"){const h=await tambahKeDaftar(r.rows);if(!h)return;pesan=`${h.masuk} peserta ditambahkan`+(h.lewat?` · ${h.lewat} sudah ada, dilewati`:"")+` · total ${DAFTAR.length}`}
    else{DAFTAR=r.rows;if(window.ONLINE){const ok=await ONL.simpanDaftar(DAFTAR);if(!ok)return}pesan=`${DAFTAR.length} peserta dimuat`}
    const n=hubungkanOtomatis();simpanDaftarLokal();VIEW="daftar";render();
    toast(pesan+(n?` · ${n} file jawaban langsung terhubung`:""));
  }catch(e){toast("Gagal membaca daftar peserta: "+e.message)}
}
const TEMPLATE_DAFTAR="/*TEMPLATE_DAFTAR*/";
function unduhTemplateDaftar(){const a=document.createElement("a");a.href="data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,"+TEMPLATE_DAFTAR;a.download="Template_Daftar_Peserta.xlsx";document.body.appendChild(a);a.click();a.remove();toast("Template daftar peserta diunduh")}

/* ---------- dialog pencocokan saat upload jawaban ---------- */
// item: {f,p,t(tebakan lama),m(hasil cocok)} → hasil: [{d|null, jab}] per item, atau null bila batal
function dialogCocok(items){
  return new Promise(res=>{
    const urut=items.map((x,i)=>({x,i})).sort((a,b)=>(a.x.m.d?1:0)-(b.x.m.d?1:0));
    const nOk=items.filter(x=>x.m.d).length;
    const opsiPeserta=(x)=>{const ids=new Set(x.m.kand.map(k=>k.d.id));const atas=x.m.kand.map(k=>k.d),sisa=DAFTAR.filter(d=>!ids.has(d.id)).sort((a,b)=>a.nama.localeCompare(b.nama));
      return`<option value="">— tidak ada di daftar —</option>${atas.length?`<optgroup label="Paling mirip">${atas.map(d=>`<option value="${d.id}" ${x.m.d===d?"selected":""}>${esc(d.nama)}${d.instansi?" · "+esc(d.instansi):""}${d.file?" (sudah ada file)":""}</option>`).join("")}</optgroup>`:""}<optgroup label="Semua peserta">${sisa.map(d=>`<option value="${d.id}">${esc(d.nama)}${d.instansi?" · "+esc(d.instansi):""}${d.file?" (sudah ada file)":""}</option>`).join("")}</optgroup>`};
    const jabAwal=x=>x.m.d&&x.m.d.jab?x.m.d.jab:(x.t?x.t.j:JAKTIF);
    const el=document.createElement("div");el.className="modal";
    el.innerHTML=`<div class="mbox" role="dialog" aria-modal="true"><div class="eyebrow">Cocokkan dengan daftar peserta</div>
      <h2>${nOk} dari ${items.length} file <em>cocok</em>.</h2>
      <p class="sub" style="font-size:13.5px;margin:0 0 12px">Jabatan diambil dari tujuan jabatan di daftar. Periksa baris kuning (belum cocok/ragu), pilih pesertanya, lalu lanjutkan.</p>
      <div class="tw" style="max-height:56vh"><table class="ct"><thead><tr><th>File jawaban</th><th>Peserta di daftar</th><th>Dinilai sebagai</th></tr></thead><tbody>
      ${urut.map(({x,i})=>`<tr class="${x.m.d?"":"warnrow"}" data-r="${i}"><td><b>${esc(x.f.name)}</b><div class="sub">${x.m.d?`${x.m.status==="pasti"?"pasti":"cocok"} lewat ${esc(x.m.dasar)}`:x.m.status==="ragu"?"ada beberapa nama mirip — pilih salah satu":"tidak ditemukan di daftar"}</div></td>
        <td><select data-p="${i}" style="min-width:280px;max-width:360px">${opsiPeserta(x)}</select><div class="sub" data-info="${i}">${x.m.d?esc([x.m.d.jenis,x.m.d.tujuan].filter(Boolean).join(" · ")):""}</div></td>
        <td><select data-j="${i}" style="min-width:190px">${Object.keys(JAB).map(j=>`<option value="${j}" ${j===jabAwal(x)?"selected":""}>${JAB[j].label}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>
      <div class="mbar"><span class="sub">Peserta yang tidak ada di daftar tetap dinilai, hanya tidak terhubung.</span><span style="flex:1"></span><button class="btn" data-t="batal">Batal</button><button class="btn pri" data-t="ok">Lanjutkan</button></div></div>`;
    document.body.appendChild(el);
    el.querySelectorAll("select[data-p]").forEach(s=>s.onchange=()=>{const i=s.dataset.p,d=DAFTAR.find(x=>x.id===s.value);
      el.querySelector(`[data-info="${i}"]`).textContent=d?[d.jenis,d.tujuan].filter(Boolean).join(" · "):"";
      if(d&&d.jab)el.querySelector(`select[data-j="${i}"]`).value=d.jab;el.querySelector(`tr[data-r="${i}"]`).classList.toggle("warnrow",!d)});
    const tutup=v=>{el.remove();res(v)};
    el.querySelector("[data-t=batal]").onclick=()=>tutup(null);
    el.querySelector("[data-t=ok]").onclick=()=>tutup(items.map((x,i)=>({d:DAFTAR.find(d=>d.id===el.querySelector(`select[data-p="${i}"]`).value)||null,jab:el.querySelector(`select[data-j="${i}"]`).value})));
    el.querySelector("[data-t=ok]").focus();
  });
}

/* ---------- menu Daftar peserta ---------- */
function vDaftar(v){
  const admin=!window.ONLINE||ONL.admin;
  const ada=d=>d.file&&semua.some(h=>h.file===d.file&&(h.jab===(d.jabPakai||d.jab)||!d.jab));
  const q=(UI.pq||"").toLowerCase(),f=UI.pf||"semua",fj=UI.pj||"semua";
  const tanpa=semua.filter(h=>!pesertaDari(h));
  let rows=DAFTAR.filter(d=>(!q||d.nama.toLowerCase().includes(q)||String(d.instansi).toLowerCase().includes(q))&&(f==="semua"||(f==="sudah"?ada(d):!ada(d)))&&(fj==="semua"||d.jab===fj||(fj==="?"&&!d.jab)));
  const nAda=DAFTAR.filter(ada).length;
  v.innerHTML=`<div class="actions">${admin?`<button class="btn pri" id="dUp"><span class="plus">+</span> Upload daftar peserta</button>`:""}${admin?`<button class="btn" id="dAdd">+ Tambah peserta</button>`:""}<button class="btn" id="dTpl">Unduh template daftar</button>${DAFTAR.length&&semua.length?`<button class="btn" id="dAuto">Hubungkan otomatis</button>`:""}</div>
  <div class="kpis"><div class="kpi"><div class="kl"><span class="sq" style="background:var(--navy)"></span>Di daftar</div><div class="kv">${DAFTAR.length}</div><div class="ks">${Object.keys(JAB).map(j=>`${JAB[j].label.split(" /")[0]} ${DAFTAR.filter(d=>d.jab===j).length}`).join(" · ")}</div></div>
    <div class="kpi"><div class="kl"><span class="sq" style="background:var(--green)"></span>Jawaban masuk</div><div class="kv">${nAda}</div><div class="ks">terhubung ke file jawaban</div></div>
    <div class="kpi"><div class="kl"><span class="sq" style="background:var(--gold)"></span>Belum ada jawaban</div><div class="kv">${DAFTAR.length-nAda}</div><div class="ks">belum diunggah / belum cocok</div></div>
    <div class="kpi"><div class="kl"><span class="sq" style="background:var(--red)"></span>File di luar daftar</div><div class="kv">${tanpa.length}</div><div class="ks">perlu dihubungkan manual</div></div></div>
  ${DAFTAR.length?`<div class="panel"><div class="toolbar">
    <div class="search">${ICON_SEARCH}<input id="pq" placeholder="Cari nama atau instansi…" value="${esc(UI.pq||"")}"></div>
    <div class="field"><label>Jawaban</label><select id="pf">${[["semua","Semua peserta"],["sudah","Sudah ada jawaban"],["belum","Belum ada jawaban"]].map(([k,l])=>`<option value="${k}" ${f===k?"selected":""}>${l}</option>`).join("")}</select></div>
    <div class="field"><label>Jabatan</label><select id="pj">${[["semua","Semua jabatan"],...Object.keys(JAB).map(j=>[j,JAB[j].label]),["?","Tujuan belum jelas"]].map(([k,l])=>`<option value="${k}" ${fj===k?"selected":""}>${l}</option>`).join("")}</select></div></div>
  <div class="tw"><table><thead><tr><th class="n">No</th><th>Nama</th><th>Instansi</th><th>Jenis sertifikasi</th><th>Tujuan jabatan</th><th>File jawaban</th><th class="n">Nilai DA</th></tr></thead><tbody>
  ${rows.map(d=>{const h=d.file?semua.find(x=>x.file===d.file&&(x.jab===(d.jabPakai||d.jab)||!d.jab)):null;
    return`<tr><td class="n sub">${d.no}</td><td><b>${esc(d.nama)}</b>${d.nip?`<div class="sub">NIP ${esc(d.nip)}</div>`:""}</td><td>${esc(d.instansi)}</td><td>${esc(d.jenis)}</td>
    <td>${esc(d.tujuan||"–")}${d.jabatanKini?`<div class="sub">dari ${esc(d.jabatanKini)}</div>`:""}<div class="sub">${d.jab?"dinilai "+esc(JAB[d.jab].label):'<span style="color:var(--amber)">jabatan belum jelas</span>'}</div></td>
    <td>${h?`<span class="pill ok">✓ ada</span> <span class="sub">${esc(h.file)}</span>${admin?` <button class="hpb" style="opacity:.7" data-lepas="${d.id}">lepas</button>`:""}`:`<span class="pill no">belum ada</span>${tanpa.length?` <select class="sm" data-link="${d.id}"><option value="">hubungkan ke file…</option>${tanpa.map(x=>`<option value="${esc(fKey(x))}">${esc(x.file)} (${esc(JAB[x.jab].label.split(" /")[0])})</option>`).join("")}</select>`:""}`}</td>
    <td class="n">${h?`<span class="sc ${cls(h.rata)}">${fmt(h.rata)}</span>`:"–"}</td></tr>`}).join("")}
  </tbody></table>${rows.length?"":`<div class="empty">Tidak ada peserta yang cocok dengan filter.</div>`}</div>
  ${tanpa.length?`<h2 style="font-family:var(--serif);font-weight:500;font-size:22px;margin:24px 0 8px">File jawaban di luar daftar</h2><p class="sub" style="margin:0 0 10px">File ini tetap dinilai, tetapi belum terhubung ke peserta mana pun. Hubungkan lewat kolom "File jawaban" di atas.</p>
    <div class="chips">${tanpa.map(x=>`<span class="pill warn">${esc(x.file)} · ${esc(JAB[x.jab].label.split(" /")[0])}</span>`).join(" ")}</div>`:""}</div>`
  :`<div class="panel"><div class="empty"><h3>Belum ada daftar peserta</h3><div>Upload daftar peserta (nama, jenis sertifikasi, tujuan jabatan). File jawaban yang diunggah nanti otomatis dicocokkan ke daftar ini dan dinilai sesuai tujuan jabatannya.</div>
    <div style="margin-top:16px;display:flex;gap:10px;justify-content:center">${admin?`<button class="btn pri" onclick="document.getElementById('fDaftar').click()"><span class="plus">+</span> Upload daftar peserta</button>`:""}<button class="btn" onclick="unduhTemplateDaftar()">Unduh template daftar</button></div></div></div>`}`;
  const up=$("dUp");if(up)up.onclick=()=>$("fDaftar").click();
  $("dTpl").onclick=unduhTemplateDaftar;const ad=$("dAdd");if(ad)ad.onclick=tambahSatuPeserta;
  const au=$("dAuto");if(au)au.onclick=()=>{const n=hubungkanOtomatis();render();toast(n?n+" file jawaban dihubungkan":"Tidak ada file baru yang cocok")};
  const pq=$("pq");if(pq)pq.oninput=()=>{UI.pq=pq.value;const p=pq.selectionStart;render();const n=$("pq");n.focus();n.setSelectionRange(p,p)};
  const pf=$("pf");if(pf)pf.onchange=e=>{UI.pf=e.target.value;render()};
  const pj=$("pj");if(pj)pj.onchange=e=>{UI.pj=e.target.value;render()};
  v.querySelectorAll("[data-lepas]").forEach(b=>b.onclick=()=>{const d=DAFTAR.find(x=>x.id===b.dataset.lepas);lepas(d);render();toast("Hubungan "+d.nama+" dilepas")});
  v.querySelectorAll("select[data-link]").forEach(s=>s.onchange=async()=>{const d=DAFTAR.find(x=>x.id===s.dataset.link),h=semua.find(x=>fKey(x)===s.value);if(!d||!h)return;
    if(d.jab&&d.jab!==h.jab&&!await konfirmasi({jenis:"tanya",judul:"Jabatan <em>tidak sama</em>",pesan:`<b>${esc(d.nama)}</b> terdaftar sebagai ${esc(JAB[d.jab].label)}, tetapi file <b>${esc(h.file)}</b> dinilai sebagai ${esc(JAB[h.jab].label)}. Tetap hubungkan?`,ok:"Tetap hubungkan"})){render();return}
    hubungkan(d,h.file,h.jab);render();toast(h.file+" → "+d.nama)});
}
