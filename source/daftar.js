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
const DPOLA=[["fileHint",/nama\s*file|file\s*jawaban/i],["instansi",/instansi|unit\s*kerja|satuan\s*kerja|^asal|^unit/i],["nip",/^nip\b|\bnip$/i],["jenis",/jenis|sertifikasi/i],["tujuan",/tujuan|jenjang|jabatan/i],["nama",/^nama(\s*(lengkap|peserta))?$/i],["no",/^no\.?$/i]];
function bacaDaftarPeserta(wb){
  for(const sn of wb.SheetNames){
    const g=grid(wb.Sheets[sn]);
    for(let r=0;r<Math.min(g.length,15);r++){
      const lab=(g[r]||[]).map(v=>String(v??"").replace(/\s+/g," ").trim());
      if(!lab.some(l=>/^nama/i.test(l)&&l.length<=30))continue;
      const col={},used=new Set();
      DPOLA.forEach(([f,re])=>{const c=lab.findIndex((l,i)=>!used.has(i)&&l&&l.length<=40&&re.test(l));if(c>=0){col[f]=c;used.add(c)}});
      if(col.nama===undefined){const c=lab.findIndex((l,i)=>!used.has(i)&&/^nama/i.test(l));if(c>=0)col.nama=c}
      if(col.nama===undefined)continue;
      const s=(row,f)=>col[f]===undefined?"":String((g[row]||[])[col[f]]??"").replace(/\s+/g," ").trim();
      const rows=[],err=[],warn=[];
      for(let i=r+1;i<g.length;i++){
        const nama=s(i,"nama");if(!nama)continue;
        const o={id:"p"+i,no:Number(s(i,"no"))||rows.length+1,nama,nip:s(i,"nip").replace(/\s+/g,""),instansi:s(i,"instansi"),jenis:s(i,"jenis"),tujuan:s(i,"tujuan"),fileHint:s(i,"fileHint"),file:null};
        o.jab=jabDariTujuan(o.tujuan);
        if(!o.jab)warn.push(`Baris ${i+1} (${nama}): tujuan jabatan "${o.tujuan||"kosong"}" tidak dikenali — jabatan dipilih saat upload jawaban`);
        rows.push(o);
      }
      const seen={};rows.forEach(o=>{const k=o.nip||normNama(o.nama);if(seen[k])warn.push(`${o.nama}: tercantum dua kali (baris ${seen[k]} dan ${o.no})`);seen[k]=o.no});
      if(!rows.length)err.push("Tidak ada nama peserta di bawah baris judul.");
      if(col.tujuan===undefined)warn.push("Kolom Tujuan Jabatan tidak ditemukan — jabatan tiap peserta dipilih saat upload jawaban.");
      return{sheet:sn,rows,err,warn,kolom:Object.fromEntries(Object.entries(col).map(([f,c])=>[f,XLSX.utils.encode_col(c)]))};
    }
  }
  throw new Error("kolom Nama tidak ditemukan. Pakai template daftar peserta (kolom Nama, Instansi, Jenis Sertifikasi, Tujuan Jabatan).");
}

/* ---------- pencocokan file jawaban ↔ peserta ---------- */
const NOISE=new Set(["ujian","praktik","praktek","daftar","arsip","berkas","jawaban","ahli","pertama","muda","terampil","mahir","penyelia","arsiparis","sertifikasi","final","revisi","rev","copy","salinan","fix","new","baru","xlsx","xls","jfa","uji","kompetensi","tes","test","peserta","nama","dan","di","ke"]);
const GELAR=/\b(s|a|d|m)\s*\.?\s*(kom|ap|ip|sos|e|h|pd|si|ak|ikom|i\.?kom|m|t|psi|hum|kes|ag|stp|tr)\b\.?|\b(dr|drs|dra|ir|h|hj|prof|amd|a\.md|se|sh|st|mm|mt|msi|mpa|map|mkom|ssos|skom|sap|sip|spd|mpd|sstp|mh|sh)\b\.?/gi;
function normNama(n){return String(n||"").toLowerCase().replace(/,.*$/,"").replace(GELAR," ").replace(/[^a-z\s]/g," ").replace(/\s+/g," ").trim()}
function tokNama(n){return normNama(n).split(" ").filter(w=>w&&!NOISE.has(w))}
function tokFile(f){return String(f).replace(/\.[^.]+$/,"").toLowerCase().replace(/\(\d+\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(w=>w&&!NOISE.has(w))}
function cocokTok(a,b){return a===b||(a.length>=4&&b.length>=4&&lev(a,b)<=1)||(a.length===1&&b.startsWith(a))||(b.length===1&&a.startsWith(b))||(a.length>=5&&b.length>=5&&(a.startsWith(b)||b.startsWith(a)))}
// skor 0..1 = bagian nama peserta yang muncul di nama file / identitas di dalam file
function skorPeserta(d,teksTok,digits){
  if(d.nip&&digits.includes(d.nip))return{s:1,dasar:"NIP"};
  if(d.fileHint){const fh=tokFile(d.fileHint);if(fh.length&&fh.every(w=>teksTok.some(x=>cocokTok(w,x))))return{s:.99,dasar:"nama file di daftar"}}
  const N=tokNama(d.nama);if(!N.length)return{s:0};
  const hit=N.filter(w=>teksTok.some(x=>cocokTok(w,x)));
  const panjang=hit.filter(w=>w.length>1).length;
  let s=hit.length/N.length;if(!panjang)s=0;           // harus ada minimal satu kata nama yang utuh
  return{s,dasar:"nama"};
}
function cocokkanFile(nama,p){
  const teks=nama+" "+(p.identitas?Object.values(p.identitas).join(" "):"");
  const T=tokFile(teks),digits=teks.replace(/\D+/g," ");
  const kand=DAFTAR.map(d=>({d,...skorPeserta(d,T,digits)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||tokNama(b.d.nama).length-tokNama(a.d.nama).length);
  const top=kand[0],dua=kand[1];
  if(!top||top.s<.6)return{d:null,kand:kand.slice(0,5),status:"tidak cocok"};
  if(dua&&dua.s>=top.s-.05&&dua.d!==top.d)return{d:null,kand:kand.slice(0,5),status:"ragu"};
  return{d:top.d,s:top.s,dasar:top.dasar,kand:kand.slice(0,5),status:top.s>=.99?"pasti":"cocok"};
}
// identitas yang tertulis di file jawaban (mis. "Nama : …", "NIP : …" di baris atas sheet)
function bacaIdentitas(wb){
  const out={};
  for(const sn of wb.SheetNames.slice(0,4)){const g=grid(wb.Sheets[sn]);
    for(let r=0;r<Math.min(g.length,12);r++)(g[r]||[]).forEach((v,c)=>{const t=String(v??"").trim();
      const m=t.match(/^(nama(\s*peserta)?|nip|instansi|unit\s*kerja)\s*:?\s*(.*)$/i);if(!m)return;
      let val=m[3].replace(/^:\s*/,"").trim();if(!val){for(let k=c+1;k<Math.min(c+5,(g[r]||[]).length);k++){const x=String(g[r][k]??"").replace(/^:\s*/,"").trim();if(x&&x!==":"){val=x;break}}}
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
      <p class="sub" style="font-size:13.5px;margin:0 0 12px">${esc(fname)} · sheet ${esc(r.sheet)} · kolom terbaca: ${Object.entries(r.kolom).filter(([f])=>f!=="no").map(([f,c])=>`${({nama:"nama",nip:"NIP",instansi:"instansi",jenis:"jenis sertifikasi",tujuan:"tujuan jabatan",fileHint:"nama file"})[f]} ${c}`).join(", ")}</p>
      <div class="chips">${Object.keys(JAB).map(j=>`<span class="pill ok">${JAB[j].label}: ${per[j]||0}</span>`).join(" ")}${per["?"]?`<span class="pill warn">Tujuan tidak dikenali: ${per["?"]}</span>`:""}${Object.entries(jenis).map(([k,n])=>`<span class="pill no">${esc(k)}: ${n}</span>`).join(" ")}</div>
      <div class="tw" style="max-height:40vh;margin-top:12px"><table><thead><tr><th>No</th><th>Nama</th><th>NIP</th><th>Instansi</th><th>Jenis sertifikasi</th><th>Tujuan jabatan</th><th>Dinilai sebagai</th></tr></thead><tbody>
      ${r.rows.slice(0,300).map(o=>`<tr><td class="sub">${o.no}</td><td><b>${esc(o.nama)}</b></td><td class="sub">${esc(o.nip)}</td><td>${esc(o.instansi)}</td><td>${esc(o.jenis)}</td><td>${esc(o.tujuan)}</td><td>${o.jab?esc(JAB[o.jab].label):'<span class="pill warn">belum jelas</span>'}</td></tr>`).join("")}</tbody></table></div>
      ${r.err.length?`<ul class="ml bad">${r.err.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:""}${r.warn.length?`<ul class="ml warn">${r.warn.slice(0,20).map(t=>`<li>${esc(t)}</li>`).join("")}${r.warn.length>20?`<li>… dan ${r.warn.length-20} lainnya</li>`:""}</ul>`:""}
      ${DAFTAR.length&&!r.err.length?`<p class="sub" style="margin:12px 0 0">Daftar lama (${DAFTAR.length} peserta) akan diganti. File jawaban yang sudah dimuat akan dihubungkan ulang otomatis.</p>`:""}
      <div class="mbar"><button class="btn ghost" data-t="tpl">Unduh template daftar</button><span style="flex:1"></span><button class="btn" data-t="batal">${r.err.length?"Tutup":"Batal"}</button>${r.err.length?"":`<button class="btn pri" data-t="ok">Pakai daftar ini</button>`}</div></div>`;
    document.body.appendChild(el);
    const tutup=v=>{el.remove();res(v)};
    el.querySelector("[data-t=tpl]").onclick=unduhTemplateDaftar;el.querySelector("[data-t=batal]").onclick=()=>tutup(false);
    const ok=el.querySelector("[data-t=ok]");if(ok){ok.onclick=()=>tutup(true);ok.focus()}
  });
}
async function muatDaftar(f){
  try{
    const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});
    if(wb.SheetNames.some(n=>/^MasterPraktik/i.test(n)))throw new Error("ini file kunci jawaban, bukan daftar peserta.");
    const r=bacaDaftarPeserta(wb);
    if(!await dialogDaftar(r,f.name))return;
    DAFTAR=r.rows;
    if(window.ONLINE){const ok=await ONL.simpanDaftar(DAFTAR);if(!ok)return}
    const n=hubungkanOtomatis();simpanDaftarLokal();VIEW="daftar";render();
    toast(`${DAFTAR.length} peserta dimuat`+(n?` · ${n} file jawaban langsung terhubung`:""));
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
  v.innerHTML=`<div class="actions">${admin?`<button class="btn pri" id="dUp"><span class="plus">+</span> Upload daftar peserta</button>`:""}<button class="btn" id="dTpl">Unduh template daftar</button>${DAFTAR.length&&semua.length?`<button class="btn" id="dAuto">Hubungkan otomatis</button>`:""}</div>
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
    <td>${esc(d.tujuan||"–")}<div class="sub">${d.jab?"dinilai "+esc(JAB[d.jab].label):'<span style="color:var(--amber)">jabatan belum jelas</span>'}</div></td>
    <td>${h?`<span class="pill ok">✓ ada</span> <span class="sub">${esc(h.file)}</span>${admin?` <button class="hpb" style="opacity:.7" data-lepas="${d.id}">lepas</button>`:""}`:`<span class="pill no">belum ada</span>${tanpa.length?` <select class="sm" data-link="${d.id}"><option value="">hubungkan ke file…</option>${tanpa.map(x=>`<option value="${esc(fKey(x))}">${esc(x.file)} (${esc(JAB[x.jab].label.split(" /")[0])})</option>`).join("")}</select>`:""}`}</td>
    <td class="n">${h?`<span class="sc ${cls(h.rata)}">${fmt(h.rata)}</span>`:"–"}</td></tr>`}).join("")}
  </tbody></table>${rows.length?"":`<div class="empty">Tidak ada peserta yang cocok dengan filter.</div>`}</div>
  ${tanpa.length?`<h2 style="font-family:var(--serif);font-weight:500;font-size:22px;margin:24px 0 8px">File jawaban di luar daftar</h2><p class="sub" style="margin:0 0 10px">File ini tetap dinilai, tetapi belum terhubung ke peserta mana pun. Hubungkan lewat kolom "File jawaban" di atas.</p>
    <div class="chips">${tanpa.map(x=>`<span class="pill warn">${esc(x.file)} · ${esc(JAB[x.jab].label.split(" /")[0])}</span>`).join(" ")}</div>`:""}</div>`
  :`<div class="panel"><div class="empty"><h3>Belum ada daftar peserta</h3><div>Upload daftar peserta (nama, jenis sertifikasi, tujuan jabatan). File jawaban yang diunggah nanti otomatis dicocokkan ke daftar ini dan dinilai sesuai tujuan jabatannya.</div>
    <div style="margin-top:16px;display:flex;gap:10px;justify-content:center">${admin?`<button class="btn pri" onclick="document.getElementById('fDaftar').click()"><span class="plus">+</span> Upload daftar peserta</button>`:""}<button class="btn" onclick="unduhTemplateDaftar()">Unduh template daftar</button></div></div></div>`}`;
  const up=$("dUp");if(up)up.onclick=()=>$("fDaftar").click();
  $("dTpl").onclick=unduhTemplateDaftar;
  const au=$("dAuto");if(au)au.onclick=()=>{const n=hubungkanOtomatis();render();toast(n?n+" file jawaban dihubungkan":"Tidak ada file baru yang cocok")};
  const pq=$("pq");if(pq)pq.oninput=()=>{UI.pq=pq.value;const p=pq.selectionStart;render();const n=$("pq");n.focus();n.setSelectionRange(p,p)};
  const pf=$("pf");if(pf)pf.onchange=e=>{UI.pf=e.target.value;render()};
  const pj=$("pj");if(pj)pj.onchange=e=>{UI.pj=e.target.value;render()};
  v.querySelectorAll("[data-lepas]").forEach(b=>b.onclick=()=>{const d=DAFTAR.find(x=>x.id===b.dataset.lepas);lepas(d);render();toast("Hubungan "+d.nama+" dilepas")});
  v.querySelectorAll("select[data-link]").forEach(s=>s.onchange=()=>{const d=DAFTAR.find(x=>x.id===s.dataset.link),h=semua.find(x=>fKey(x)===s.value);if(!d||!h)return;
    if(d.jab&&d.jab!==h.jab&&!confirm(`${d.nama} terdaftar sebagai ${JAB[d.jab].label}, tetapi file ini dinilai sebagai ${JAB[h.jab].label}. Tetap hubungkan?`)){render();return}
    hubungkan(d,h.file,h.jab);render();toast(h.file+" → "+d.nama)});
}
