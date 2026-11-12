/* ================= VERSI ONLINE (Supabase) =================
   Dimuat sebelum logic.js/ui.js. Kunci jawaban TIDAK ada di kode ini — diambil dari database
   setelah login, dan hanya email yang terdaftar di tabel penilai yang bisa membacanya (RLS). */
window.ONLINE=true;
const SB_URL="https://akarxmsrsvyroovzqgcw.supabase.co";
const SB_KEY="sb_publishable_HRIOy7IV-sAQvvGr0hFa1A_6aEqLqXc";

// nama pengguna tanpa email → disimpan sebagai <nama>@penilai.local di Supabase Auth
const keEmail=v=>{v=String(v||"").trim().toLowerCase();return v.includes("@")?v:v+"@penilai.local"};
const namaAkun=e=>String(e||"").replace(/@penilai\.local$/,"");
function buatPassword(){const a="abcdefghjkmnpqrstuvwxyz23456789",r=new Uint32Array(10);crypto.getRandomValues(r);return[...r].map((x,i)=>(i===4?"-":"")+a[x%a.length]).join("")}
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
    const lead={masuk:"Masuk dengan nama pengguna dan password dari admin (atau email, bila akunmu memakai email).",daftar:"Pakai email yang sudah didaftarkan admin. Setelah daftar, buka email konfirmasi dari Supabase, lalu kembali ke sini untuk masuk.",lupa:"Akun dengan nama pengguna: minta admin mengatur ulang password di menu Tim verifikator. Akun dengan email: kami kirim tautan atur ulang ke email kamu.",baru:"Ketik password baru untuk akun ini.",tolak:""}[mode];
    el.innerHTML=`<div class="lbox"><div class="eyebrow">Ujian praktik sertifikasi</div><h1 class="sm">${judul}</h1><p class="lead sm">${pesan||lead}</p>
      ${mode==="tolak"?`<button class="btn" id="lOut">Keluar</button>`:`<form id="lf">
      ${mode!=="baru"?`<label>${mode==="masuk"?"Nama pengguna atau email":"Email"}<input type="${mode==="masuk"?"text":"email"}" id="lE" required autocomplete="username" autocapitalize="none" spellcheck="false"></label>`:""}
      ${mode!=="lupa"?`<label>Password<input type="password" id="lP" required minlength="8" autocomplete="${mode==="masuk"?"current-password":"new-password"}"></label>`:""}
      <button class="btn pri" type="submit" id="lGo">${{masuk:"Masuk",daftar:"Daftar",lupa:"Kirim tautan",baru:"Simpan password"}[mode]}</button></form>
      <div class="lalt">${mode==="masuk"?`<button class="btn ghost sm" data-m="lupa">Lupa password</button>`:mode!=="baru"?`<button class="btn ghost sm" data-m="masuk">← Kembali ke masuk</button>`:""}</div>`}
      <div class="lmsg" id="lMsg"></div></div>`;
    el.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>this.layarLogin(b.dataset.m));
    const out=document.getElementById("lOut");if(out)out.onclick=()=>this.sb.auth.signOut();
    const f=document.getElementById("lf");if(!f)return;
    f.onsubmit=async ev=>{ev.preventDefault();const msg=document.getElementById("lMsg"),go=document.getElementById("lGo");go.disabled=true;msg.textContent="Memproses…";
      const E=keEmail((document.getElementById("lE")||{}).value),P=(document.getElementById("lP")||{}).value,redirect=location.origin+location.pathname;
      try{
        if(mode==="masuk"){const{data,error}=await this.sb.auth.signInWithPassword({email:E,password:P});if(error)throw error;await this.setelahLogin(data.session)}
        else if(mode==="daftar"){const{data,error}=await this.sb.auth.signUp({email:E,password:P,options:{emailRedirectTo:redirect}});if(error)throw error;
          if(data.session)await this.setelahLogin(data.session);else{msg.textContent="Cek email "+E+" dan klik tautan konfirmasi, lalu masuk di sini.";go.disabled=false}}
        else if(mode==="lupa"){const{error}=await this.sb.auth.resetPasswordForEmail(E,{redirectTo:redirect});if(error)throw error;msg.textContent="Tautan terkirim ke "+E+".";go.disabled=false}
        else if(mode==="baru"){const{error}=await this.sb.auth.updateUser({password:P});if(error)throw error;const{data:{session}}=await this.sb.auth.getSession();await this.setelahLogin(session)}
      }catch(e){msg.textContent=this.pesanError(e);go.disabled=false}};
  },
  pesanError(e){const m=String(e&&e.message||e);
    if(/invalid login/i.test(m))return"Nama pengguna/email atau password salah.";if(/not confirmed/i.test(m))return"Email belum dikonfirmasi. Buka email konfirmasi dari Supabase dulu.";
    if(/already registered/i.test(m))return"Email ini sudah terdaftar. Silakan masuk atau pakai Lupa password.";if(/rate limit/i.test(m))return"Terlalu banyak percobaan. Tunggu beberapa menit.";return m},

  async setelahLogin(session){
    this.email=String(session.user.email||"").toLowerCase();
    const{data:me,error}=await this.sb.from("penilai").select("*").eq("email",this.email).maybeSingle();
    if(error||!me)return this.layarLogin("tolak",`Akun <b>${esc(namaAkun(this.email))}</b> belum terdaftar sebagai verifikator. Minta admin menambahkannya di menu Tim verifikator, lalu muat ulang halaman ini.`);
    this.nama=me.nama||namaAkun(this.email);this.admin=me.peran==="admin";
    const tm=await this.sb.from("penilai").select("email,nama");this.timMap={};(tm.data||[]).forEach(p=>{if(p.nama){this.timMap[p.email]=p.nama;this.timMap[namaAkun(p.email)]=p.nama}});
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
    d.innerHTML=`<span class="sdot" id="sdot" title="Tersinkron"></span><span><b>${esc(this.nama)}</b><span class="sub">${this.admin?"admin":"verifikator"}</span></span><button class="btn sm ghost" id="uOut">Keluar</button>`;
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
    semua=[];FISIK={};VER={};DAFTAR=[];FSEL=null;await this.pakaiKunci();await this.muatData();this.dengar();toast("Kunci aktif: "+KUNCI_SRC)},
  async simpanKunciBaru(m,fname,angkatan){
    if(!this.admin){toast("Hanya admin yang bisa mengunggah kunci.");return}
    if(!angkatan)return;
    const berkas={};Object.keys(m.jab).forEach(j=>{const{cacat,sheetKosong,kolom,...x}=m.jab[j];berkas[j]={...x,k:x.k.map(k=>({...k,unsurSimpan:k.unsurSimpan||unsurBawaan(k)}))}});
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
      const[ps,fs,vs]=await Promise.all([this.ambilSemua("peserta","jabatan,file,data"),this.ambilSemua("fisik","jabatan,file,data,selesai,updated_by"),this.ambilSemua("verifikasi","jabatan,file,data")]);
      await this.muatDaftarServer();
      VER={};vs.forEach(r=>{VER[r.jabatan+"|"+r.file]={kor:{},cek:{},...r.data}});
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
    await this.sb.from("verifikasi").delete().eq("kunci_id",this.kunciId).eq("jabatan",jab);
    const a=await this.sb.from("fisik").delete().eq("kunci_id",this.kunciId).eq("jabatan",jab);
    const b=await this.sb.from("peserta").delete().eq("kunci_id",this.kunciId).eq("jabatan",jab);
    const e=a.error||b.error;this.setSync(e?"err":"ok");if(e)toast("Gagal menghapus: "+e.message);
    Object.keys(FISIK).filter(k=>k.startsWith(jab+"|")).forEach(k=>delete FISIK[k]);
  },
  /* ---------- daftar peserta ---------- */
  dariBaris(r){return{id:"d"+r.id,dbid:r.id,no:r.urut,nama:r.nama,nip:r.nip||"",instansi:r.instansi||"",jenis:r.jenis||"",tujuan:r.tujuan||"",jabatanKini:r.jabatan_kini||"",jab:r.jabatan||null,fileHint:r.file_hint||"",file:r.file||null,jabPakai:r.jab_pakai||null}},
  async muatDaftarServer(){const rows=await this.ambilSemua("daftar_peserta","*");DAFTAR=rows.sort((a,b)=>(a.urut||0)-(b.urut||0)).map(r=>this.dariBaris(r))},
  async tambahDaftar(list){
    if(!this.admin){toast("Hanya admin yang bisa menambah daftar peserta.");return false}
    if(!list.length)return true;this.setSync("run");
    const rows=list.map(d=>({kunci_id:this.kunciId,urut:d.no,nama:d.nama,nip:d.nip||null,instansi:d.instansi||null,jenis:d.jenis||null,tujuan:d.tujuan||null,jabatan_kini:d.jabatanKini||null,jabatan:d.jab||null,file_hint:d.fileHint||null,file:null,updated_by:this.email}));
    const{data,error}=await this.sb.from("daftar_peserta").insert(rows).select("*");
    if(error){this.setSync("err");toast("Gagal menambah daftar: "+error.message);return false}
    DAFTAR=DAFTAR.concat(data.map(r=>this.dariBaris(r)));this.setSync("ok");return true;
  },
  async simpanDaftar(list){
    if(!this.admin){toast("Hanya admin yang bisa mengunggah daftar peserta.");return false}
    this.setSync("run");
    const del=await this.sb.from("daftar_peserta").delete().eq("kunci_id",this.kunciId);
    if(del.error){this.setSync("err");toast("Gagal mengganti daftar: "+del.error.message);return false}
    const rows=list.map(d=>({kunci_id:this.kunciId,urut:d.no,nama:d.nama,nip:d.nip||null,instansi:d.instansi||null,jenis:d.jenis||null,tujuan:d.tujuan||null,jabatan_kini:d.jabatanKini||null,jabatan:d.jab||null,file_hint:d.fileHint||null,file:null,updated_by:this.email}));
    const{data,error}=await this.sb.from("daftar_peserta").insert(rows).select("*");
    if(error){this.setSync("err");toast("Gagal menyimpan daftar: "+error.message);return false}
    DAFTAR=data.sort((a,b)=>(a.urut||0)-(b.urut||0)).map(r=>this.dariBaris(r));this.setSync("ok");return true;
  },
  async simpanLink(d){if(!d.dbid)return;this.setSync("run");
    const{error}=await this.sb.from("daftar_peserta").update({file:d.file,jab_pakai:d.file?(d.jabPakai||d.jab):null,updated_at:new Date().toISOString(),updated_by:this.email}).eq("id",d.dbid);
    this.setSync(error?"err":"ok");if(error)toast("Gagal menyimpan hubungan "+d.nama+": "+error.message)},
  simpanVer(h,data){
    const key=h.jab+"|"+h.file;this.pending["v|"+key]=true;this.setSync("run");clearTimeout(this.timer["v|"+key]);
    this.timer["v|"+key]=setTimeout(async()=>{
      const{error}=await this.sb.from("verifikasi").upsert({kunci_id:this.kunciId,jabatan:h.jab,file:h.file,data,updated_at:new Date().toISOString(),updated_by:this.email});
      delete this.pending["v|"+key];this.setSync(error?"err":Object.keys(this.pending).length?"run":"ok");
      if(error)toast("Koreksi/cek "+h.nama+" gagal disimpan: "+error.message);
    },300);
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
  async hapusSatu(h){this.setSync("run");const q=t=>this.sb.from(t).delete().eq("kunci_id",this.kunciId).eq("jabatan",h.jab).eq("file",h.file);
    const r=await Promise.all([q("verifikasi"),q("fisik")]);const p=await q("peserta");const e=r.concat([p]).find(x=>x.error);this.setSync(e?"err":"ok");if(e)toast("Gagal menghapus: "+e.error.message)},
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
      .on("postgres_changes",{event:"*",schema:"public",table:"daftar_peserta",filter:f},()=>{clearTimeout(this._dt);this._dt=setTimeout(async()=>{await this.muatDaftarServer();this.renderAman()},400)})
      .on("postgres_changes",{event:"*",schema:"public",table:"verifikasi",filter:f},p=>{
        const r=p.new&&p.new.file?p.new:p.old;const key=r.jabatan+"|"+r.file;
        if(p.eventType==="DELETE")delete VER[key];else{if(r.updated_by===this.email&&this.pending["v|"+key])return;VER[key]={kor:{},cek:{},...r.data}}
        const i=semua.findIndex(h=>h.jab===r.jabatan&&h.file===r.file);if(i>=0)semua[i]=nilaiParsed(semua[i].parsed,semua[i].file,semua[i].jab);
        this.renderAman()})
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
  // akun tanpa email: admin membuat nama pengguna + password lewat edge function kelola-penilai
  async kelola(body){const{data,error}=await this.sb.functions.invoke("kelola-penilai",{body});
    if(error){let m=error.message;try{const j=await error.context.json();if(j&&j.error)m=j.error}catch(e){}throw new Error(m)}
    if(data&&data.error)throw new Error(data.error);return data},
  async tampilPassword(judul,pengguna,pw){
    if(await konfirmasi({judul,pesan:`Berikan ke penilai:<br>Alamat: <b>${esc(location.origin+location.pathname)}</b><br>Nama pengguna: <b>${esc(pengguna)}</b><br>Password: <b style="font-family:monospace;font-size:15px">${esc(pw)}</b>`,
      catatan:"Password hanya tampil sekali ini. Salin sekarang; bila lupa, atur ulang dari menu ini.",ok:"Salin semua",batal:"Tutup",jenis:"info"}))
      try{await navigator.clipboard.writeText(`Penilaian Ujian Praktik\n${location.origin+location.pathname}\nNama pengguna: ${pengguna}\nPassword: ${pw}`);toast("Disalin")}catch(e){toast("Tidak bisa menyalin otomatis — salin manual")}},
  async vTim(v){
    v.innerHTML=`<div class="panel"><div class="sub">Memuat…</div></div>`;
    const{data,error}=await this.sb.from("penilai").select("*").order("created_at");
    if(error){v.innerHTML=`<div class="panel">${esc(error.message)}</div>`;return}
    v.innerHTML=`<div class="panel">
      ${this.admin?`<form id="tf" class="toolbar" autocomplete="off"><div class="field" style="flex:1;min-width:170px"><label>Nama pengguna</label><input id="tU" required class="tin" placeholder="mis. budi.s" pattern="[A-Za-z0-9][A-Za-z0-9._\\-]{2,39}" title="3–40 karakter: huruf, angka, titik, garis bawah, strip" autocapitalize="none" spellcheck="false"></div>
        <div class="field" style="flex:1;min-width:180px"><label>Nama lengkap</label><input id="tN" class="tin" placeholder="mis. Budi Santoso"></div>
        <div class="field"><label>Peran</label><select id="tR"><option value="penilai">Verifikator</option><option value="admin">Admin</option></select></div>
        <div class="field" style="min-width:170px"><label>Password</label><input id="tP" class="tin" minlength="8" required value="${buatPassword()}" style="font-family:monospace"></div>
        <button class="btn pri" type="submit" id="tGo">Buat akun</button></form>`:""}
      <div class="tw"><table><thead><tr><th>Nama pengguna / email</th><th>Nama</th><th>Peran</th><th></th></tr></thead><tbody>
      ${data.map(p=>`<tr><td><b>${esc(namaAkun(p.email))}</b>${/@penilai\.local$/.test(p.email)?"":` <span class="sub">(email)</span>`}</td><td>${esc(p.nama||"")}</td><td><span class="pill ${p.peran==="admin"?"ok":"no"}">${p.peran==="admin"?"admin":"verifikator"}</span></td>
        <td class="n" style="white-space:nowrap">${this.admin?`<button class="btn sm ghost" data-pw="${esc(p.email)}">Atur password</button>`:""}${this.admin&&p.email!==this.email?` <button class="btn sm ghost" data-del="${esc(p.email)}">Hapus</button>`:""}</td></tr>`).join("")}
      </tbody></table></div>
      <p class="sub" style="margin-top:12px">Verifikator baru tidak perlu email: buat nama pengguna dan password di sini, lalu bagikan. Ia masuk dengan nama pengguna dan password itu. Isi nama lengkap — nama itu yang tercatat sebagai "diverifikasi oleh" di rekap dan Excel.</p></div>`;
    const f=document.getElementById("tf");
    if(f)f.onsubmit=async ev=>{ev.preventDefault();const go=document.getElementById("tGo"),u=document.getElementById("tU").value.trim().toLowerCase(),pw=document.getElementById("tP").value;go.disabled=true;
      try{await this.kelola({aksi:"buat",pengguna:u,nama:document.getElementById("tN").value.trim(),peran:document.getElementById("tR").value,password:pw});
        await this.vTim(v);await this.tampilPassword(`Akun <em>${esc(u)}</em> dibuat`,u,pw)}catch(e){toast(e.message);go.disabled=false}};
    v.querySelectorAll("[data-pw]").forEach(b=>b.onclick=async()=>{const em=b.dataset.pw,u=namaAkun(em);
      if(!await konfirmasi({judul:`Atur ulang password <em>${esc(u)}</em>?`,pesan:"Password lama tidak berlaku lagi. Password baru dibuat otomatis dan ditampilkan sekali.",ok:"Buat password baru",jenis:"info"}))return;
      const pw=buatPassword();try{await this.kelola({aksi:em.endsWith("@penilai.local")?"reset":"buat",email:em,password:pw,nama:(data.find(x=>x.email===em)||{}).nama,peran:(data.find(x=>x.email===em)||{}).peran});await this.tampilPassword(`Password baru <em>${esc(u)}</em>`,em.endsWith("@penilai.local")?u:em,pw)}catch(e){toast(e.message)}});
    v.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(!await konfirmasi({judul:`Hapus <em>${esc(namaAkun(b.dataset.del))}</em> dari tim verifikator?`,pesan:"Akun ini tidak bisa lagi membuka data penilaian. Nilai yang sudah ia masukkan tetap tersimpan.",ok:"Ya, hapus akun"}))return;
      try{await this.kelola({aksi:"hapus",email:b.dataset.del});this.vTim(v)}catch(e){toast(e.message)}});
  }
};
