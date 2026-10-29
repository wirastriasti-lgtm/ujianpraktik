/* ================= VERSI ONLINE (Supabase) =================
   Dimuat sebelum logic.js/ui.js. Kunci jawaban TIDAK ada di kode ini — diambil dari database
   setelah login, dan hanya email yang terdaftar di tabel penilai yang bisa membacanya (RLS). */
window.ONLINE=true;
const SB_URL="https://akarxmsrsvyroovzqgcw.supabase.co";
const SB_KEY="sb_publishable_HRIOy7IV-sAQvvGr0hFa1A_6aEqLqXc";

const ONL={
  sb:null,email:"",nama:"",admin:false,kunciId:null,kunciList:[],tim:[],ch:null,
  pending:{},timer:{},sync:"ok",renderTunda:false,

  async mulai(){
    this.sb=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,detectSessionInUrl:true}});
    HOOK.unsur=()=>this.simpanUnsur();HOOK.unsurHapus=()=>this.simpanUnsur();
    HEAD.muat=["Muat jawaban <em>peserta</em>.","Pilih jabatan di menu atas, pastikan kunci angkatan sudah benar, lalu muat folder berisi file Excel jawaban peserta. Hasil tersimpan di server dan langsung terlihat oleh semua penilai."];
    const p=document.getElementById("simpanInfo");if(p)p.textContent="Nilai fisik tersimpan otomatis di server dan terlihat oleh semua penilai. Cadangan tetap bisa diunduh.";
    document.getElementById("fRes").onchange=e=>this.muatCadangan(e);
    this.sb.auth.onAuthStateChange((ev,s)=>{
      if(ev==="PASSWORD_RECOVERY"){this.layarLogin("baru");return}
      if(ev==="SIGNED_OUT"){location.reload()}
    });
    const {data:{session}}=await this.sb.auth.getSession();
    if(!session)return this.layarLogin("masuk");
    await this.setelahLogin(session);
  },

  /* ---------- login ---------- */
  layarLogin(mode,pesan){
    document.querySelector(".wrap").style.display="none";document.getElementById("dl").style.display="none";document.getElementById("jnav").style.visibility="hidden";
    let el=document.getElementById("login");if(!el){el=document.createElement("div");el.id="login";document.body.appendChild(el)}
    const judul={masuk:"Masuk untuk <em>menilai</em>.",daftar:"Buat akun <em>penilai</em>.",lupa:"Atur ulang <em>password</em>.",baru:"Password <em>baru</em>.",tolak:"Akses <em>belum dibuka</em>."}[mode];
    const lead={masuk:"Gunakan email yang sudah didaftarkan admin di Tim penilai.",daftar:"Pakai email yang sudah didaftarkan admin. Setelah daftar, buka email konfirmasi dari Supabase, lalu kembali ke sini untuk masuk.",lupa:"Kami kirim tautan atur ulang password ke email kamu.",baru:"Ketik password baru untuk akun ini.",tolak:""}[mode];
    el.innerHTML=`<div class="lbox"><div class="eyebrow">Ujian praktik sertifikasi</div><h1 class="sm">${judul}</h1><p class="lead sm">${pesan||lead}</p>
      ${mode==="tolak"?`<button class="btn" id="lOut">Keluar</button>`:`<form id="lf">
      ${mode!=="baru"?`<label>Email<input type="email" id="lE" required autocomplete="email"></label>`:""}
      ${mode!=="lupa"?`<label>Password<input type="password" id="lP" required minlength="8" autocomplete="${mode==="masuk"?"current-password":"new-password"}"></label>`:""}
      <button class="btn pri" type="submit" id="lGo">${{masuk:"Masuk",daftar:"Daftar",lupa:"Kirim tautan",baru:"Simpan password"}[mode]}</button></form>
      <div class="lalt">${mode==="masuk"?`<button class="btn ghost sm" data-m="daftar">Belum punya akun? Daftar</button><button class="btn ghost sm" data-m="lupa">Lupa password</button>`:mode!=="baru"?`<button class="btn ghost sm" data-m="masuk">← Kembali ke masuk</button>`:""}</div>`}
      <div class="lmsg" id="lMsg"></div></div>`;
    el.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>this.layarLogin(b.dataset.m));
    const out=document.getElementById("lOut");if(out)out.onclick=()=>this.sb.auth.signOut();
    const f=document.getElementById("lf");if(!f)return;
    f.onsubmit=async ev=>{ev.preventDefault();const msg=document.getElementById("lMsg"),go=document.getElementById("lGo");go.disabled=true;msg.textContent="Memproses…";
      const E=(document.getElementById("lE")||{}).value,P=(document.getElementById("lP")||{}).value,redirect=location.origin+location.pathname;
      try{
        if(mode==="masuk"){const{data,error}=await this.sb.auth.signInWithPassword({email:E,password:P});if(error)throw error;await this.setelahLogin(data.session)}
        else if(mode==="daftar"){const{data,error}=await this.sb.auth.signUp({email:E,password:P,options:{emailRedirectTo:redirect}});if(error)throw error;
          if(data.session)await this.setelahLogin(data.session);else{msg.textContent="Cek email "+E+" dan klik tautan konfirmasi, lalu masuk di sini.";go.disabled=false}}
        else if(mode==="lupa"){const{error}=await this.sb.auth.resetPasswordForEmail(E,{redirectTo:redirect});if(error)throw error;msg.textContent="Tautan terkirim ke "+E+".";go.disabled=false}
        else if(mode==="baru"){const{error}=await this.sb.auth.updateUser({password:P});if(error)throw error;const{data:{session}}=await this.sb.auth.getSession();await this.setelahLogin(session)}
      }catch(e){msg.textContent=this.pesanError(e);go.disabled=false}};
  },
  pesanError(e){const m=String(e&&e.message||e);
    if(/invalid login/i.test(m))return"Email atau password salah.";if(/not confirmed/i.test(m))return"Email belum dikonfirmasi. Buka email konfirmasi dari Supabase dulu.";
    if(/already registered/i.test(m))return"Email ini sudah terdaftar. Silakan masuk atau pakai Lupa password.";if(/rate limit/i.test(m))return"Terlalu banyak percobaan. Tunggu beberapa menit.";return m},

  async setelahLogin(session){
    this.email=String(session.user.email||"").toLowerCase();
    const{data:me,error}=await this.sb.from("penilai").select("*").eq("email",this.email).maybeSingle();
    if(error||!me)return this.layarLogin("tolak",`Email <b>${esc(this.email)}</b> belum terdaftar sebagai penilai. Minta admin menambahkannya di menu Tim penilai, lalu muat ulang halaman ini.`);
    this.nama=me.nama||this.email;this.admin=me.peran==="admin";
    const l=document.getElementById("login");if(l)l.remove();
    document.querySelector(".wrap").style.display="";document.getElementById("dl").style.display="";document.getElementById("jnav").style.visibility="";
    this.pasangHeader();
    const pr=await this.sb.from("preset_unsur").select("kk,cue,unsur").order("id");
    if(!pr.error)UNSUR_PRESET=pr.data.map(r=>{try{return{kk:r.kk,cue:new RegExp(r.cue,"i"),u:r.unsur}}catch(e){return null}}).filter(Boolean);
    await this.muatKunciList();
    await this.muatData();
    this.dengar();
  },
  pasangHeader(){
    const t=document.querySelector(".tright");if(document.getElementById("uchip"))return;
    const d=document.createElement("div");d.id="uchip";d.className="uchip";
    d.innerHTML=`<span class="sdot" id="sdot" title="Tersinkron"></span><span><b>${esc(this.nama)}</b><span class="sub">${this.admin?"admin":"penilai"}</span></span><button class="btn sm ghost" id="uOut">Keluar</button>`;
    t.insertBefore(d,t.firstChild);document.getElementById("uOut").onclick=()=>this.sb.auth.signOut();
  },
  setSync(st){this.sync=st;const d=document.getElementById("sdot");if(d){d.className="sdot "+st;d.title={ok:"Tersinkron",run:"Menyimpan…",err:"Gagal menyimpan — cek koneksi"}[st]}},

  /* ---------- kunci ---------- */
  async muatKunciList(){
    const{data,error}=await this.sb.from("kunci").select("id,angkatan,sumber,sheet,aktif,updated_at").order("id",{ascending:false});
    if(error){toast("Gagal memuat kunci: "+error.message);return}
    this.kunciList=data||[];
    let pilih=null;try{pilih=Number(localStorage.getItem("kunciDipilih"))}catch(e){}
    const ada=this.kunciList.find(k=>k.id===pilih)||this.kunciList.find(k=>k.aktif)||this.kunciList[0];
    this.kunciId=ada?ada.id:null;
    await this.pakaiKunci();
  },
  async pakaiKunci(){
    if(!this.kunciId){KJ={};KJ_META={};KUNCI_SRC="Belum ada kunci";sinkronJabatan();return}
    const{data,error}=await this.sb.from("kunci").select("*").eq("id",this.kunciId).single();
    if(error){toast("Gagal memuat kunci: "+error.message);return}
    // format baru: berkas = {terampil:{k,sheet,notes,pinjam}, penyelia:{…}, muda:{…}}; format lama (array) = satu kunci untuk semua jabatan
    const b=data.berkas;
    const jab=Array.isArray(b)?Object.fromEntries(Object.keys(JAB_SHEET).map(j=>[j,{k:JSON.parse(JSON.stringify(b)),sheet:(data.sheet||"")+(j==="terampil"?"":" (sama untuk semua jabatan)"),notes:data.notes||[],pinjam:j!=="terampil"}])):b;
    pasangKunciJab(jab);KUNCI_SRC=data.angkatan+" · "+(data.sumber||"");muatKataWajib();
  },
  async gantiKunci(id){this.kunciId=id;try{localStorage.setItem("kunciDipilih",String(id))}catch(e){}
    semua=[];FISIK={};FSEL=null;await this.pakaiKunci();await this.muatData();this.dengar();toast("Kunci aktif: "+KUNCI_SRC)},
  async simpanKunciBaru(m,fname,angkatan){
    if(!this.admin){toast("Hanya admin yang bisa mengunggah kunci.");return}
    if(!angkatan)return;
    const berkas={};Object.keys(m.jab).forEach(j=>{const{cacat,sheetKosong,...x}=m.jab[j];berkas[j]={...x,k:x.k.map(k=>({...k,unsurSimpan:k.unsurSimpan||unsurBawaan(k)}))}});
    const sheets=[...new Set(Object.values(m.jab).map(x=>x.sheet))].join(", ");
    const{data,error}=await this.sb.from("kunci").insert({angkatan:angkatan.trim(),sumber:fname,sheet:sheets,berkas,notes:[],aktif:false,updated_by:this.email}).select("id").single();
    if(error){toast("Gagal menyimpan kunci: "+error.message);return}
    const r=await this.sb.rpc("aktifkan_kunci",{p_id:data.id});if(r.error)toast("Kunci tersimpan, tapi gagal dijadikan aktif: "+r.error.message);
    await this.muatKunciList();await this.gantiKunci(data.id);VIEW="kunci";render();
    toast("Kunci "+angkatan+" dimuat per jabatan"+(m.warn.length?" · "+m.warn.join("; "):". Cek unsur uraian tiap jabatan di halaman ini."));
  },
  async jadikanAktif(id){const r=await this.sb.rpc("aktifkan_kunci",{p_id:id});if(r.error){toast(r.error.message);return}await this.muatKunciList();render();toast("Kunci ini sekarang jadi kunci aktif untuk semua penilai")},
  async simpanUnsur(){
    if(!this.admin)return;this.setSync("run");
    const berkas={};Object.keys(KJ).forEach(j=>{const m=KJ_META[j]||{};berkas[j]={k:KJ[j].map(({unsur,...r})=>r),sheet:m.sheet,notes:m.notes||[],pinjam:!!m.pinjam}});
    const{error}=await this.sb.from("kunci").update({berkas,updated_at:new Date().toISOString(),updated_by:this.email}).eq("id",this.kunciId);
    this.setSync(error?"err":"ok");if(error)toast("Gagal menyimpan unsur: "+error.message);
  },

  /* ---------- peserta & fisik ---------- */
  async ambilSemua(tabel,kolom){let out=[],from=0;for(;;){const{data,error}=await this.sb.from(tabel).select(kolom).eq("kunci_id",this.kunciId).range(from,from+999);if(error)throw error;out=out.concat(data);if(data.length<1000)break;from+=1000}return out},
  async muatData(){
    if(!this.kunciId){VIEW="kunci";render();return}
    try{
      const[ps,fs]=await Promise.all([this.ambilSemua("peserta","jabatan,file,data"),this.ambilSemua("fisik","jabatan,file,data,selesai,updated_by")]);
      semua=ps.map(r=>nilaiParsed(r.data,r.file,r.jabatan));
      FISIK={};fs.forEach(r=>{FISIK[r.jabatan+"|"+r.file]={...r.data,selesai:r.selesai,oleh:r.updated_by}});
      if(semua.length&&VIEW==="muat"){VIEW="rekap";const j=Object.keys(JAB).find(k=>semua.some(h=>h.jab===k));if(j&&!semua.some(h=>h.jab===JAKTIF))JAKTIF=j}
    }catch(e){toast("Gagal memuat data: "+e.message)}
    render();
  },
  async simpanPeserta(h){
    this.setSync("run");
    const{error}=await this.sb.from("peserta").upsert({kunci_id:this.kunciId,jabatan:h.jab,file:h.file,nama:h.nama,data:h.parsed,updated_at:new Date().toISOString(),updated_by:this.email});
    this.setSync(error?"err":"ok");if(error)gagal.push([h.file,"Gagal disimpan ke server: "+error.message]);
  },
  async hapusPeserta(jab){
    this.setSync("run");
    const a=await this.sb.from("fisik").delete().eq("kunci_id",this.kunciId).eq("jabatan",jab);
    const b=await this.sb.from("peserta").delete().eq("kunci_id",this.kunciId).eq("jabatan",jab);
    const e=a.error||b.error;this.setSync(e?"err":"ok");if(e)toast("Gagal menghapus: "+e.message);
    Object.keys(FISIK).filter(k=>k.startsWith(jab+"|")).forEach(k=>delete FISIK[k]);
  },
  simpanFisik(h,f){
    const key=h.jab+"|"+h.file;f.oleh=this.email;this.pending[key]=true;this.setSync("run");
    clearTimeout(this.timer[key]);
    this.timer[key]=setTimeout(async()=>{
      const{error}=await this.sb.from("fisik").upsert({kunci_id:this.kunciId,jabatan:h.jab,file:h.file,data:{b:f.b},selesai:!!f.selesai,updated_at:new Date().toISOString(),updated_by:this.email});
      delete this.pending[key];this.setSync(error?"err":Object.keys(this.pending).length?"run":"ok");
      if(error)toast("Nilai fisik "+h.nama+" gagal disimpan: "+error.message);
    },350);
  },
  async hapusFisik(h){clearTimeout(this.timer[h.jab+"|"+h.file]);this.setSync("run");
    const{error}=await this.sb.from("fisik").delete().eq("kunci_id",this.kunciId).eq("jabatan",h.jab).eq("file",h.file);this.setSync(error?"err":"ok");if(error)toast(error.message)},
  async muatCadangan(e){
    const fl=e.target.files[0];e.target.value="";if(!fl)return;
    try{const d=JSON.parse(await fl.text());let n=0;
      for(const[k,v]of Object.entries(d.fisik||{})){const i=k.indexOf("|"),jab=k.slice(0,i),file=k.slice(i+1);const h=semua.find(x=>x.jab===jab&&x.file===file);if(!h)continue;FISIK[k]=v;this.simpanFisik(h,v);n++}
      render();toast(n+" nilai fisik dipulihkan dan dikirim ke server")}catch(err){toast("Cadangan tidak terbaca: "+err.message)}
  },

  /* ---------- realtime: perubahan penilai lain langsung tampil ---------- */
  dengar(){
    if(this.ch)this.sb.removeChannel(this.ch);if(!this.kunciId)return;
    const f="kunci_id=eq."+this.kunciId;
    this.ch=this.sb.channel("praktik-"+this.kunciId)
      .on("postgres_changes",{event:"*",schema:"public",table:"fisik",filter:f},p=>{
        const r=p.new&&p.new.file?p.new:p.old;const key=r.jabatan+"|"+r.file;
        if(p.eventType==="DELETE"){delete FISIK[key]}else{if(r.updated_by===this.email&&this.pending[key])return;FISIK[key]={...r.data,selesai:r.selesai,oleh:r.updated_by}}
        this.renderAman()})
      .on("postgres_changes",{event:"*",schema:"public",table:"peserta",filter:f},p=>{
        const r=p.new&&p.new.file?p.new:p.old;
        semua=semua.filter(h=>!(h.jab===r.jabatan&&h.file===r.file));
        if(p.eventType!=="DELETE"&&r.data)semua.push(nilaiParsed(r.data,r.file,r.jabatan));
        this.renderAman()})
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"kunci",filter:"id=eq."+this.kunciId},async()=>{await this.pakaiKunci();nilaiUlang();this.renderAman()})
      .subscribe();
  },
  renderAman(){
    const a=document.activeElement;
    if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&document.getElementById("main").contains(a)){if(!this.renderTunda){this.renderTunda=true;a.addEventListener("blur",()=>{this.renderTunda=false;render()},{once:true})}return}
    clearTimeout(this._rt);this._rt=setTimeout(render,120);
  },

  /* ---------- kartu kunci (pilih angkatan) ---------- */
  kartuKunci(){
    if(this.kunciList.length<2&&!this.admin)return"";
    return`<div class="field" style="margin:0 0 10px"><select id="kSel" style="min-width:0;width:100%">${this.kunciList.map(k=>`<option value="${k.id}" ${k.id===this.kunciId?"selected":""}>${esc(k.angkatan)}${k.aktif?" · aktif":""}</option>`).join("")}</select></div>
     ${this.admin&&this.kunciList.find(k=>k.id===this.kunciId&&!k.aktif)?`<button class="btn sm ghost" id="kAkt" style="margin-bottom:8px">Jadikan kunci aktif</button>`:""}`;
  },
  pasangKartu(){
    const s=document.getElementById("kSel");if(s)s.onchange=()=>this.gantiKunci(Number(s.value));
    const a=document.getElementById("kAkt");if(a)a.onclick=()=>this.jadikanAktif(this.kunciId);
  },

  /* ---------- tim penilai ---------- */
  async vTim(v){
    v.innerHTML=`<div class="panel"><div class="sub">Memuat…</div></div>`;
    const{data,error}=await this.sb.from("penilai").select("*").order("created_at");
    if(error){v.innerHTML=`<div class="panel">${esc(error.message)}</div>`;return}
    v.innerHTML=`<div class="panel">
      ${this.admin?`<form id="tf" class="toolbar"><div class="field" style="flex:1;min-width:220px"><label>Email</label><input id="tE" type="email" required class="tin"></div>
        <div class="field" style="flex:1;min-width:180px"><label>Nama</label><input id="tN" class="tin"></div>
        <div class="field"><label>Peran</label><select id="tR"><option value="penilai">Penilai</option><option value="admin">Admin</option></select></div>
        <button class="btn pri" type="submit">Tambah penilai</button></form>`:""}
      <div class="tw"><table><thead><tr><th>Email</th><th>Nama</th><th>Peran</th><th></th></tr></thead><tbody>
      ${data.map(p=>`<tr><td><b>${esc(p.email)}</b></td><td>${esc(p.nama||"")}</td><td><span class="pill ${p.peran==="admin"?"ok":"no"}">${p.peran}</span></td>
        <td class="n">${this.admin&&p.email!==this.email?`<button class="btn sm ghost" data-del="${esc(p.email)}">Hapus</button>`:""}</td></tr>`).join("")}
      </tbody></table></div>
      <p class="sub" style="margin-top:12px">Penilai baru: tambahkan emailnya di sini, lalu minta ia membuka alamat tool ini, pilih <b>Daftar</b>, dan konfirmasi lewat email.</p></div>`;
    const f=document.getElementById("tf");
    if(f)f.onsubmit=async ev=>{ev.preventDefault();const em=document.getElementById("tE").value.trim().toLowerCase();
      const{error}=await this.sb.from("penilai").insert({email:em,nama:document.getElementById("tN").value.trim()||null,peran:document.getElementById("tR").value});
      if(error)toast(/duplicate/i.test(error.message)?"Email sudah terdaftar":error.message);else{toast(em+" ditambahkan");this.vTim(v)}};
    v.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(!confirm("Hapus "+b.dataset.del+" dari tim penilai?"))return;
      const{error}=await this.sb.from("penilai").delete().eq("email",b.dataset.del);if(error)toast(error.message);else this.vTim(v)});
  }
};
