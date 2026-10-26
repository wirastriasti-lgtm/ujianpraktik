/* ================= PENILAIAN FISIK (state) ================= */
const FKEY="fisikPraktik_v1";
let FISIK={};if(!window.ONLINE)try{FISIK=JSON.parse(localStorage.getItem(FKEY)||"{}")||{}}catch(e){FISIK={}}
function simpanFisik(){try{localStorage.setItem(FKEY,JSON.stringify(FISIK))}catch(e){}}
const fKey=h=>h.jab+"|"+h.file;
function nItem(k){const m=String(k.jumlah||"").match(/(\d+)\s*item/i);return m?Number(m[1]):3}
function guideKK(kk){const p=normKK(kk).split(".");return[p[0],p.slice(0,2).join("."),p.slice(0,3).join(".")]}
function fisikDefault(h){const KUNCI=kunciJab(h?h.jab:JAKTIF);return{selesai:false,b:KUNCI.map(k=>({g:[1,1,1,1],s:100,t:nItem(k),cat:""}))}}
function fisikGet(h){const KUNCI=kunciJab(h.jab);const f=FISIK[fKey(h)];return f&&f.b&&f.b.length===KUNCI.length?f:fisikDefault(h)}
function fisikSet(h,f){FISIK[fKey(h)]=f;if(window.ONLINE)ONL.simpanFisik(h,f);else simpanFisik()}
function fisikHapus(h){delete FISIK[fKey(h)];if(window.ONLINE)ONL.hapusFisik(h);else simpanFisik()}
function skorFisik(fb,k){const n=nItem(k);const g=fb.g.reduce((a,x)=>a+x,0);
  const R=g>0?g*25:20,S=fb.s,T=fb.t>0?r2(100*Math.min(fb.t,n)/n):20;return{R,S,T,W:(R+S+T)/3}}
function rataFisik(h){const KUNCI=kunciJab(h.jab);const f=FISIK[fKey(h)];if(!f||!f.selesai||!f.b||f.b.length!==KUNCI.length)return null;return f.b.reduce((a,fb,i)=>a+skorFisik(fb,KUNCI[i]).W,0)/KUNCI.length}

/* ================= STATE ================= */
let semua=[],gagal=[],VIEW="muat",JAKTIF="muda",FSEL=null;
const UI={q:"",filter:"semua",sort:"total",dq:"",donly:false};
const r2=v=>Math.round(v*100)/100;
const fmt=v=>v===null||v===undefined?"–":String(r2(v)).replace(".",",");
const esc=x=>String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $=id=>document.getElementById(id);
const pesertaAktif=()=>semua.filter(h=>h.jab===JAKTIF);
const CEK_COLS=["Y","AC","AD","AE","AH","AI","AJ"];
function cekBerkas(b){return CEK_COLS.some(c=>b.S[c]!==null&&b.S[c]!==undefined&&b.S[c]>20&&b.S[c]<100)||b.cara!=="kode sama"}
function perluCek(h){return h.catatan.length>0||h.berkas.some(cekBerkas)}
function cls(v){return v===null||v===undefined?"":v>=100?"s100":v<=20?"s20":"smid"}
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),3800)}

/* ================= LOAD ================= */
async function muat(list){
  if(!kunciJab(JAKTIF).length){toast("Upload kunci jawaban (file master) dulu.");return}
  const jab=JAKTIF,files=[...list].filter(f=>/\.xls[xm]?$/i.test(f.name)&&!f.name.startsWith("~$"));
  if(!files.length){toast("Tidak ada file Excel yang dipilih.");return}
  VIEW="muat";render();const pg=$("prog"),bar=pg&&pg.querySelector("i"),lbl=$("progl");
  if(pg)pg.style.display="block";
  let ok=0,skip=0;
  for(let i=0;i<files.length;i++){const f=files[i];
    try{const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});
      if(wb.SheetNames.some(n=>/^MasterPraktik/i.test(n))){gagal.push([f.name,"File master/kunci, dilewati. Pakai tombol Upload kunci jawaban."]);skip++;continue}
      const j=semua.findIndex(h=>h.file===f.name&&h.jab===jab);const h=nilaiFile(wb,f.name,jab);if(j>=0)semua[j]=h;else semua.push(h);ok++;if(window.ONLINE)await ONL.simpanPeserta(h);
    }catch(e){gagal.push([f.name,e.message]);skip++}
    if(bar){bar.style.width=(100*(i+1)/files.length)+"%";lbl.textContent=`Memproses ${i+1} dari ${files.length} file…`}
    if(i%5===4)await new Promise(r=>setTimeout(r,0));
  }
  toast(`${ok} peserta dimuat ke ${JAB[jab].label}`+(skip?` · ${skip} file dilewati (lihat Catatan)`:""));
  VIEW="rekap";render();
}
// Kunci per jabatan: tiap jabatan dari sheet MasterPraktik…-nya sendiri (4 berkas, kolom A–N) + notes (comment) sel di sheet itu.
var KUNCI_SHEET="",KUNCI_NOTES=[];
function sinkronJabatan(){KUNCI=kunciJab(JAKTIF);const m=KJ_META[JAKTIF]||{};KUNCI_SHEET=m.sheet||"";KUNCI_NOTES=m.notes||[]}
function bacaSheetKunci(ws){
  const g=grid(ws),k=[];
  for(let r=4;r<g.length;r++){const no=Number(g[r][0]);if(no&&String(g[r][1]).trim()&&String(g[r][3]).trim()&&!k.some(x=>x.no===no))k.push({no,kk:String(g[r][1]).trim(),indeks:String(g[r][2]).trim(),uraian:String(g[r][3]).replace(/\s+/g," ").trim(),kurun:String(g[r][4]).trim(),jumlah:String(g[r][5]).trim(),skka:String(g[r][6]).trim(),aktif:String(g[r][7]).replace(/\s+/g," ").trim(),inaktif:String(g[r][8]).trim(),nasib:String(g[r][9]).replace(/\s+/g," ").trim(),pindah:String(g[r][10]).trim(),musnah:String(g[r][11]).trim(),serah:String(g[r][12]).trim(),itemKunci:String(g[r][13]||"").trim(),baris:r+1})}
  const notes=[];
  Object.keys(ws).filter(a=>a[0]!=="!"&&ws[a]&&ws[a].c&&ws[a].c.length).forEach(a=>{const d=XLSX.utils.decode_cell(a);let judul="";for(let r=Math.min(d.r,6);r>=0;r--){const v=g[r]&&String(g[r][d.c]||"").trim();if(v){judul=v;break}}
    notes.push({sel:a,kol:XLSX.utils.encode_col(d.c),judul,teks:ws[a].c.map(x=>String(x.t||"").replace(/^[^:\n]{1,40}:\s*\n/,"").trim()).join("\n")})});
  notes.sort((x,y)=>XLSX.utils.decode_cell(x.sel).c-XLSX.utils.decode_cell(y.sel).c||XLSX.utils.decode_cell(x.sel).r-XLSX.utils.decode_cell(y.sel).r);
  return{k,notes};
}
// Baca kunci tiap jabatan dari sheet masing-masing → {jab:{terampil:{k,sheet,notes,pinjam},…}, warn:[…]}
function bacaKunciMaster(wb){
  const names=wb.SheetNames;
  if(!names.some(n=>/^MasterPraktik/i.test(n)))throw new Error("file ini bukan master kunci (tidak ada sheet MasterPraktik…). Kemungkinan ini file jawaban peserta — muat lewat tombol Muat jawaban.");
  const cari=j=>{for(const re of JAB_SHEET[j].re){const n=names.find(x=>/^MasterPraktik/i.test(x)&&re.test(x))||names.find(x=>/praktik/i.test(x)&&re.test(x));if(n)return n}return null};
  const jab={},warn=[];
  Object.keys(JAB_SHEET).forEach(j=>{const sn=cari(j);if(!sn)return;const r=bacaSheetKunci(wb.Sheets[sn]);if(r.k.length)jab[j]={k:r.k,sheet:sn,notes:r.notes};else warn.push("Sheet "+sn+" tidak berisi baris kunci")});
  if(!Object.keys(jab).length)throw new Error("baris kunci tidak ditemukan di sheet MasterPraktik mana pun");
  const cad=jab.terampil||jab.penyelia||jab.muda;
  Object.keys(JAB_SHEET).forEach(j=>{if(!jab[j]){jab[j]={k:JSON.parse(JSON.stringify(cad.k)),sheet:cad.sheet,notes:cad.notes,pinjam:true};warn.push("Sheet "+JAB_SHEET[j].label+" tidak ada — "+JAB[j].label+" sementara memakai kunci "+cad.sheet)}});
  Object.keys(jab).forEach(j=>jab[j].k.filter(x=>!pasangJumlah(x.jumlah).length).forEach(x=>warn.push(JAB[j].label+" berkas "+x.no+": parameter jumlah \""+x.jumlah+"\" tidak terbaca")));
  return{jab,warn};
}
function pasangKunciJab(jab){KJ={};KJ_META={};Object.keys(jab).forEach(j=>{KJ[j]=jab[j].k;KJ_META[j]={sheet:jab[j].sheet,notes:jab[j].notes||[],pinjam:!!jab[j].pinjam}});sinkronJabatan()}
async function muatKunci(f){
  try{
    const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});
    const m=bacaKunciMaster(wb);
    if(window.ONLINE){await ONL.simpanKunciBaru(m,f.name);return}
    pasangKunciJab(m.jab);KUNCI_SRC=f.name;muatKataWajib();nilaiUlang();VIEW="kunci";render();
    toast("Kunci dimuat per jabatan — "+Object.keys(m.jab).map(j=>JAB[j].label+": "+m.jab[j].sheet).join(" · ")+(m.warn.length?" · "+m.warn.join("; "):""));
  }catch(e){toast("Gagal membaca kunci: "+e.message)}
}
function nilaiUlang(){semua=semua.map(h=>nilaiParsed(h.parsed,h.file,h.jab))}

/* ================= RENDER ================= */
const VIEWS=[["muat","Muat data"],["rekap","Rekap peserta"],["fisik","Penilaian fisik"],["detail","Rincian per berkas"],["kunci","Kunci & rules"],["cat","Catatan"]].concat(window.ONLINE?[["tim","Tim penilai"]]:[]);
const HEAD={
  muat:["Muat jawaban <em>peserta</em>.","Pilih jabatan di menu atas, pastikan kunci jawaban sudah sesuai angkatan, lalu muat folder berisi file Excel jawaban peserta. Semua diproses di laptop ini — tanpa internet, tanpa unggah ke mana pun."],
  rekap:["Rekap nilai peserta, <em>per jabatan</em>.","Nilai daftar arsip dihitung otomatis terhadap kunci; nilai fisik berkas diisi penilai. Nilai total muncul setelah penilaian fisik ditandai selesai."],
  fisik:["Penilaian fisik <em>berkas</em>.","Semua bagian bawaan benar. Cocokkan folder di tangan dengan kunci di tiap kartu, klik hanya yang salah, lalu tekan Enter untuk lanjut ke peserta berikutnya."],
  detail:["Rincian nilai <em>per berkas</em>.","Setiap nilai disertai alasan dan jawaban asli peserta. Gunakan filter “perlu dicek” untuk melihat nilai di antara 20 dan 100 yang sebaiknya diverifikasi penilai."],
  kunci:["Kunci jawaban & <em>rules</em>.","Kunci dibaca dari file master angkatan. Unsur uraian menentukan seberapa ketat penilaian uraian informasi — sesuaikan bila angkatan berganti."],
  cat:["Catatan & <em>masalah file</em>.","File yang gagal dibaca, sheet yang tidak ditemukan, atau berkas yang tidak bisa dicocokkan dengan kunci."],
  tim:["Tim <em>penilai</em>.","Hanya email yang terdaftar di sini yang bisa membuka data penilaian. Admin bisa menambah atau menghapus penilai."]
};
function render(){
  sinkronJabatan();const hasil=pesertaAktif(),JA=JAB[JAKTIF];
  $("jnav").innerHTML=Object.entries(JAB).map(([k,v])=>`<button class="${k===JAKTIF?"on":""}" data-j="${k}">${v.label}<span class="cnt">${semua.filter(h=>h.jab===k).length}</span></button>`).join("");
  $("jnav").querySelectorAll("button").forEach(b=>b.onclick=()=>{JAKTIF=b.dataset.j;FSEL=null;if(!pesertaAktif().length&&VIEW!=="kunci")VIEW="muat";render()});
  const nFis=hasil.filter(h=>rataFisik(h)!==null).length,nCek=hasil.filter(perluCek).length,nCat=hasil.reduce((a,h)=>a+h.catatan.length,0)+gagal.length;
  const badge={muat:"",rekap:hasil.length,fisik:hasil.length?`${nFis}/${hasil.length}`:"",detail:nCek?nCek:"",kunci:KUNCI.length,cat:nCat||"",tim:""};
  $("snav").innerHTML=VIEWS.map(([k,l])=>`<button class="${k===VIEW?"on":""}" data-v="${k}"><span class="dot"></span>${l}${badge[k]!==""?`<span class="badge ${(k==="cat"&&nCat)||(k==="detail"&&nCek)?"warn":""}">${badge[k]}</span>`:""}</button>`).join("");
  $("snav").querySelectorAll("button").forEach(b=>b.onclick=()=>{VIEW=b.dataset.v;render();window.scrollTo({top:0})});
  $("kcard").innerHTML=(window.ONLINE?ONL.kartuKunci():"")+`<div class="kname">${esc(KUNCI_SRC)}</div><div class="ksub">Kunci ${esc(JA.label)}: ${KUNCI.length} berkas · sheet ${esc(KUNCI_SHEET||"–")}</div>${(KJ_META[JAKTIF]||{}).pinjam?`<div class="ksub" style="color:var(--amber)">Belum ada sheet khusus jabatan ini — sementara memakai kunci TerampilMahirPA.</div>`:""}<div class="kk">${KUNCI.map(k=>`<span class="tag">${esc(k.kk)}</span>`).join("")}</div><button class="btn sm" id="kUp"><span class="plus">+</span> Upload kunci jawaban</button>`;
  $("kUp").onclick=()=>$("fKunci").click();
  if(window.ONLINE&&!ONL.admin)$("kUp").style.display="none";
  if(window.ONLINE)ONL.pasangKartu();
  $("dl").disabled=!hasil.length;

  const [title,lead]=HEAD[VIEW];
  const da=hasil.length?hasil.reduce((a,h)=>a+h.rata,0)/hasil.length:null;
  const compact=["fisik","detail","kunci","cat","tim"].includes(VIEW);
  let out=`<div class="eyebrow">Ujian praktik sertifikasi · ${esc(JA.label)}</div><h1 class="${compact?"sm":""}">${title}</h1><p class="lead ${compact?"sm":""}">${lead}</p>
  ${compact?"":`<div class="actions"><button class="btn" data-act="folder"><span class="plus">+</span> Muat folder jawaban</button><button class="btn" data-act="files"><span class="plus">+</span> Muat file</button><button class="btn" data-act="kunci"><span class="plus">+</span> Upload kunci jawaban</button></div>
  <div class="rule"></div>`}
  ${VIEW==="fisik"||VIEW==="kunci"||VIEW==="cat"||VIEW==="tim"?"":`<div class="kpis">
    <div class="kpi"><div class="kl"><span class="sq" style="background:var(--navy)"></span>Peserta dimuat</div><div class="kv">${hasil.length}</div><div class="ks">${esc(JA.label)} · DA ÷ ${JA.div}</div></div>
    <div class="kpi"><div class="kl"><span class="sq" style="background:var(--green)"></span>Rata-rata daftar arsip</div><div class="kv">${fmt(da)}</div><div class="ks">dinilai otomatis</div></div>
    <div class="kpi"><div class="kl"><span class="sq" style="background:var(--gold)"></span>Fisik selesai</div><div class="kv">${nFis}</div><div class="ks">${hasil.length?Math.round(100*nFis/hasil.length):0}% dari peserta</div></div>
    <div class="kpi"><div class="kl"><span class="sq" style="background:var(--red)"></span>Perlu dicek</div><div class="kv">${nCek}</div><div class="ks">ada nilai di antara 20–100</div></div>
  </div>`}`;
  out+=`<div id="view"></div>`;
  $("main").innerHTML=out;
  $("main").querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>({folder:()=>$("fDir").click(),files:()=>$("fFiles").click(),kunci:()=>$("fKunci").click()})[b.dataset.act]());
  const v=$("view");
  ({muat:vMuat,rekap:vRekap,fisik:vFisik,detail:vDetail,kunci:vKunci,cat:vCat,tim:(v)=>ONL.vTim(v)})[VIEW](v,hasil,JA);
}

function emptyState(v){
  v.innerHTML=`<div class="panel"><div class="empty"><h3>Belum ada peserta di ${esc(JAB[JAKTIF].label)}</h3><div>Muat folder jawaban peserta untuk mulai menilai.</div>
  <div style="margin-top:16px"><button class="btn pri" onclick="document.getElementById('fDir').click()"><span class="plus">+</span> Muat folder jawaban</button></div></div></div>`;
}

function vMuat(v,hasil,JA){
  v.innerHTML=`<div class="drop" id="drop"><h3>Tarik &amp; lepas file jawaban di sini</h3>
    <div class="sub">File akan dinilai sebagai <b>${esc(JA.label)}</b> dengan kunci <b>${esc(KUNCI_SRC)}</b>.</div>
    <div class="actions" style="justify-content:center;margin:16px 0 0"><button class="btn pri" onclick="document.getElementById('fDir').click()"><span class="plus">+</span> Pilih folder</button><button class="btn" onclick="document.getElementById('fFiles').click()">Pilih file</button>${hasil.length&&(!window.ONLINE||ONL.admin)?`<button class="btn ghost" id="rst">Kosongkan ${esc(JA.label)}</button>`:""}</div>
    <div class="prog" id="prog"><i></i></div><div class="sub" id="progl" style="margin-top:6px"></div></div>
  <div class="steps"><div class="step"><span class="no">1</span><b>Pilih jabatan</b><span class="sub">Menu atas: Ahli Muda, Penyelia/Pertama, atau Terampil/Mahir. Komponen nilai mengikuti jabatan.</span></div>
  <div class="step"><span class="no">2</span><b>Cek kunci angkatan</b><span class="sub">Lihat kartu “Kunci jawaban aktif” di samping. Upload master angkatan bila berbeda.</span></div>
  <div class="step"><span class="no">3</span><b>Muat folder jawaban</b><span class="sub">Ratusan file sekaligus. Hasil langsung tampil di Rekap peserta.</span></div></div>`;
  const d=$("drop");
  ["dragover","dragenter"].forEach(e=>d.addEventListener(e,ev=>{ev.preventDefault();d.classList.add("over")}));
  ["dragleave","drop"].forEach(e=>d.addEventListener(e,ev=>{ev.preventDefault();d.classList.remove("over")}));
  d.addEventListener("drop",ev=>muat(ev.dataTransfer.files));
  const r=$("rst");if(r)r.onclick=async()=>{if(window.ONLINE){if(!confirmKosong(JA))return;await ONL.hapusPeserta(JAKTIF)}semua=semua.filter(h=>h.jab!==JAKTIF);FSEL=null;render();toast("Data "+JA.label+" dikosongkan")};
}

const ICON_SEARCH=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
function vRekap(v,hasil){
  if(!hasil.length)return emptyState(v);
  const q=UI.q.toLowerCase();
  let rows=hasil.map(h=>({h,rf:rataFisik(h)})).map(o=>({...o,tot:o.rf===null?null:(o.rf+o.h.rata)/2}));
  rows=rows.filter(o=>!q||o.h.nama.toLowerCase().includes(q)||o.h.file.toLowerCase().includes(q));
  rows=rows.filter(o=>UI.filter==="semua"||(UI.filter==="fbelum"&&o.rf===null)||(UI.filter==="fsudah"&&o.rf!==null)||(UI.filter==="cek"&&perluCek(o.h)));
  const S={total:(a,b)=>(b.tot??-1)-(a.tot??-1)||b.h.rata-a.h.rata,da:(a,b)=>b.h.rata-a.h.rata,nama:(a,b)=>a.h.nama.localeCompare(b.h.nama)};
  rows.sort(S[UI.sort]);
  v.innerHTML=`<div class="panel"><div class="toolbar">
    <div class="search">${ICON_SEARCH}<input id="q" placeholder="Cari nama peserta…" value="${esc(UI.q)}"></div>
    <div class="field"><label>Status</label><select id="flt">${[["semua","Semua peserta"],["fbelum","Fisik belum dinilai"],["fsudah","Fisik selesai"],["cek","Perlu dicek"]].map(([k,l])=>`<option value="${k}" ${UI.filter===k?"selected":""}>${l}</option>`).join("")}</select></div>
    <div class="field"><label>Urutkan</label><select id="srt">${[["total","Nilai total tertinggi"],["da","Nilai DA tertinggi"],["nama","Nama A–Z"]].map(([k,l])=>`<option value="${k}" ${UI.sort===k?"selected":""}>${l}</option>`).join("")}</select></div>
  </div>
  <div class="tw"><table><thead><tr><th class="n">No</th><th>Peserta</th>${KUNCI.map(k=>`<th class="n">DA ${k.no}<div class="sub">${esc(k.kk)}</div></th>`).join("")}<th class="n">Rata DA</th><th class="n">Fisik</th><th class="n">Total</th><th>Status</th></tr></thead><tbody>
  ${rows.map((o,i)=>`<tr><td class="n sub">${i+1}</td><td><span class="nm" data-k="${esc(fKey(o.h))}">${esc(o.h.nama)}</span>${o.h.catatan.length?`<div class="sub" style="color:var(--red)">${esc(o.h.catatan[0])}${o.h.catatan.length>1?` (+${o.h.catatan.length-1})`:""}</div>`:""}</td>
    ${o.h.berkas.map(b=>`<td class="n"><span class="sc ${cls(b.da)}">${fmt(b.da)}</span></td>`).join("")}
    <td class="n big">${fmt(o.h.rata)}</td><td class="n">${o.rf===null?`<button class="btn sm ghost" data-f="${esc(fKey(o.h))}">Nilai fisik</button>`:fmt(o.rf)}</td><td class="n big">${fmt(o.tot)}</td>
    <td>${o.rf===null?'<span class="pill no">Fisik belum</span>':'<span class="pill ok">Lengkap</span>'} ${perluCek(o.h)?'<span class="pill warn">Perlu dicek</span>':""}</td></tr>`).join("")}
  </tbody></table>${rows.length?"":`<div class="empty">Tidak ada peserta yang cocok dengan filter.</div>`}</div>
  <div class="sub" style="margin-top:10px">${rows.length} dari ${hasil.length} peserta · klik nama untuk melihat rincian</div></div>`;
  const qi=$("q");qi.oninput=()=>{UI.q=qi.value;const p=qi.selectionStart;render();const n=$("q");n.focus();n.setSelectionRange(p,p)};
  $("flt").onchange=e=>{UI.filter=e.target.value;render()};$("srt").onchange=e=>{UI.sort=e.target.value;render()};
  v.querySelectorAll(".nm").forEach(el=>el.onclick=()=>{const h=hasil.find(x=>fKey(x)===el.dataset.k);UI.dq=h?h.nama:"";UI.donly=false;VIEW="detail";render();window.scrollTo({top:0})});
  v.querySelectorAll("[data-f]").forEach(el=>el.onclick=()=>{FSEL=el.dataset.f;VIEW="fisik";render();window.scrollTo({top:0})});
}

function vDetail(v,hasil,JA){
  if(!hasil.length)return emptyState(v);
  const q=UI.dq.toLowerCase();
  const rows=hasil.slice().sort((a,b)=>a.nama.localeCompare(b.nama)).filter(h=>!q||h.nama.toLowerCase().includes(q)).flatMap(h=>h.berkas.map(b=>({h,b}))).filter(o=>!UI.donly||cekBerkas(o.b));
  const lim=rows.slice(0,400);
  v.innerHTML=`<div class="panel"><div class="toolbar">
    <div class="search">${ICON_SEARCH}<input id="dq" placeholder="Cari nama peserta…" value="${esc(UI.dq)}"></div>
    <div class="field"><label>Tampilkan</label><select id="donly"><option value="0">Semua berkas</option><option value="1" ${UI.donly?"selected":""}>Hanya yang perlu dicek</option></select></div>
  </div>
  <div class="tw"><table class="dt"><thead><tr><th>Peserta</th><th>Berkas</th>${JA.cols.map(c=>`<th class="k">${c}<div class="sub">${KOMP[c]}</div></th>`).join("")}<th class="n">Nilai DA</th><th>Uraian jawaban</th></tr></thead><tbody>
  ${lim.map(({h,b},i)=>{const baru=i===0||lim[i-1].h!==h;return`<tr class="${baru&&i?"grp":""}"><td>${baru?`<b>${esc(h.nama)}</b>`:`<span class="sub">${esc(h.nama)}</span>`}</td><td><b>${b.no} · ${esc(b.kkKunci)}</b><div class="sub">${esc(b.jaw.kk||"–")} · ${esc(b.cara)}</div></td>
    ${JA.cols.map(c=>{const v=b.S[c],jw=JAWAB[c]?String(b.jaw[JAWAB[c]]||""):"";return`<td class="cell ${v!==null&&v<=20?"low":v!==null&&v<100?"mid":""}"><span class="sc ${cls(v)}">${fmt(v)}</span><div class="why">${esc(b.D[c])}</div>${jw?`<div class="ans" title="${esc(jw)}">“${esc(jw)}”</div>`:""}</td>`}).join("")}
    <td class="n big">${fmt(b.da)}</td><td class="ura">${esc(b.jaw.uraian)}${b.kurang&&b.kurang.length?`<div class="why" style="max-width:none">kurang: ${esc(b.kurang.join(", "))}</div>`:""}</td></tr>`}).join("")}
  </tbody></table>${rows.length?"":`<div class="empty">Tidak ada berkas yang cocok.</div>`}</div>
  <div class="sub" style="margin-top:10px">${rows.length} baris${rows.length>400?" · menampilkan 400 pertama, persempit dengan pencarian":""}</div></div>`;
  const qi=$("dq");qi.oninput=()=>{UI.dq=qi.value;const p=qi.selectionStart;render();const n=$("dq");n.focus();n.setSelectionRange(p,p)};
  $("donly").onchange=e=>{UI.donly=e.target.value==="1";render()};
}

const GL=["Guide primer","Guide sekunder","Guide tersier","Folder"];
function vFisik(v,hasil){
  if(!hasil.length)return emptyState(v);
  const urut=hasil.slice().sort((a,b)=>a.nama.localeCompare(b.nama));
  if(!FSEL||!urut.some(h=>fKey(h)===FSEL))FSEL=fKey(urut.find(h=>rataFisik(h)===null)||urut[0]);
  const h=urut.find(x=>fKey(x)===FSEL),f=JSON.parse(JSON.stringify(fisikGet(h)));
  const sc=f.b.map((fb,i)=>skorFisik(fb,KUNCI[i])),rf=sc.reduce((a,s)=>a+s.W,0)/KUNCI.length;
  const nDone=urut.filter(x=>rataFisik(x)!==null).length;
  v.innerHTML=`<div class="panel"><div class="fx">
   <div><div class="field" style="margin-bottom:10px"><label>Peserta · ${nDone}/${urut.length} selesai</label></div>
    <div class="plist" id="plist">${urut.map(x=>{const r=rataFisik(x);return`<div class="pi ${fKey(x)===FSEL?"on":""}" data-k="${esc(fKey(x))}"><span>${esc(x.nama)}</span>${r===null?(FISIK[fKey(x)]&&FISIK[fKey(x)].oleh?`<span class="sub">dibuka ${esc(String(FISIK[fKey(x)].oleh).split("@")[0])}</span>`:'<span class="sub">belum</span>'):`<span class="pill ok" title="${esc(FISIK[fKey(x)].oleh||"")}">${fmt(r)}</span>`}</div>`}).join("")}</div></div>
   <div>
    <div class="fhead"><div><h2>${esc(h.nama)}</h2><div class="sub">${esc(h.file)}</div></div>
     <div class="mini"><div><span>Fisik${f.selesai?"":" (sementara)"}</span><b>${fmt(rf)}</b></div><div><span>Daftar arsip</span><b>${fmt(h.rata)}</b></div><div><span>Total${f.selesai?"":" (sementara)"}</span><b>${fmt((rf+h.rata)/2)}</b></div></div></div>
    ${f.selesai?'<div class="pill ok" style="margin-bottom:12px">✓ Sudah ditandai selesai — perubahan tersimpan otomatis</div>':'<div class="pill no" style="margin-bottom:12px">Belum ditandai selesai</div>'}
    <div class="bgrid">${KUNCI.map((k,i)=>{const fb=f.b[i],s=sc[i],n=nItem(k),gd=guideKK(k.kk);return`<div class="bc ${f.selesai?"done":""}">
      <div class="bct"><h4>Berkas ${k.no} · ${esc(k.kk)}</h4><span class="w">${fmt(s.W)}</span></div>
      <div class="keyline">Kunci: guide <code>${esc(gd[0])}</code> → <code>${esc(gd[1])}</code> → <code>${esc(gd[2])}</code> · isi <code>${n} item</code></div>
      <div class="keyline">Indeks: <b style="color:var(--ink2)">${esc(k.indeks)}</b></div>
      <div class="asp"><div class="asph"><span>R · Guide &amp; folder <span class="faint">(benar 25 · kurang tepat 12,5 · tidak ada 0)</span></span><b>${fmt(s.R)}</b></div>
        <div class="grow">${GL.map((l,j)=>`<span>${l}${j<3?` <code style="font-size:11px;color:var(--muted)">${esc(gd[j])}</code>`:""}</span><div class="seg">${[[1,"Benar",""],[0.5,"Kurang","half"],[0,"Tidak ada","zero"]].map(([val,lab,c])=>`<button class="${c} ${fb.g[j]===val?"on":""}" data-a="g" data-i="${i}" data-j="${j}" data-v="${val}">${lab}</button>`).join("")}</div>`).join("")}</div></div>
      <div class="asp"><div class="asph"><span>S · Indeks / folder</span><b>${fmt(s.S)}</b></div>
        <div class="seg">${[[100,"Benar",""],[60,"Kurang lengkap","half"],[20,"Salah / tidak ada","zero"]].map(([val,lab,c])=>`<button class="${c} ${fb.s===val?"on":""}" data-a="s" data-i="${i}" data-v="${val}">${lab}</button>`).join("")}</div></div>
      <div class="asp"><div class="asph"><span>T · Item benar di dalam folder</span><b>${fmt(s.T)}</b></div>
        <div class="seg">${Array.from({length:n+1},(_,x)=>n-x).map(val=>`<button class="${val===n?"":val===0?"zero":"half"} ${fb.t===val?"on":""}" data-a="t" data-i="${i}" data-v="${val}">${val} dari ${n}</button>`).join("")}</div></div>
      <input type="text" data-a="c" data-i="${i}" placeholder="Catatan (opsional), mis. guide tersier salah kode" value="${esc(fb.cat)}">
    </div>`}).join("")}</div>
    <div class="fbar"><button class="btn pri" id="fDone">${f.selesai?"Simpan & berikutnya":"Tandai selesai & berikutnya"}</button><button class="btn" id="fPrev">← Sebelumnya</button><button class="btn ghost" id="fReset">Reset peserta ini</button>
     <span class="sub" style="margin-left:auto"><span class="kbd">Enter</span> selesai &amp; lanjut · <span class="kbd">↑</span> <span class="kbd">↓</span> pindah peserta</span></div>
   </div></div></div>`;
  const save=()=>fisikSet(h,f);
  v.querySelectorAll(".pi").forEach(el=>el.onclick=()=>{FSEL=el.dataset.k;render()});
  v.querySelectorAll(".seg button").forEach(el=>el.onclick=()=>{const i=+el.dataset.i,fb=f.b[i],val=+el.dataset.v;
    if(el.dataset.a==="g")fb.g[+el.dataset.j]=val;else if(el.dataset.a==="s")fb.s=val;else fb.t=val;save();render()});
  v.querySelectorAll("input[data-a=c]").forEach(el=>el.onchange=()=>{f.b[+el.dataset.i].cat=el.value;save()});
  $("fDone").onclick=()=>{v.querySelectorAll("input[data-a=c]").forEach(el=>f.b[+el.dataset.i].cat=el.value);f.selesai=true;fisikSet(h,f);
    const ix=urut.findIndex(x=>fKey(x)===FSEL);const nb=urut.slice(ix+1).find(x=>rataFisik(x)===null)||urut.find(x=>rataFisik(x)===null);
    toast(`Fisik ${h.nama}: ${fmt(rf)}`);if(nb)FSEL=fKey(nb);else toast("Semua peserta "+JAB[JAKTIF].label+" sudah dinilai fisiknya.");render()};
  $("fPrev").onclick=()=>{const ix=urut.findIndex(x=>fKey(x)===FSEL);FSEL=fKey(urut[Math.max(0,ix-1)]);render()};
  $("fReset").onclick=()=>{fisikHapus(h);render();toast("Nilai fisik "+h.nama+" direset")};
  const pl=$("plist"),on=pl.querySelector(".on");if(on){const t=on.offsetTop-pl.offsetTop;if(t<pl.scrollTop||t>pl.scrollTop+pl.clientHeight-on.offsetHeight)pl.scrollTop=t-pl.clientHeight/3}
}
document.addEventListener("keydown",e=>{if(VIEW!=="fisik"||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;
  if(e.key==="Enter"){const b=$("fDone");if(b){e.preventDefault();b.click()}}
  else if(e.key==="ArrowDown"||e.key==="ArrowUp"){const u=pesertaAktif().sort((a,b)=>a.nama.localeCompare(b.nama));const i=u.findIndex(x=>fKey(x)===FSEL);const j=Math.min(u.length-1,Math.max(0,i+(e.key==="ArrowDown"?1:-1)));if(u[j]){e.preventDefault();FSEL=fKey(u[j]);render()}}});

function vKunci(v){
  if(!KUNCI.length){v.innerHTML=`<div class="panel"><div class="empty"><h3>Belum ada kunci jawaban</h3><div>${window.ONLINE&&!ONL.admin?"Minta admin mengunggah file master angkatan.":"Upload file master angkatan (sheet MasterPraktik…_TerampilMahirPA)."}</div></div></div>`;return}
  v.innerHTML=`<div class="panel"><p class="sub" style="margin:0 0 12px">Kunci <b>${esc(JAB[JAKTIF].label)}</b> · sumber <b>${esc(KUNCI_SRC)}</b> · sheet <b>${esc(KUNCI_SHEET||"–")}</b> · baris kunci ${KUNCI.map(k=>k.baris||"").filter(Boolean).join(", ")||"5, 8, 11, 14"} · kolom A–N. Parameter jumlah diambil dari kolom F: peserta boleh menulis satu atau beberapa satuan yang ada di kunci.</p><div class="tw kt" style="max-height:none"><table><thead><tr><th>No</th><th>KKA</th><th>Uraian informasi berkas</th><th>Unsur uraian <div class="sub">baris 1 kegiatan/inti · berikutnya subjek wajib · sinonim pakai |</div></th><th>Jumlah <div class="sub">parameter diterima</div></th><th>SKKA</th><th>Retensi aktif / inaktif</th><th>Nasib akhir</th><th>Usul</th></tr></thead><tbody>
  ${KUNCI.map((k,i)=>{const s=statusUsul(k);return`<tr><td class="sub">${k.no}</td><td><b>${esc(k.kk)}</b><div class="sub">${nItem(k)} item</div></td><td style="min-width:200px">${esc(k.uraian)}<div class="sub">Indeks: ${esc(k.indeks)}</div></td>
   <td style="min-width:300px"><textarea class="kw" data-i="${i}" rows="3" ${window.ONLINE&&!ONL.admin?"disabled":""}>${esc(k.unsur)}</textarea>${window.ONLINE&&!ONL.admin?"":`<button class="btn sm ghost kwr" data-i="${i}">Kembalikan otomatis</button>`}</td>
   <td style="min-width:150px">${esc(k.jumlah)}<div style="margin-top:4px">${pasangJumlah(k.jumlah).map(p=>`<span class="tag" style="margin:1px">${esc(p)}</span>`).join(" ")||'<span class="pill bad">tidak terbaca</span>'}</div></td>
   <td>${esc(k.skka)}</td><td>${esc(k.aktif)}<div class="sub">${esc(k.inaktif)}</div></td><td style="min-width:160px">${esc(k.nasib)}</td>
   <td>${["pindah","musnah","serah"].filter(u=>s[u]).map(u=>`<span class="pill no" style="margin:1px">${u}</span>`).join(" ")||"–"}</td></tr>`}).join("")}
  </tbody></table></div>
  <h2 style="font-family:var(--serif);font-weight:500;font-size:24px;margin:26px 0 0">Rules penilaian</h2>
  <ul class="rules">${RULES_TXT.map(r=>`<li>${r}</li>`).join("")}</ul>
  ${KUNCI_NOTES.length?`<h2 style="font-family:var(--serif);font-weight:500;font-size:24px;margin:26px 0 0">Notes di sheet master</h2><p class="sub" style="margin:4px 0 0">Comment sel di sheet ${esc(KUNCI_SHEET)}, dibaca langsung dari file master — dasar rules di atas.</p>
  <ul class="rules">${KUNCI_NOTES.map(n=>`<li><b>${esc(n.sel)}</b>${n.judul?` · ${esc(n.judul)}`:""}<div style="white-space:pre-wrap;margin-top:4px">${esc(n.teks)}</div></li>`).join("")}</ul>`:""}</div>`;
  v.querySelectorAll(".kw").forEach(t=>t.onchange=()=>{const k=KUNCI[+t.dataset.i];k.unsur=t.value.trim()||unsurBawaan(k);simpanKataWajib(k);nilaiUlang();render();toast("Unsur berkas "+k.no+" disimpan, nilai dihitung ulang")});
  v.querySelectorAll(".kwr").forEach(t=>t.onclick=()=>{const k=KUNCI[+t.dataset.i];k.unsur=unsurBawaan(k);delete k.unsurSimpan;HOOK.unsurHapus(k);nilaiUlang();render()});
}
function vCat(v,hasil){
  const rows=hasil.flatMap(h=>h.catatan.map(c=>[h.nama,c])).concat(gagal);
  v.innerHTML=`<div class="panel">${rows.length?`<div class="tw"><table><thead><tr><th>Peserta / file</th><th>Catatan</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty"><h3>Tidak ada catatan</h3>Semua file terbaca dan semua berkas cocok dengan kunci.</div>`}</div>`;
}

/* ================= EXPORT EXCEL ================= */
function unduh(){
  const JA=JAB[JAKTIF],C=JA.cols,hasil=pesertaAktif();
  if(!hasil.length){toast("Belum ada peserta di "+JA.label);return}
  const L=n=>XLSX.utils.encode_col(n);
  const cK1=L(9),cKn=L(8+C.length),cDiv=L(9+C.length),cAK=L(10+C.length);
  const P=[["Nama","File","Jabatan","No Berkas","KK Kunci","R Guide+Folder","S Indeks","T Jumlah Arsip","W Nilai Fisik",
    ...C.map(c=>c+" "+KOMP[c]),"Pembagi","AK Nilai DA",
    "KK Jawaban","Pencocokan","Uraian Jawaban","Kata Kurang","Jumlah Jawaban","Item Isi Berkas","SKKA Jawaban","Aktif Jawaban","Inaktif Jawaban","Nasib Akhir Jawaban",
    ...C.map(c=>"Ket "+c),"Catatan Fisik"]];
  let r=1;
  hasil.forEach(h=>h.berkas.forEach((b,bi)=>{r++;const J=JAB[h.jab];
    const ff=FISIK[fKey(h)],fs=ff&&ff.selesai?skorFisik(ff.b[bi],KUNCI[bi]):null;
    P.push([h.nama,h.file,J.label,b.no,b.kkKunci,fs?fs.R:"",fs?fs.S:"",fs?fs.T:"",{t:"n",v:fs?r2(fs.W):0,f:`SUM(F${r}:H${r})/3`},
      ...C.map(c=>b.S[c]),J.div,{t:"n",v:r2(b.da),f:`SUM(${cK1}${r}:${cKn}${r})/${cDiv}${r}`},
      b.jaw.kk,b.cara,b.jaw.uraian,(b.kurang||[]).join(", "),b.jaw.jumlah,b.item,b.jaw.skka,b.jaw.aktif,b.jaw.inaktif,b.jaw.nasib,
      ...C.map(c=>b.D[c]),ff&&ff.selesai?ff.b[bi].cat:""]);
  }));
  const nB=KUNCI.length;
  const R=[["No","Nama","File","Jabatan","Rata-rata Fisik Berkas","Rata-rata Daftar Arsip","NILAI TOTAL","Status Fisik","Catatan"]];
  hasil.slice().sort((a,b)=>b.rata-a.rata).forEach((h,i)=>{const x=i+2,rf=rataFisik(h);
    R.push([i+1,h.nama,h.file,JAB[h.jab].label,
      {t:"n",v:r2(rf||0),f:`SUMIFS(Penilaian!$I:$I,Penilaian!$B:$B,C${x})/${nB}`},
      {t:"n",v:r2(h.rata),f:`SUMIFS(Penilaian!$${cAK}:$${cAK},Penilaian!$B:$B,C${x})/${nB}`},
      {t:"n",v:r2(((rf||0)+h.rata)/2),f:`(E${x}+F${x})/2`},
      {t:"s",v:rf===null?"Fisik belum lengkap":"Lengkap",f:`IF(COUNTIFS(Penilaian!$B:$B,C${x},Penilaian!$F:$F,"<>")+COUNTIFS(Penilaian!$B:$B,C${x},Penilaian!$G:$G,"<>")+COUNTIFS(Penilaian!$B:$B,C${x},Penilaian!$H:$H,"<>")<${nB*3},"Fisik belum lengkap","Lengkap")`},
      h.catatan.join("; ")]);
  });
  const K=[["No","KK","Indeks","Uraian Informasi Berkas","Unsur Uraian (penilaian Y)","Kurun","Jumlah","SKKA","Aktif","Inaktif","Nasib Akhir","Usul Pindah","Usul Musnah","Usul Serah"],
    ...KUNCI.map(k=>{const s=statusUsul(k);return[k.no,k.kk,k.indeks,k.uraian,k.unsur,k.kurun,k.jumlah,k.skka,k.aktif,k.inaktif,k.nasib,s.pindah?"Ya":"Tidak",s.musnah?"Ya":"Tidak",s.serah?"Ya":"Tidak"]})];
  const RU=[["Rules"],...RULES_TXT.map(t=>[t.replace(/<[^>]+>/g,"")]),[""],["Kunci: "+KUNCI_SRC+" · sheet "+KUNCI_SHEET],...KUNCI_NOTES.map(n=>["Notes "+n.sel+(n.judul?" ("+n.judul+")":"")+": "+n.teks])];
  const wb=XLSX.utils.book_new();
  const ws1=XLSX.utils.aoa_to_sheet(R);ws1["!cols"]=[{wch:5},{wch:40},{wch:40},{wch:22},{wch:14},{wch:14},{wch:12},{wch:18},{wch:60}];
  const ws2=XLSX.utils.aoa_to_sheet(P);ws2["!cols"]=[{wch:34},{wch:30},{wch:16},{wch:6},{wch:10},{wch:9},{wch:9},{wch:9},{wch:9},...C.map(()=>({wch:9})),{wch:8},{wch:9},{wch:10},{wch:14},{wch:50},{wch:30},{wch:10},{wch:8},{wch:14},{wch:20},{wch:12},{wch:30},...C.map(()=>({wch:24})),{wch:30}];
  ws2["!autofilter"]={ref:`A1:${cAK}${r}`};
  const ws3=XLSX.utils.aoa_to_sheet(K);ws3["!cols"]=[{wch:5},{wch:10},{wch:30},{wch:50},{wch:40},{wch:8},{wch:20},{wch:14},{wch:24},{wch:12},{wch:40},{wch:10},{wch:10},{wch:10}];
  const ws4=XLSX.utils.aoa_to_sheet(RU);ws4["!cols"]=[{wch:150}];
  XLSX.utils.book_append_sheet(wb,ws1,"Rekap");XLSX.utils.book_append_sheet(wb,ws2,"Penilaian");
  XLSX.utils.book_append_sheet(wb,ws3,"Kunci");XLSX.utils.book_append_sheet(wb,ws4,"Rules");
  if(gagal.length)XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["File","Masalah"],...gagal]),"Gagal");
  XLSX.writeFile(wb,"Penilaian_Ujian_Praktik_"+JA.label.replace(/[^A-Za-z]+/g,"_")+".xlsx");
  toast("Excel "+JA.label+" diunduh");
}

/* ================= EVENTS ================= */
$("fFiles").onchange=e=>{muat(e.target.files);e.target.value=""};
$("fDir").onchange=e=>{muat(e.target.files);e.target.value=""};
$("fKunci").onchange=e=>{if(e.target.files[0])muatKunci(e.target.files[0]);e.target.value=""};
$("dl").onclick=unduh;
$("fBak").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({versi:1,kunci:KUNCI_SRC,fisik:FISIK},null,1)],{type:"application/json"}));a.download="cadangan_nilai_fisik_"+new Date().toISOString().slice(0,16).replace(/[:T]/g,"-")+".json";a.click();toast("Cadangan nilai fisik diunduh")};
$("fRes").onchange=async e=>{const fl=e.target.files[0];e.target.value="";if(!fl)return;try{const d=JSON.parse(await fl.text());const n=Object.keys(d.fisik||{}).length;Object.assign(FISIK,d.fisik||{});simpanFisik();render();toast(n+" nilai fisik dipulihkan dari cadangan")}catch(err){toast("Cadangan tidak terbaca: "+err.message)}};
function confirmKosong(JA){return window.confirm("Hapus semua data "+JA.label+" untuk kunci ini dari server? Nilai fisik ikut terhapus.")}
if(window.ONLINE){ONL.mulai()}else{muatKataWajib();render();}
