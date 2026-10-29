"""Membuat Template_Kunci_Jawaban.xlsx — format yang dibaca tool (sama dengan file master):
sheet MasterPraktik_<Jabatan>, header di baris 4, kunci 4 berkas di baris 5–8, kolom A–P.
python3 source/buat_template.py source/Template_Kunci_Jawaban.xlsx
"""
import sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = sys.argv[1]
NAVY, GOLD, GREY, LINE = "1D5A94", "A07D3B", "F1F2F4", "D9DDE2"
thin = Side(style="thin", color=LINE)
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="top")

KOL = [  # (kolom, judul, lebar, petunjuk)
    ("A", "No", 5, "Nomor berkas 1–4 (sudah terisi)."),
    ("B", "Kode Klasifikasi (KKA)", 14, "Format XX.00.00, mis. HM.02.04. Dipakai untuk mencocokkan berkas peserta."),
    ("C", "Indeks", 28, "Indeks berkas, mis. PKL Siswa SMK Negeri 8 Jakarta."),
    ("D", "Uraian Informasi Berkas", 40, "Uraian lengkap berkas. Wajib diisi."),
    ("E", "Kurun Waktu", 10, "Tahun, mis. 2019 atau 2019-2020."),
    ("F", "Jumlah", 22, "Satuan yang diterima, dipisah garis miring: 3 item/1 Folder/1 Berkas. Peserta boleh menulis salah satu atau beberapa."),
    ("G", "Klasifikasi Keamanan (SKKA)", 16, "Pilih: Biasa/Terbuka, Terbatas, Rahasia, Sangat Rahasia."),
    ("H", "Retensi Aktif", 22, "Angka + tahun/bulan, boleh dengan syarat. Mis. 1 Tahun setelah SK Ditetapkan."),
    ("I", "Retensi Inaktif", 18, "Angka + tahun/bulan. Mis. 2 Tahun."),
    ("J", "Nasib Akhir", 30, "Musnah / Permanen / Dinilai Kembali, boleh dengan pengecualian. Mis. Musnah, kecuali SK masuk berkas perseorangan."),
    ("K", "Usul Pindah", 10, "Ya/Tidak. Kosongkan = otomatis (semua berkas usul pindah)."),
    ("L", "Usul Musnah", 10, "Ya/Tidak. Kosongkan = otomatis (nasib akhir Musnah → Ya)."),
    ("M", "Usul Serah", 10, "Ya/Tidak. Kosongkan = otomatis (nasib akhir Permanen → Ya)."),
    ("N", "Uraian Item (opsional)", 26, "Daftar item isi berkas, satu per baris (Alt+Enter)."),
    ("O", "Unsur Uraian: kegiatan/inti (opsional)", 30, "Kata inti yang WAJIB ada di uraian peserta. Sinonim dipisah |, mis. kenaikan pangkat | kenaikan golongan. Kosongkan = disusun otomatis dari indeks."),
    ("P", "Unsur Uraian: subjek wajib (opsional)", 30, "Subjek/objek yang wajib ada (siapa/di mana), mis. melati putih berseri. Sinonim dipisah |."),
]
JAB = [
    ("MasterPraktik_TerampilMahirPA", "Terampil / Mahir", "Dinilai: KKA, Uraian, Jumlah, SKKA (÷4). Kolom H–M tidak dinilai — boleh dikosongkan.", set("HIJKLM")),
    ("MasterPraktik_PenyeliaPertama", "Penyelia / Ahli Pertama", "Dinilai: KKA, Uraian, Jumlah, SKKA, Retensi Aktif, Retensi Inaktif, Nasib Akhir (÷7). Kolom K–M tidak dinilai.", set("KLM")),
    ("MasterPraktik_Muda", "Ahli Muda", "Dinilai: semua kolom B–M termasuk usul pindah/musnah/serah (÷10).", set()),
]

wb = Workbook()
p = wb.active
p.title = "PETUNJUK"
rows = [
    ("Template Kunci Jawaban Ujian Praktik Sertifikasi Arsiparis", Font(bold=True, size=14, color=NAVY)),
    ("Direktorat SDM Kearsipan dan Sertifikasi — ANRI", Font(color=GOLD, bold=True)),
    ("", None),
    ("Cara mengisi", Font(bold=True, size=12)),
    ("1. Isi tiga sheet kunci: MasterPraktik_TerampilMahirPA, MasterPraktik_PenyeliaPertama, MasterPraktik_Muda. Satu sheet = kunci satu jabatan.", None),
    ("2. Setiap sheet berisi 4 berkas di baris 5–8. Jangan menggeser baris, menambah baris di atasnya, atau mengganti nama sheet.", None),
    ("3. Kolom berwarna abu-abu tidak dinilai untuk jabatan itu — boleh dikosongkan.", None),
    ("4. Arahkan kursor ke sel judul kolom (baris 4) atau klik sel isian untuk melihat petunjuk tiap kolom.", None),
    ("5. Simpan sebagai .xlsx, beri nama yang memuat angkatan (mis. Kunci_Angkatan_XI.xlsx), lalu unggah lewat tombol 'Upload kunci jawaban'.", None),
    ("6. Tool akan memeriksa isian. Bila ada yang salah format, kunci ditolak dan daftar perbaikannya ditampilkan.", None),
    ("", None),
    ("Contoh isian satu berkas (fiktif)", Font(bold=True, size=12)),
]
for i, (t, f) in enumerate(rows, 1):
    c = p.cell(row=i, column=1, value=t)
    if f: c.font = f
ex_head = [k[1] for k in KOL]
ex = ["2", "KP.05.00", "Kenaikan Pangkat Pegawai", "Berkas kenaikan pangkat pegawai a.n. Budi Contoh", "2019", "3 item/1 Folder/1 Berkas",
      "Terbatas", "1 Tahun setelah SK Ditetapkan", "2 Tahun", "Musnah, kecuali SK masuk berkas perseorangan", "", "", "",
      "Surat usulan\nNota pertimbangan\nSK kenaikan pangkat", "kenaikan pangkat | kenaikan golongan", "budi contoh"]
r0 = len(rows) + 1
for j, (h, v) in enumerate(zip(ex_head, ex), 1):
    a = p.cell(row=r0, column=j, value=h); a.font = Font(bold=True, color="FFFFFF"); a.fill = PatternFill("solid", fgColor=NAVY); a.alignment = WRAP; a.border = BOX
    b = p.cell(row=r0 + 1, column=j, value=v); b.alignment = WRAP; b.border = BOX
for j, k in enumerate(KOL, 1):
    p.column_dimensions[k[0]].width = k[2]
p.column_dimensions["A"].width = 6
p.row_dimensions[r0].height = 45
p.row_dimensions[r0 + 1].height = 60
r = r0 + 3
p.cell(row=r, column=1, value="Aturan penilaian yang memakai kolom ini").font = Font(bold=True, size=12)
for t in ["Jumlah (F): jawaban peserta benar bila semua angka+satuannya ada di kunci (mis. 1 folder, 3 item, 1 berkas).",
          "Retensi (H/I): jangka waktu wajib sama; syarat ('setelah …') ditulis singkat atau lengkap nilainya sama; tanpa syarat → 50.",
          "Nasib akhir (J): jenis wajib sama; pengecualian ('kecuali …') ditulis singkat atau lengkap nilainya sama; tanpa pengecualian → 50.",
          "Unsur uraian (O/P): kegiatan/inti salah → 20; subjek kurang sebagian 90, hilang 80. Bila dikosongkan, tool menyusunnya dari Indeks dan tim penilai perlu mengecek di menu Kunci & rules."]:
    r += 1
    p.cell(row=r, column=1, value="• " + t)

for name, label, ket, abu in JAB:
    ws = wb.create_sheet(name)
    ws["A1"] = "KUNCI JAWABAN — " + label.upper()
    ws["A1"].font = Font(bold=True, size=13, color=NAVY)
    ws["A2"] = ket
    ws["A2"].font = Font(italic=True, color="5F6B76")
    ws["A3"] = "Isi baris 5–8 (4 berkas). Jangan ubah nama sheet, posisi judul, atau nomor di kolom A."
    ws["A3"].font = Font(color=GOLD)
    for k, (col, judul, lebar, tip) in enumerate(KOL, 1):
        h = ws.cell(row=4, column=k, value=judul)
        h.font = Font(bold=True, color="FFFFFF")
        h.fill = PatternFill("solid", fgColor=("9AA3AD" if col in abu else NAVY))
        h.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        h.border = BOX
        ws.column_dimensions[col].width = lebar
        dv = DataValidation(type="custom", formula1="TRUE", allow_blank=True, showInputMessage=True,
                            promptTitle=judul[:32], prompt=tip[:255])
        ws.add_data_validation(dv); dv.add(f"{col}5:{col}8")
    ws.row_dimensions[4].height = 48
    for r in range(5, 9):
        ws.row_dimensions[r].height = 48
        for k, (col, *_r) in enumerate(KOL, 1):
            c = ws.cell(row=r, column=k)
            c.alignment = WRAP; c.border = BOX
            if col in abu: c.fill = PatternFill("solid", fgColor=GREY)
        ws.cell(row=r, column=1, value=r - 4).alignment = Alignment(horizontal="center", vertical="top")
        ws.cell(row=r, column=1).font = Font(bold=True)
    skka = DataValidation(type="list", formula1='"Biasa/Terbuka,Terbatas,Rahasia,Sangat Rahasia"', allow_blank=True,
                          showErrorMessage=True, errorTitle="SKKA", error="Pilih Biasa/Terbuka, Terbatas, Rahasia, atau Sangat Rahasia.")
    ws.add_data_validation(skka); skka.add("G5:G8")
    ya = DataValidation(type="list", formula1='"Ya,Tidak"', allow_blank=True, showErrorMessage=True, errorTitle="Usul", error="Isi Ya, Tidak, atau kosongkan.")
    ws.add_data_validation(ya); ya.add("K5:M8")
    kk = DataValidation(type="custom", formula1='OR(B5="",AND(LEN(B5)>=5,MID(B5,3,1)="."))', allow_blank=True, showErrorMessage=True,
                        errorStyle="warning", errorTitle="Kode klasifikasi", error="Format kode klasifikasi biasanya XX.00.00, mis. HM.02.04.")
    ws.add_data_validation(kk); kk.add("B5:B8")
    ws.freeze_panes = "B5"
    ws.sheet_view.zoomScale = 90

wb.active = 1
wb.save(OUT)
print("template:", OUT)
