"""Template_Daftar_Peserta.xlsx — daftar peserta ujian praktik: nama, instansi, jabatan saat ini, tujuan sertifikasi.
  python3 source/buat_template_peserta.py OUT.xlsx                         -> template kosong
  python3 source/buat_template_peserta.py OUT.xlsx SURAT.docx "Instansi"   -> diisi dari Lampiran I surat pemanggilan
Kolom: No, Nama, Instansi, Jabatan, Tujuan Sertifikasi.
"""
import re, sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = sys.argv[1]
NAVY, GOLD, GREY = "1D5A94", "A07D3B", "F1F2F4"
thin = Side(style="thin", color="D9DDE2"); BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
TUJUAN = ["Arsiparis Terampil", "Arsiparis Mahir", "Arsiparis Penyelia", "Arsiparis Ahli Pertama", "Arsiparis Ahli Muda",
          "Arsiparis Ahli Madya", "Pengelolaan Arsip Dinamis"]


def norm_tujuan(t):
    x = t.lower()
    if re.search(r"pengelola(an)?\s*arsip|\bpad\b", x): return "Pengelolaan Arsip Dinamis"
    for k, v in [("madya", "Arsiparis Ahli Madya"), ("muda", "Arsiparis Ahli Muda"), ("pertama", "Arsiparis Ahli Pertama"),
                 ("penyelia", "Arsiparis Penyelia"), ("mahir", "Arsiparis Mahir"), ("terampil", "Arsiparis Terampil")]:
        if k in x: return v
    return t.strip()


def norm_kini(t):
    t = re.sub(r"\s+", " ", t).strip()
    return re.sub(r"^ars[a-z]*ris\b", "Arsiparis", t, flags=re.I)


def dari_surat(path, instansi):
    import docx
    d = docx.Document(path); rows = []
    for t in d.tables:
        head = [c.text.strip().lower() for c in t.rows[0].cells]
        if not any("uji kompetensi" in h for h in head): continue
        ci = next(i for i, h in enumerate(head) if "uji kompetensi" in h)
        ck = next(i for i, h in enumerate(head) if "jabatan saat ini" in h)
        cn = max((i for i, h in enumerate(head) if h == "asesi"), key=lambda i: sum(bool(r.cells[i].text.strip()) for r in t.rows[1:]))
        for r in t.rows[1:]:
            sel = r.cells[cn].text.strip()
            if not sel: continue
            m = re.search(r"NIP\.?\s*:?\s*([\d\s]{18,23})", sel, re.I)
            nip = re.sub(r"\D", "", m.group(1)) if m else ""
            nama = re.sub(r"\s+", " ", sel[:m.start()] if m else sel).strip(" ,;-")
            rows.append([nama, nip, instansi, norm_kini(r.cells[ck].text), norm_tujuan(r.cells[ci].text)])
    return rows


data = dari_surat(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "") if len(sys.argv) > 2 else []
N = max(200, len(data) + 50)

wb = Workbook(); ws = wb.active; ws.title = "DAFTAR PESERTA"
ws["A1"] = "DAFTAR PESERTA UJIAN PRAKTIK SERTIFIKASI ARSIPARIS"; ws["A1"].font = Font(bold=True, size=13, color=NAVY)
ws["A2"] = "Isi mulai baris 5: nama, instansi, jabatan, dan tujuan sertifikasi. Nama ditulis sama dengan nama di file jawaban supaya bisa dicocokkan otomatis."
ws["A2"].font = Font(italic=True, color="5F6B76")
ws["A3"] = "Kunci: Terampil, Mahir, PAD → kunci Terampil/Mahir · Penyelia, Ahli Pertama → kunci Penyelia/Pertama · Ahli Muda → kunci Ahli Muda"
ws["A3"].font = Font(color=GOLD)
H = [("No", 6, "Nomor urut."),
     ("Nama", 38, "Nama lengkap peserta, sama dengan nama di file jawaban."),
     ("Instansi", 34, "Instansi/unit kerja peserta."),
     ("Jabatan", 30, "Jabatan saat ini, mis. Pelaksana, Arsiparis Terampil, Arsiparis Ahli Pertama."),
     ("Tujuan Sertifikasi", 30, "Pilih: keterampilan (Terampil, Mahir, Penyelia), keahlian (Ahli Pertama, Muda, Madya), atau Pengelolaan Arsip Dinamis (PAD).")]
for c, (h, w, tip) in enumerate(H, 1):
    x = ws.cell(row=4, column=c, value=h); x.font = Font(bold=True, color="FFFFFF"); x.fill = PatternFill("solid", fgColor=NAVY)
    x.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center"); x.border = BOX
    ws.column_dimensions[x.column_letter].width = w
    dv = DataValidation(type="custom", formula1="TRUE", allow_blank=True, showInputMessage=True, promptTitle=h[:32], prompt=tip[:255])
    ws.add_data_validation(dv); dv.add(f"{x.column_letter}5:{x.column_letter}{N + 4}")
ws.row_dimensions[4].height = 30
tj = DataValidation(type="list", formula1='"' + ",".join(TUJUAN) + '"', allow_blank=True, showErrorMessage=True, errorStyle="warning",
                    errorTitle="Tujuan sertifikasi", error="Pilih salah satu: " + ", ".join(TUJUAN) + ".")
ws.add_data_validation(tj); tj.add(f"E5:E{N + 4}")
for i in range(N):
    r = i + 5
    ws.cell(row=r, column=1, value=i + 1)
    if i < len(data):
        nama, nip, ins, kini, tuj = data[i]
        for c, v in enumerate([nama, ins, kini, tuj], 2): ws.cell(row=r, column=c, value=v)
    for c in range(1, 6):
        x = ws.cell(row=r, column=c); x.border = BOX; x.alignment = Alignment(vertical="top", wrap_text=c in (2, 3, 4))
ws.freeze_panes = "C5"; ws.auto_filter.ref = f"A4:E{N + 4}"

wb.save(OUT); print("daftar:", OUT, "peserta:", len(data))
