# Penilaian Ujian Praktik Sertifikasi Arsiparis — versi online

Tool penilaian daftar arsip + penilaian fisik untuk banyak penilai sekaligus.
Halaman ini statis (GitHub Pages); data, kunci jawaban, dan nilai disimpan di Supabase.

- **Kunci jawaban tidak ada di repo ini.** Kunci diunggah admin lewat tool dan disimpan di database; hanya akun terdaftar yang bisa membacanya.
- Login pakai email + password. Email harus didaftarkan admin di menu **Tim penilai** dulu.

## Bangun ulang `index.html`
```bash
npm i xlsx@0.18.5 @fontsource/inter@5 @fontsource/newsreader@5
python3 source/assemble.py source   # menulis online/index.html (dan versi offline bila kunci_default.js ada)
```
