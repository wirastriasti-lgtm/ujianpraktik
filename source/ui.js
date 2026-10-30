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
const UI={q:"",filter:"semua",rs:{k:"total",d:-1},dq:"",donly:false,ds:{k:null,d:-1}};
// judul kolom yang bisa diklik untuk mengurutkan: klik pertama tertinggi dulu, klik lagi terendah dulu
function thSort(st,key,label,cls){const on=st.k===key;return`<th class="srt ${cls||""} ${on?"on":""}" data-s="${key}" title="Klik untuk mengurutkan">${label}<span class="arr">${on?(st.d<0?" ▼":" ▲"):" ↕"}</span></th>`}
function pasangSort(v,st){v.querySelectorAll("th.srt").forEach(th=>th.onclick=e=>{if(e.target.closest("input,button,select"))return;const k=th.dataset.s;if(st.k===k)st.d=-st.d;else{st.k=k;st.d=k==="nama"?1:-1}render()})}
const r2=v=>Math.round(v*100)/100;
const fmt=v=>v===null||v===undefined?"–":String(r2(v)).replace(".",",");
const esc=x=>String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $=id=>document.getElementById(id);
const pesertaAktif=()=>semua.filter(h=>h.jab===JAKTIF);
const CEK_COLS=["Y","AC","AD","AE","AH","AI","AJ"];
// berkas yang sebaiknya diverifikasi penilai: ada nilai di antara 20–100 (otomatis) atau berkas dipadankan lewat uraian
function cekBerkas(b){return CEK_COLS.some(c=>{const v=b.kor&&b.kor[c]?b.kor[c].auto:b.S[c];return v!==null&&v!==undefined&&v>20&&v<100})||b.cara!=="kode sama"}
const sisaCek=b=>cekBerkas(b)&&!b.cek;
function perluCek(h){return h.berkas.some(sisaCek)||(h.catatan.length>0&&!h.berkas.every(b=>b.cek))}

/* ================= VERIFIKASI: koreksi nilai & tanda sudah dicek ================= */
const VKEY="verifikasiPraktik_v1";
var VER={};if(!window.ONLINE)try{VER=JSON.parse(localStorage.getItem(VKEY)||"{}")||{}}catch(e){VER={}}
const siapa=()=>window.ONLINE&&ONL.email?ONL.email:"penilai";
function verGet(h){return VER[fKey(h)]||(VER[fKey(h)]={kor:{},cek:{}})}
function verSimpan(h){const k=fKey(h);if(window.ONLINE)ONL.simpanVer(h,VER[k]);else try{localStorage.setItem(VKEY,JSON.stringify(VER))}catch(e){}
  const i=semua.findIndex(x=>fKey(x)===k);if(i>=0)semua[i]=nilaiParsed(semua[i].parsed,semua[i].file,semua[i].jab)}
function setKoreksi(h,no,c,o){const V=verGet(h);V.kor[no]=V.kor[no]||{};if(o)V.kor[no][c]=o;else{delete V.kor[no][c];if(!Object.keys(V.kor[no]).length)delete V.kor[no]}verSimpan(h)}
function setCek(h,no,on){const V=verGet(h);if(on)V.cek[no]={oleh:siapa(),t:new Date().toISOString()};else delete V.cek[no];verSimpan(h)}
const fmtT=t=>{try{return new Date(t).toLocaleString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}catch(e){return""}};
function dialogKoreksi(h,b,c){
  const k=kunciJab(h.jab)[b.no-1]||{},kor=b.kor[c],auto=kor?kor.auto:b.S[c],jw=JAWAB[c]?String(b.jaw[JAWAB[c]]||""):c==="Y"?b.jaw.uraian:"";
  const kunciTeks={X:k.kk,Y:k.uraian,Z:k.jumlah,AB:k.skka,AC:k.aktif,AD:k.inaktif,AE:k.nasib}[c]||"";
  const el=document.createElement("div");el.className="modal";
  el.innerHTML=`<div class="mbox sm" role="dialog" aria-modal="true"><div class="eyebrow">Koreksi nilai · ${esc(c)} ${esc(KOMP[c])}</div>
    <h2>${esc(h.nama)}</h2><p class="sub" style="font-size:13.5px;margin:0 0 14px">Berkas ${b.no} · ${esc(b.kkKunci)} · nilai otomatis <b>${fmt(auto)}</b> (${esc(kor?kor.autoD:b.D[c])})</p>
    ${kunciTeks||jw?`<div class="kv2">${kunciTeks?`<div><span>Kunci</span>${esc(kunciTeks)}</div>`:""}${jw?`<div><span>Jawaban peserta</span>${esc(jw)}</div>`:""}</div>`:""}
    <label class="mfield" style="max-width:none">Nilai<div class="qv">${[100,90,80,70,60,50,33,20].map(n=>`<button class="btn sm" data-q="${n}">${n}</button>`).join("")}<input id="kV" type="number" min="0" max="100" step="0.01" value="${kor?kor.v:auto}"></div></label>
    <label class="mfield" style="max-width:none">Alasan koreksi<input id="kA" value="${esc(kor?kor.alasan||"":"")}" placeholder="mis. sinonim yang diterima tim, salah ketik wajar"></label>
    ${kor?`<p class="sub" style="margin:-6px 0 0">Dikoreksi ${esc(kor.oleh||"")} · ${esc(fmtT(kor.t))}</p>`:""}
    <div class="mbar">${kor?`<button class="btn ghost" data-t="hapus">Kembalikan ke otomatis</button>`:""}<span style="flex:1"></span><button class="btn" data-t="batal">Batal</button><button class="btn pri" data-t="ok">Simpan koreksi</button></div></div>`;
  document.body.appendChild(el);
  const tutup=()=>{el.remove();document.removeEventListener("keydown",kd)},kd=e=>{if(e.key==="Escape")tutup();if(e.key==="Enter"&&e.target.tagName==="INPUT")el.querySelector("[data-t=ok]").click()};document.addEventListener("keydown",kd);
  el.onclick=e=>{if(e.target===el)tutup()};
  el.querySelectorAll("[data-q]").forEach(x=>x.onclick=()=>{el.querySelector("#kV").value=x.dataset.q;el.querySelector("#kA").focus()});
  el.querySelector("[data-t=batal]").onclick=tutup;
  const hp=el.querySelector("[data-t=hapus]");if(hp)hp.onclick=()=>{setKoreksi(h,b.no,c,null);tutup();render();toast("Nilai "+c+" berkas "+b.no+" kembali ke otomatis")};
  el.querySelector("[data-t=ok]").onclick=()=>{const v=Number(el.querySelector("#kV").value),a=el.querySelector("#kA").value.trim();
    if(!(v>=0&&v<=100)){el.querySelector("#kV").focus();return}if(!a){el.querySelector("#kA").focus();el.querySelector("#kA").placeholder="Alasan wajib diisi";return}
    setKoreksi(h,b.no,c,{v,alasan:a,oleh:siapa(),t:new Date().toISOString()});setCek(h,b.no,true);tutup();render();toast(`${h.nama}: ${c} berkas ${b.no} dikoreksi ${fmt(auto)} → ${fmt(v)}`)};
  setTimeout(()=>{const i=el.querySelector("#kV");i.focus();i.select()},0);
}
function cls(v){return v===null||v===undefined?"":v>=100?"s100":v<=20?"s20":"smid"}
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),3800)}

/* ================= LOAD ================= */
// Tebak jabatan peserta dari nama file, lalu dari isi file (sheet usul → Muda; kolom retensi/nasib terisi → Penyelia/Pertama)
function tebakJabatan(nama,p){
  const n=String(nama).toLowerCase().replace(/[_\-.]+/g," ");
  if(/\bahli\s*muda\b|\bmuda\b/.test(n))return{j:"muda",dasar:"nama file"};
  if(/\bahli\s*pertama\b|\bpertama\b|\bpenyelia\b/.test(n))return{j:"penyelia",dasar:"nama file"};
  if(/\bterampil\b|\bmahir\b|\bpelaksana\b/.test(n))return{j:"terampil",dasar:"nama file"};
  if(p.usul&&Object.values(p.usul).some(u=>u&&Object.keys(u).length))return{j:"muda",dasar:"ada daftar usul pindah/musnah/serah"};
  if((p.db||[]).some(r=>r.aktif||r.inaktif||r.nasib))return{j:"penyelia",dasar:"kolom retensi/nasib akhir terisi",lemah:true};
  if((p.db||[]).length)return{j:"terampil",dasar:"hanya sampai SKKA",lemah:true};
  return null;
}
function dialogJabatan(beda){
  return new Promise(res=>{
    const el=document.createElement("div");el.className="modal";
    el.innerHTML=`<div class="mbox" role="dialog" aria-modal="true"><div class="eyebrow">Periksa jabatan</div><h2>${beda.length} file sepertinya <em>bukan ${esc(JAB[JAKTIF].label)}</em>.</h2>
      <p class="sub" style="font-size:13.5px;margin:0 0 14px">Kunci dan pembagi nilai berbeda per jabatan. Pilih jabatan tiap file sebelum dinilai.</p>
      <div class="tw" style="max-height:52vh"><table><thead><tr><th>File</th><th>Terdeteksi</th><th>Nilai sebagai</th></tr></thead><tbody>${beda.map((x,i)=>`<tr><td><b>${esc(x.f.name)}</b></td><td>${esc(JAB[x.t.j].label)}<div class="sub">dari ${esc(x.t.dasar)}</div></td>
        <td><select data-i="${i}" style="min-width:200px">${Object.keys(JAB).map(j=>`<option value="${j}" ${j===x.t.j?"selected":""}>${JAB[j].label}${j===JAKTIF?" (tab aktif)":""}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>
      <div class="mbar"><button class="btn ghost" data-t="tetap">Semua tetap ${esc(JAB[JAKTIF].label)}</button><span style="flex:1"></span><button class="btn" data-t="batal">Batal</button><button class="btn pri" data-t="ok">Lanjutkan</button></div></div>`;
    document.body.appendChild(el);
    const tutup=v=>{el.remove();res(v)};
    el.querySelector("[data-t=batal]").onclick=()=>tutup(null);
    el.querySelector("[data-t=tetap]").onclick=()=>tutup(beda.map(()=>JAKTIF));
    el.querySelector("[data-t=ok]").onclick=()=>tutup([...el.querySelectorAll("select[data-i]")].map(s=>s.value));
    el.querySelector("[data-t=ok]").focus();
  });
}
async function muat(list){
  if(!kunciJab(JAKTIF).length){toast("Upload kunci jawaban (file master) dulu.");return}
  const files=[...list].filter(f=>/\.xls[xm]?$/i.test(f.name)&&!f.name.startsWith("~$"));
  if(!files.length){toast("Tidak ada file Excel yang dipilih.");return}
  VIEW="muat";render();const pg=$("prog"),bar=pg&&pg.querySelector("i"),lbl=$("progl");
  if(pg)pg.style.display="block";
  const baca=[];let skip=0;
  for(let i=0;i<files.length;i++){const f=files[i];
    try{const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});
      if(wb.SheetNames.some(n=>/^MasterPraktik/i.test(n))){gagal.push([f.name,"File master/kunci, dilewati. Pakai tombol Upload kunci jawaban."]);skip++;continue}
      const p=parseWb(wb);baca.push({f,p,t:tebakJabatan(f.name,p)});
    }catch(e){gagal.push([f.name,e.message]);skip++}
    if(bar){bar.style.width=(100*(i+1)/files.length)+"%";lbl.textContent=`Membaca ${i+1} dari ${files.length} file…`}
    if(i%5===4)await new Promise(r=>setTimeout(r,0));
  }
  // file yang jabatannya terdeteksi beda dengan tab aktif (deteksi lemah dari isi kolom hanya dipakai bila Muda/Penyelia diunggah di tab Terampil, atau Terampil di tab Muda)
  const beda=baca.filter(x=>x.t&&x.t.j!==JAKTIF&&(!x.t.lemah||JAKTIF==="terampil"||x.t.j==="terampil"&&JAKTIF==="muda"));
  let pilih=beda.map(()=>JAKTIF);
  if(beda.length){pilih=await dialogJabatan(beda);if(!pilih){VIEW="muat";render();toast("Upload dibatalkan");return}}
  const jabOf=x=>{const i=beda.indexOf(x);return i>=0?pilih[i]:JAKTIF};
  const per={};let ok=0;
  for(const x of baca){const jab=jabOf(x);
    if(!kunciJab(jab).length){gagal.push([x.f.name,"Kunci "+JAB[jab].label+" belum ada"]);skip++;continue}
    const j=semua.findIndex(h=>h.file===x.f.name&&h.jab===jab);const h=nilaiParsed(x.p,x.f.name,jab);if(j>=0)semua[j]=h;else semua.push(h);ok++;per[jab]=(per[jab]||0)+1;
    if(window.ONLINE)await ONL.simpanPeserta(h);
  }
  const ke=Object.entries(per).map(([j,n])=>n+" ke "+JAB[j].label).join(", ");
  if(per[JAKTIF]===undefined&&Object.keys(per).length===1)JAKTIF=Object.keys(per)[0];
  toast(`${ok} peserta dimuat${ke?" ("+ke+")":""}`+(skip?` · ${skip} file dilewati (lihat Catatan)`:""));
  VIEW="rekap";render();
}
// Kunci per jabatan: tiap jabatan dari sheet MasterPraktik…-nya sendiri (4 berkas, kolom A–N) + notes (comment) sel di sheet itu.
var KUNCI_SHEET="",KUNCI_NOTES=[];
function sinkronJabatan(){KUNCI=kunciJab(JAKTIF);const m=KJ_META[JAKTIF]||{};KUNCI_SHEET=m.sheet||"";KUNCI_NOTES=m.notes||[]}
// Kolom kunci dicari dari teks judul (baris judul bisa 1–2 baris); kalau judul tidak dikenali, pakai posisi baku A–P.
const KOLPOLA=[["unsurO",/unsur.*(kegiatan|inti)|kegiatan\s*\/\s*inti/i],["unsurP",/unsur.*subjek|subjek\s*wajib/i],["item",/item/i],["skka",/skka|keamanan/i],["kk",/kode\s*klasifikasi|\bkka\b/i],["indeks",/^indeks/i],["uraian",/uraian/i],["kurun",/kurun/i],["jumlah",/^jumlah/i],["inaktif",/in\s*-?\s*aktif/i],["aktif",/aktif/i],["nasib",/nasib|status\s*akhir|keterangan\s*akhir/i],["pindah",/pindah/i],["musnah",/musnah/i],["serah",/serah/i],["no",/^no\.?$/i]];
const KOL_BAKU={no:0,kk:1,indeks:2,uraian:3,kurun:4,jumlah:5,skka:6,aktif:7,inaktif:8,nasib:9,pindah:10,musnah:11,serah:12,item:13,unsurO:14,unsurP:15};
function petaKolom(g){
  const isNo=v=>/^\d+$/.test(String(v??"").trim());
  for(let r=0;r<Math.min(g.length,12);r++){
    const a=g[r]||[],nx=g[r+1]||[],dua=!isNo(nx[0]);
    const w=Math.max(a.length,dua?nx.length:0);
    const labels=Array.from({length:w},(_,c)=>(String(a[c]??"")+" "+(dua?String(nx[c]??""):"")).replace(/\s+/g," ").trim());
    const pendek=l=>l&&l.length<=45;
    if(!labels.some(l=>pendek(l)&&/kode\s*klasifikasi|\bkka\b/i.test(l))||!labels.some(l=>pendek(l)&&/uraian/i.test(l)))continue;
    const col={},used=new Set();
    KOLPOLA.forEach(([f,re])=>{const c=labels.findIndex((l,i)=>!used.has(i)&&pendek(l)&&re.test(l));if(c>=0){col[f]=c;used.add(c)}});
    if(Object.keys(col).length<4)continue;
    if(col.no===undefined)col.no=0;
    return{col,mulai:r+(dua?2:1),judul:true};
  }
  return{col:KOL_BAKU,mulai:4,judul:false};
}
function bacaSheetKunci(ws){
  const g=grid(ws),k=[],cacat=[],P=petaKolom(g),C=P.col;
  const s=(r,f)=>C[f]===undefined?"":String((g[r]||[])[C[f]]??"").trim();
  for(let r=P.mulai;r<g.length;r++){
    const no=Number(s(r,"no")),adaIsi=["kk","indeks","uraian","kurun","jumlah","skka","aktif","inaktif","nasib"].some(f=>s(r,f));
    if(!no){continue}
    if(!s(r,"kk")||!s(r,"uraian")){if(adaIsi)cacat.push({baris:r+1,no,msg:"baris "+(r+1)+": "+(!s(r,"kk")?"kode klasifikasi":"uraian")+" kosong, berkas ini dilewati"});continue}
    if(k.some(x=>x.no===no)){cacat.push({baris:r+1,no,msg:"baris "+(r+1)+": nomor berkas "+no+" dobel"});continue}
    const o={no,kk:s(r,"kk"),indeks:s(r,"indeks"),uraian:s(r,"uraian").replace(/\s+/g," "),kurun:s(r,"kurun"),jumlah:s(r,"jumlah"),skka:s(r,"skka").replace(/\s+/g," "),aktif:s(r,"aktif").replace(/\s+/g," "),inaktif:s(r,"inaktif").replace(/\s+/g," "),nasib:s(r,"nasib").replace(/\s+/g," "),pindah:s(r,"pindah"),musnah:s(r,"musnah"),serah:s(r,"serah"),itemKunci:s(r,"item"),baris:r+1};
    const uO=s(r,"unsurO"),uP=s(r,"unsurP");if(uO){o.unsurSimpan="kegiatan: "+uO.replace(/\n+/g," | ")+(uP?"\nsubjek: "+uP.replace(/\n+/g," | "):"");o.unsurTemplate=true}
    k.push(o);
  }
  const notes=[];
  Object.keys(ws).filter(a=>a[0]!=="!"&&ws[a]&&ws[a].c&&ws[a].c.length).forEach(a=>{const d=XLSX.utils.decode_cell(a);let judul="";for(let r=Math.min(d.r,6);r>=0;r--){const v=g[r]&&String(g[r][d.c]||"").trim();if(v){judul=v;break}}
    notes.push({sel:a,kol:XLSX.utils.encode_col(d.c),judul,teks:ws[a].c.map(x=>String(x.t||"").replace(/^[^:\n]{1,40}:\s*\n/,"").trim()).join("\n")})});
  notes.sort((x,y)=>XLSX.utils.decode_cell(x.sel).c-XLSX.utils.decode_cell(y.sel).c||XLSX.utils.decode_cell(x.sel).r-XLSX.utils.decode_cell(y.sel).r);
  return{k,notes,cacat,kolom:P.judul?Object.fromEntries(Object.entries(C).map(([f,c])=>[f,XLSX.utils.encode_col(c)])):null};
}
// Baca kunci tiap jabatan dari sheet masing-masing → {jab:{terampil:{k,sheet,notes,pinjam,cacat},…}, warn:[…]}
function bacaKunciMaster(wb){
  const names=wb.SheetNames;
  if(!names.some(n=>/^MasterPraktik/i.test(n)))throw new Error("file ini bukan master/template kunci (tidak ada sheet MasterPraktik…). Kemungkinan ini file jawaban peserta. Unduh template kunci bila perlu.");
  const cari=j=>{for(const re of JAB_SHEET[j].re){const n=names.find(x=>/^MasterPraktik/i.test(x)&&re.test(x))||names.find(x=>/praktik/i.test(x)&&re.test(x));if(n)return n}return null};
  const jab={},kosong=[];
  Object.keys(JAB_SHEET).forEach(j=>{const sn=cari(j);if(!sn)return;const r=bacaSheetKunci(wb.Sheets[sn]);if(r.k.length)jab[j]={k:r.k,sheet:sn,notes:r.notes,cacat:r.cacat,kolom:r.kolom};else kosong.push({j,sn,cacat:r.cacat})});
  if(!Object.keys(jab).length)throw new Error("tidak ada berkas kunci yang terisi (kode klasifikasi + uraian) di sheet MasterPraktik mana pun");
  const cad=jab.terampil||jab.penyelia||jab.muda;
  Object.keys(JAB_SHEET).forEach(j=>{if(!jab[j]){const ks=kosong.find(x=>x.j===j);jab[j]={k:JSON.parse(JSON.stringify(cad.k)),sheet:cad.sheet,notes:cad.notes,pinjam:true,cacat:ks?ks.cacat:[],sheetKosong:ks?ks.sn:null}}});
  return{jab,warn:[]};
}
// Validasi isi kunci per jabatan. error = kunci ditolak; peringatan = boleh dipakai setelah dicek.
const YA_RE=/^(ya|y|v|√|✓|x|1|true)$/i,TIDAK_RE=/^(tidak|t|n|no|-|0|false)$/i;
function validasiKunci(m){
  const out={};
  Object.keys(JAB_SHEET).forEach(j=>{
    const x=m.jab[j],E=[],W=[];out[j]={E,W};
    (x.cacat||[]).forEach(c=>E.push(c.msg));
    if(x.pinjam){W.push(x.sheetKosong?"Sheet "+x.sheetKosong+" kosong":"Sheet "+JAB_SHEET[j].label+" tidak ada");W.push("Sementara memakai kunci dari "+x.sheet+". Isi sheet jabatan ini bila kuncinya berbeda.");return}
    if(x.k.length!==4)W.push("Berisi "+x.k.length+" berkas (biasanya 4). Nilai DA dibagi "+x.k.length+".");
    const kkSeen={};
    x.k.forEach(k=>{
      const t="Berkas "+k.no+" ("+(k.kk||"–")+"): ",kk=normKK(k.kk);
      if(!/^[A-Z]{2}(\.\d{2}){1,3}$/.test(kk))E.push(t+"kode klasifikasi \""+k.kk+"\" tidak berformat XX.00.00");
      if(kkSeen[kk])E.push(t+"kode klasifikasi sama dengan berkas "+kkSeen[kk]+" — berkas peserta dicocokkan lewat kode ini");kkSeen[kk]=k.no;
      if(k.uraian.length<12)W.push(t+"uraian sangat pendek (\""+k.uraian+"\")");
      if(!k.indeks&&!k.unsurSimpan)W.push(t+"indeks kosong — unsur uraian disusun dari uraian, cek di menu Kunci & rules");
      if(!/\d{4}/.test(k.kurun))W.push(t+"kurun waktu \""+(k.kurun||"kosong")+"\" tidak memuat tahun (dipakai untuk usul)");
      if(!pasangJumlah(k.jumlah).length)E.push(t+"jumlah \""+(k.jumlah||"kosong")+"\" tidak terbaca. Contoh: 3 item/1 Folder/1 Berkas");
      else if(!/\d+\s*item/i.test(k.jumlah))W.push(t+"jumlah tidak memuat 'item' — penilaian fisik T memakai 3 item");
      if(!tingkatSKKA(k.skka))E.push(t+"SKKA \""+(k.skka||"kosong")+"\" tidak dikenali (Biasa/Terbuka, Terbatas, Rahasia, Sangat Rahasia)");
      if(j!=="terampil"){
        if(!jangka(k.aktif))E.push(t+"retensi aktif \""+(k.aktif||"kosong")+"\" tidak memuat angka + tahun/bulan");
        if(!jangka(k.inaktif))E.push(t+"retensi inaktif \""+(k.inaktif||"kosong")+"\" tidak memuat angka + tahun/bulan");
        if(!jenisNasib(k.nasib))E.push(t+"nasib akhir \""+(k.nasib||"kosong")+"\" tidak dikenali (Musnah / Permanen / Dinilai kembali)");
      }
      if(j==="muda")["pindah","musnah","serah"].forEach(u=>{const v=String(k[u]||"").trim();if(v&&!YA_RE.test(v)&&!TIDAK_RE.test(v))E.push(t+"usul "+u+" \""+v+"\" harus Ya/Tidak atau kosong")});
      if(k.unsurTemplate&&!parseUnsur(k.unsurSimpan).length)E.push(t+"unsur uraian (kolom O) tidak terbaca");
    });
  });
  return out;
}
// Dialog pratinjau + hasil validasi sebelum kunci dipakai
function dialogKunci(m,fname){
  return new Promise(res=>{
    const V=validasiKunci(m),nE=Object.values(V).reduce((a,v)=>a+v.E.length,0),nW=Object.values(V).reduce((a,v)=>a+v.W.length,0);
    const a=String(fname).match(/angkatan[_\s-]*([ivxlc]+|\d+)/i);
    const el=document.createElement("div");el.className="modal";
    el.innerHTML=`<div class="mbox" role="dialog" aria-modal="true"><div class="eyebrow">Periksa kunci jawaban</div>
      <h2>${nE?`Kunci <em>belum valid</em>.`:`Kunci <em>siap dipakai</em>.`}</h2>
      <p class="sub" style="font-size:13.5px;margin:0 0 14px">${esc(fname)} · ${nE?`<b style="color:var(--red)">${nE} kesalahan</b> harus diperbaiki di Excel lalu unggah ulang`:"tidak ada kesalahan format"}${nW?` · <b style="color:var(--amber)">${nW} peringatan</b> perlu dicek`:""}</p>
      ${window.ONLINE&&!nE?`<label class="mfield">Nama angkatan<input id="mAng" value="${esc(a?"Angkatan "+a[1].toUpperCase():"")}" placeholder="mis. Angkatan XI"></label>`:""}
      <div class="mjab">${Object.keys(JAB_SHEET).map(j=>{const x=m.jab[j],v=V[j];return`<div class="mj ${v.E.length?"bad":v.W.length?"warn":"ok"}">
        <div class="mjh"><b>${esc(JAB[j].label)}</b><span class="pill ${v.E.length?"bad":v.W.length?"warn":"ok"}">${v.E.length?v.E.length+" kesalahan":v.W.length?v.W.length+" peringatan":"valid"}</span></div>
        <div class="sub">sheet ${esc(x.pinjam?(x.sheetKosong||JAB_SHEET[j].label+" (tidak ada)"):x.sheet)}${x.kolom&&!x.pinjam?` · kolom terbaca: KKA ${x.kolom.kk}, indeks ${x.kolom.indeks||"–"}, uraian ${x.kolom.uraian}, jumlah ${x.kolom.jumlah||"–"}, SKKA ${x.kolom.skka||"–"}${j!=="terampil"?`, retensi ${x.kolom.aktif||"–"}/${x.kolom.inaktif||"–"}, nasib ${x.kolom.nasib||"–"}`:""}`:""}</div>
        ${x.pinjam?"":`<table class="mt"><tbody>${x.k.map(k=>`<tr><td><b>${k.no}</b></td><td><b>${esc(k.kk)}</b></td><td>${esc(k.uraian)}</td><td>${esc(k.jumlah)}</td><td>${esc(k.skka)}</td>${j!=="terampil"?`<td>${esc(k.aktif)} / ${esc(k.inaktif)}</td><td>${esc(k.nasib)}</td>`:""}</tr>`).join("")}</tbody></table>`}
        ${v.E.length?`<ul class="ml bad">${v.E.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:""}
        ${v.W.length?`<ul class="ml warn">${v.W.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:""}</div>`}).join("")}</div>
      <div class="mbar"><button class="btn ghost" data-t="tpl">Unduh template kunci</button><span style="flex:1"></span><button class="btn" data-t="batal">${nE?"Tutup":"Batal"}</button>${nE?"":`<button class="btn pri" data-t="ok">Pakai kunci ini</button>`}</div></div>`;
    document.body.appendChild(el);
    const tutup=v=>{el.remove();document.removeEventListener("keydown",esc_);res(v)};
    const esc_=e=>{if(e.key==="Escape")tutup(null)};document.addEventListener("keydown",esc_);
    el.querySelector("[data-t=tpl]").onclick=unduhTemplate;
    el.querySelector("[data-t=batal]").onclick=()=>tutup(null);
    const ok=el.querySelector("[data-t=ok]");if(ok){ok.onclick=()=>{const i=el.querySelector("#mAng");if(i&&!i.value.trim()){i.focus();return}tutup({angkatan:i?i.value.trim():""})};ok.focus()}
    el.onclick=e=>{if(e.target===el)tutup(null)};
  });
}
const TEMPLATE_KUNCI="/*TEMPLATE*/";
function unduhTemplate(){const a=document.createElement("a");a.href="data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,"+TEMPLATE_KUNCI;a.download="Template_Kunci_Jawaban.xlsx";document.body.appendChild(a);a.click();a.remove();toast("Template kunci diunduh — isi tiga sheet jabatan lalu unggah lewat Upload kunci jawaban")}
function pasangKunciJab(jab){KJ={};KJ_META={};Object.keys(jab).forEach(j=>{KJ[j]=jab[j].k;KJ_META[j]={sheet:jab[j].sheet,notes:jab[j].notes||[],pinjam:!!jab[j].pinjam}});sinkronJabatan()}
async function muatKunci(f){
  try{
    const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});
    const m=bacaKunciMaster(wb);
    const ok=await dialogKunci(m,f.name);if(!ok)return;
    if(window.ONLINE){await ONL.simpanKunciBaru(m,f.name,ok.angkatan);return}
    Object.values(m.jab).forEach(x=>x.k.forEach(k=>{if(k.unsurTemplate){k.unsur=k.unsurSimpan;HOOK.unsur(k)}}));
    pasangKunciJab(m.jab);KUNCI_SRC=f.name;muatKataWajib();nilaiUlang();VIEW="kunci";render();
    toast("Kunci dimuat per jabatan — "+Object.keys(m.jab).map(j=>JAB[j].label+": "+(m.jab[j].pinjam?"pakai "+m.jab[j].sheet:m.jab[j].sheet)).join(" · "));
  }catch(e){toast("Gagal membaca kunci: "+e.message)}
}
function nilaiUlang(){semua=semua.map(h=>nilaiParsed(h.parsed,h.file,h.jab))}

/* ================= RENDER ================= */
const VIEWS=[["muat","Muat data"],["rekap","Rekap peserta"],["fisik","Penilaian fisik"],["detail","Rincian per berkas"],["kunci","Kunci & rules"],["cat","Catatan"]].concat(window.ONLINE?[["tim","Tim penilai"]]:[]);
const HEAD={
  muat:["Muat jawaban <em>peserta</em>.","Pilih jabatan di menu atas, pastikan kunci jawaban sudah sesuai angkatan, lalu muat folder berisi file Excel jawaban peserta. Semua diproses di laptop ini — tanpa internet, tanpa unggah ke mana pun."],
  rekap:["Rekap nilai peserta, <em>per jabatan</em>.","Nilai daftar arsip dihitung otomatis terhadap kunci; nilai fisik berkas diisi penilai. Nilai total muncul setelah penilaian fisik ditandai selesai."],
  fisik:["Penilaian fisik <em>berkas</em>.","Semua bagian bawaan benar. Cocokkan folder di tangan dengan kunci di tiap kartu, klik hanya yang salah, lalu tekan Enter untuk lanjut ke peserta berikutnya."],
  detail:["Rincian nilai <em>per berkas</em>.","Setiap nilai disertai alasan dan jawaban asli peserta. Arahkan kursor ke nilai lalu klik ✎ untuk mengoreksi, dan tandai berkas yang sudah diverifikasi supaya daftar “perlu dicek” berkurang."],
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
  $("kcard").innerHTML=(window.ONLINE?ONL.kartuKunci():"")+`<div class="kname">${esc(KUNCI_SRC)}</div><div class="ksub">Kunci ${esc(JA.label)}: ${KUNCI.length} berkas · sheet ${esc(KUNCI_SHEET||"–")}</div>${(KJ_META[JAKTIF]||{}).pinjam?`<div class="ksub" style="color:var(--amber)">Belum ada sheet khusus jabatan ini — sementara memakai kunci TerampilMahirPA.</div>`:""}<div class="kk">${KUNCI.map(k=>`<span class="tag">${esc(k.kk)}</span>`).join("")}</div><button class="btn sm" id="kUp"><span class="plus">+</span> Upload kunci jawaban</button><button class="btn sm ghost" id="kTpl" style="margin-top:6px">Unduh template kunci</button>`;
  $("kUp").onclick=()=>$("fKunci").click();
  $("kTpl").onclick=unduhTemplate;
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
    <div class="kpi"><div class="kl"><span class="sq" style="background:var(--red)"></span>Perlu dicek</div><div class="kv">${nCek}</div><div class="ks">${(()=>{const all=hasil.flatMap(h=>h.berkas.filter(cekBerkas)),d=all.filter(b=>b.cek).length;return all.length?`${d} dari ${all.length} berkas sudah dicek`:"tidak ada nilai di antara 20–100"})()}</div></div>
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
  const R=UI.rs,val=o=>R.k==="total"?(o.tot??-1):R.k==="da"?o.h.rata:R.k==="fisik"?(o.rf??-1):/^b\d$/.test(R.k)?(o.h.berkas[+R.k[1]]||{}).da??-1:0;
  rows.sort((a,b)=>R.k==="nama"?R.d*a.h.nama.localeCompare(b.h.nama):(R.d*(val(a)-val(b))||a.h.nama.localeCompare(b.h.nama)));
  const OPS=[["total:-1","Nilai total tertinggi"],["total:1","Nilai total terendah"],["da:-1","Nilai DA tertinggi"],["da:1","Nilai DA terendah"],["nama:1","Nama A–Z"],["nama:-1","Nama Z–A"]],cur=R.k+":"+R.d;
  v.innerHTML=`<div class="panel"><div class="toolbar">
    <div class="search">${ICON_SEARCH}<input id="q" placeholder="Cari nama peserta…" value="${esc(UI.q)}"></div>
    <div class="field"><label>Status</label><select id="flt">${[["semua","Semua peserta"],["fbelum","Fisik belum dinilai"],["fsudah","Fisik selesai"],["cek","Perlu dicek"]].map(([k,l])=>`<option value="${k}" ${UI.filter===k?"selected":""}>${l}</option>`).join("")}</select></div>
    <div class="field"><label>Urutkan</label><select id="srt">${OPS.some(o=>o[0]===cur)?"":`<option selected>Sesuai kolom yang diklik</option>`}${OPS.map(([k,l])=>`<option value="${k}" ${cur===k?"selected":""}>${l}</option>`).join("")}</select></div>
  </div>
  <div class="tw"><table><thead><tr><th class="n">No</th>${thSort(R,"nama","Peserta")}${KUNCI.map((k,i)=>thSort(R,"b"+i,`DA ${k.no}<div class="sub">${esc(k.kk)}</div>`,"n")).join("")}${thSort(R,"da","Rata DA","n")}${thSort(R,"fisik","Fisik","n")}${thSort(R,"total","Total","n")}<th>Status</th></tr></thead><tbody>
  ${rows.map((o,i)=>`<tr><td class="n sub">${i+1}</td><td><span class="nm" data-k="${esc(fKey(o.h))}">${esc(o.h.nama)}</span>${o.h.catatan.length?`<div class="sub" style="color:var(--red)">${esc(o.h.catatan[0])}${o.h.catatan.length>1?` (+${o.h.catatan.length-1})`:""}</div>`:""}</td>
    ${o.h.berkas.map(b=>`<td class="n"><span class="sc ${cls(b.da)}">${fmt(b.da)}</span></td>`).join("")}
    <td class="n big">${fmt(o.h.rata)}</td><td class="n">${o.rf===null?`<button class="btn sm ghost" data-f="${esc(fKey(o.h))}">Nilai fisik</button>`:fmt(o.rf)}</td><td class="n big">${fmt(o.tot)}</td>
    <td>${o.rf===null?'<span class="pill no">Fisik belum</span>':'<span class="pill ok">Lengkap</span>'} ${perluCek(o.h)?'<span class="pill warn">Perlu dicek</span>':""}</td></tr>`).join("")}
  </tbody></table>${rows.length?"":`<div class="empty">Tidak ada peserta yang cocok dengan filter.</div>`}</div>
  <div class="sub" style="margin-top:10px">${rows.length} dari ${hasil.length} peserta · klik nama untuk melihat rincian</div></div>`;
  const qi=$("q");qi.oninput=()=>{UI.q=qi.value;const p=qi.selectionStart;render();const n=$("q");n.focus();n.setSelectionRange(p,p)};
  $("flt").onchange=e=>{UI.filter=e.target.value;render()};$("srt").onchange=e=>{const[k,d]=e.target.value.split(":");if(d){UI.rs={k,d:+d};render()}};pasangSort(v,UI.rs);
  v.querySelectorAll(".nm").forEach(el=>el.onclick=()=>{const h=hasil.find(x=>fKey(x)===el.dataset.k);UI.dq=h?h.nama:"";UI.donly=false;VIEW="detail";render();window.scrollTo({top:0})});
  v.querySelectorAll("[data-f]").forEach(el=>el.onclick=()=>{FSEL=el.dataset.f;VIEW="fisik";render();window.scrollTo({top:0})});
}

function vDetail(v,hasil,JA){
  if(!hasil.length)return emptyState(v);
  const q=UI.dq.toLowerCase();
  const D=UI.ds;
  let rows=hasil.slice().sort((a,b)=>a.nama.localeCompare(b.nama)*(D.k==="nama"?D.d:1)).filter(h=>!q||h.nama.toLowerCase().includes(q)).flatMap(h=>h.berkas.map(b=>({h,b}))).filter(o=>UI.donly===false||UI.donly==="semua"||(UI.donly===true||UI.donly==="perlu"?sisaCek(o.b):UI.donly==="sudah"?!!o.b.cek:UI.donly==="kor"?Object.keys(o.b.kor||{}).length>0:true));
  const urutNilai=D.k&&D.k!=="nama";
  if(urutNilai){const val=o=>D.k==="da"?o.b.da:D.k==="berkas"?o.b.no:o.b.S[D.k];rows=rows.map((o,i)=>[o,i]).sort((x,y)=>{const a=val(x[0]),b=val(y[0]);if(a===null||a===undefined)return 1;if(b===null||b===undefined)return -1;return D.d*(a-b)||x[1]-y[1]}).map(x=>x[0])}
  const lim=rows.slice(0,400);
  v.innerHTML=`<div class="panel"><div class="toolbar">
    <div class="search">${ICON_SEARCH}<input id="dq" placeholder="Cari nama peserta…" value="${esc(UI.dq)}"></div>
    <div class="field"><label>Tampilkan</label><select id="donly">${[["semua","Semua berkas"],["perlu","Perlu dicek (belum)"],["sudah","Sudah dicek"],["kor","Dikoreksi penilai"]].map(([k,l])=>`<option value="${k}" ${String(UI.donly===true?"perlu":UI.donly===false?"semua":UI.donly)===k?"selected":""}>${l}</option>`).join("")}</select></div>
  </div>
  <div class="tw"><table class="dt"><thead><tr>${thSort(D,"nama","Peserta")}${thSort(D,"berkas","Berkas")}${JA.cols.map(c=>thSort(D,c,`${c}<div class="sub">${KOMP[c]}</div>`,"k")).join("")}${thSort(D,"da","Nilai DA","n")}<th>Uraian jawaban</th></tr></thead><tbody>
  ${lim.map(({h,b},i)=>{const baru=urutNilai||i===0||lim[i-1].h!==h;return`<tr class="${baru&&i&&!urutNilai?"grp":""}"><td>${baru?`<b>${esc(h.nama)}</b>`:`<span class="sub">${esc(h.nama)}</span>`}</td><td><b>${b.no} · ${esc(b.kkKunci)}</b><div class="sub">${esc(b.jaw.kk||"–")} · ${esc(b.cara)}</div>${b.cek?`<button class="cekb on" data-cek="${i}" title="Dicek ${esc(b.cek.oleh)} · ${esc(fmtT(b.cek.t))} — klik untuk membatalkan">✓ Sudah dicek</button>`:`<button class="cekb ${cekBerkas(b)?"perlu":""}" data-cek="${i}">${cekBerkas(b)?"Tandai sudah dicek":"Tandai dicek"}</button>`}</td>
    ${JA.cols.map(c=>{const v=b.S[c],jw=JAWAB[c]?String(b.jaw[JAWAB[c]]||""):"";const kr=b.kor&&b.kor[c];return`<td class="cell ${kr?"kor":v!==null&&v<=20?"low":v!==null&&v<100?"mid":""}"><span class="sc ${cls(v)}">${fmt(v)}</span>${kr?`<span class="korb" title="Otomatis ${fmt(kr.auto)} · dikoreksi ${esc(kr.oleh||"")} ${esc(fmtT(kr.t))}">dikoreksi · ${fmt(kr.auto)}→${fmt(v)}</span>`:""}<button class="edb" data-kor="${i}|${c}" title="Koreksi nilai">✎</button><div class="why">${esc(b.D[c])}</div>${jw?`<div class="ans" title="${esc(jw)}">“${esc(jw)}”</div>`:""}</td>`}).join("")}
    <td class="n big">${fmt(b.da)}</td><td class="ura">${esc(b.jaw.uraian)}${b.kurang&&b.kurang.length?`<div class="why" style="max-width:none">kurang: ${esc(b.kurang.join(", "))}</div>`:""}</td></tr>`}).join("")}
  </tbody></table>${rows.length?"":`<div class="empty">Tidak ada berkas yang cocok.</div>`}</div>
  <div class="sub" style="margin-top:10px">${rows.length} baris${rows.length>400?" · menampilkan 400 pertama, persempit dengan pencarian":""}</div></div>`;
  const qi=$("dq");qi.oninput=()=>{UI.dq=qi.value;const p=qi.selectionStart;render();const n=$("dq");n.focus();n.setSelectionRange(p,p)};
  $("donly").onchange=e=>{UI.donly=e.target.value;render()};
  v.querySelectorAll("[data-kor]").forEach(el=>el.onclick=()=>{const[i,c]=el.dataset.kor.split("|");const o=lim[+i];dialogKoreksi(o.h,o.b,c)});
  v.querySelectorAll("[data-cek]").forEach(el=>el.onclick=()=>{const o=lim[+el.dataset.cek];const on=!o.b.cek;setCek(o.h,o.b.no,on);render();toast(on?`${o.h.nama} berkas ${o.b.no} ditandai sudah dicek`:"Tanda dicek dihapus")});pasangSort(v,UI.ds);
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
  if(!KUNCI.length){v.innerHTML=`<div class="panel"><div class="empty"><h3>Belum ada kunci jawaban</h3><div>${window.ONLINE&&!ONL.admin?"Minta admin mengunggah file master angkatan.":"Upload file master angkatan atau template kunci yang sudah diisi."}</div><div style="margin-top:16px"><button class="btn" onclick="unduhTemplate()">Unduh template kunci</button></div></div></div>`;return}
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
    ...C.map(c=>"Ket "+c),"Catatan Fisik","Koreksi Penilai","Dicek Oleh"]];
  let r=1;
  hasil.forEach(h=>h.berkas.forEach((b,bi)=>{r++;const J=JAB[h.jab];
    const ff=FISIK[fKey(h)],fs=ff&&ff.selesai?skorFisik(ff.b[bi],KUNCI[bi]):null;
    P.push([h.nama,h.file,J.label,b.no,b.kkKunci,fs?fs.R:"",fs?fs.S:"",fs?fs.T:"",{t:"n",v:fs?r2(fs.W):0,f:`SUM(F${r}:H${r})/3`},
      ...C.map(c=>b.S[c]),J.div,{t:"n",v:r2(b.da),f:`SUM(${cK1}${r}:${cKn}${r})/${cDiv}${r}`},
      b.jaw.kk,b.cara,b.jaw.uraian,(b.kurang||[]).join(", "),b.jaw.jumlah,b.item,b.jaw.skka,b.jaw.aktif,b.jaw.inaktif,b.jaw.nasib,
      ...C.map(c=>b.D[c]),ff&&ff.selesai?ff.b[bi].cat:"",Object.entries(b.kor||{}).map(([c,k])=>`${c}: ${k.auto}→${k.v} (${k.alasan}; ${k.oleh})`).join(" | "),b.cek?b.cek.oleh+" "+fmtT(b.cek.t):""]);
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
