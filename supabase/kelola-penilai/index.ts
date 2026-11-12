// Kelola akun penilai tanpa email: admin membuat nama pengguna + password.
// Akun disimpan di Supabase Auth dengan email sintetis <nama>@penilai.local (tidak ada email yang dikirim).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const DOM = "penilai.local";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jawab = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const adm = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = await adm.auth.getUser(token);
    if (!user) return jawab({ error: "Belum masuk" }, 401);
    const saya = String(user.email || "").toLowerCase();
    const { data: me } = await adm.from("penilai").select("peran").eq("email", saya).maybeSingle();
    if (!me || me.peran !== "admin") return jawab({ error: "Hanya admin yang bisa mengelola akun" }, 403);

    const b = await req.json();
    const aksi = String(b.aksi || "");
    let email = String(b.email || "").trim().toLowerCase();
    const lewatNama = !email && !!b.pengguna;
    if (lewatNama) {
      const p = String(b.pengguna).trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(p)) return jawab({ error: "Nama pengguna 3–40 karakter: huruf kecil, angka, titik, garis bawah, atau strip" }, 400);
      email = p + "@" + DOM;
    }
    if (!email) return jawab({ error: "Nama pengguna kosong" }, 400);
    const cari = async () => {
      for (let page = 1; page < 50; page++) {
        const { data, error } = await adm.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        const u = data.users.find((x) => String(x.email).toLowerCase() === email);
        if (u) return u;
        if (data.users.length < 200) return null;
      }
      return null;
    };
    const pw = String(b.password || "");

    if (aksi === "buat") {
      if (pw.length < 8) return jawab({ error: "Password minimal 8 karakter" }, 400);
      const peran = b.peran === "admin" ? "admin" : "penilai";
      const ada = await cari();
      if (ada && lewatNama) return jawab({ error: "Nama pengguna sudah dipakai. Pilih nama lain, atau pakai Atur password." }, 409);
      if (ada) {
        const { error } = await adm.auth.admin.updateUserById(ada.id, { password: pw, email_confirm: true });
        if (error) throw error;
      } else {
        const { error } = await adm.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { nama: b.nama || null } });
        if (error) throw error;
      }
      const { error: e2 } = await adm.from("penilai").upsert({ email, nama: b.nama || null, peran });
      if (e2) throw e2;
      return jawab({ ok: true, email });
    }
    if (aksi === "reset") {
      if (pw.length < 8) return jawab({ error: "Password minimal 8 karakter" }, 400);
      const u = await cari();
      if (!u) return jawab({ error: "Akun belum ada di sistem login." }, 404);
      const { error } = await adm.auth.admin.updateUserById(u.id, { password: pw, email_confirm: true });
      if (error) throw error;
      return jawab({ ok: true });
    }
    if (aksi === "hapus") {
      if (email === saya) return jawab({ error: "Tidak bisa menghapus akun sendiri" }, 400);
      const { error } = await adm.from("penilai").delete().eq("email", email);
      if (error) throw error;
      const u = await cari();
      if (u && email.endsWith("@" + DOM)) await adm.auth.admin.deleteUser(u.id);
      return jawab({ ok: true });
    }
    return jawab({ error: "Aksi tidak dikenal" }, 400);
  } catch (e) {
    return jawab({ error: String((e as Error)?.message || e) }, 500);
  }
});
