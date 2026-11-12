"""Template_Daftar_Peserta.xlsx — daftar peserta ujian praktik: nama, instansi, jabatan saat ini, tujuan sertifikasi.
  python3 source/buat_template_peserta.py OUT.xlsx                         -> template kosong
  python3 source/buat_template_peserta.py OUT.xlsx SURAT.docx "Instansi"   -> diisi dari Lampiran I surat pemanggilan
Kategori & kunci penilaian dihitung otomatis dari tujuan sertifikasi (rumus Excel).
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
ws["A2"] = ("Isi mulai baris 5: nama, instansi, jabatan saat ini, dan tujuan sertifikasi. Kategori dan kunci penilaian terisi otomatis. "
            "Nama ditulis sama dengan nama di file jawaban supaya bisa dicocokkan otomatis.")
ws["A2"].font = Font(italic=True, color="5F6B76")
ws["A3"] = "Kunci: Terampil, Mahir, PAD → kunci Terampil/Mahir · Penyelia, Ahli Pertama → kunci Penyelia/Pertama · Ahli Muda → kunci Ahli Muda"
ws["A3"].font = Font(color=GOLD)
H = [("No", 6, "Nomor urut."),
     ("Nama", 36, "Nama lengkap peserta (gelar boleh ditulis)."),
     ("NIP", 22, "Opsional, tapi membantu pencocokan bila nama file memuat NIP."),
     ("Instansi", 30, "Instansi/unit kerja peserta."),
     ("Jabatan Saat Ini", 28, "Mis. Pelaksana, Arsiparis Terampil, Arsiparis Ahli Pertama."),
     ("Tujuan Sertifikasi", 28, "Pilih dari daftar: keterampilan (Terampil, Mahir, Penyelia), keahlian (Ahli Pertama, Muda, Madya), atau Pengelolaan Arsip Dinamis (PAD)."),
     ("Kategori", 14, "Otomatis: Keterampilan / Keahlian / PAD."),
     ("Kunci Penilaian", 22, "Otomatis: kunci jawaban yang dipakai untuk menilai peserta ini."),
     ("Nama File Jawaban (opsional)", 32, "Kosongkan. Diisi bila nama file jauh berbeda dari nama peserta.")]
for c, (h, w, tip) in enumerate(H, 1):
    x = ws.cell(row=4, column=c, value=h); x.font = Font(bold=True, color="FFFFFF")
    x.fill = PatternFill("solid", fgColor=("7F8B97" if h in ("Kategori", "Kunci Penilaian") else NAVY))
    x.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center"); x.border = BOX
    ws.column_dimensions[x.column_letter].width = w
    dv = DataValidation(type="custom", formula1="TRUE", allow_blank=True, showInputMessage=True, promptTitle=h[:32], prompt=tip[:255])
    ws.add_data_validation(dv); dv.add(f"{x.column_letter}5:{x.column_letter}{N + 4}")
ws.row_dimensions[4].height = 34
tj = DataValidation(type="list", formula1='"' + ",".join(TUJUAN) + '"', allow_blank=True, showErrorMessage=True, errorStyle="warning",
                    errorTitle="Tujuan sertifikasi", error="Pilih salah satu: " + ", ".join(TUJUAN) + ".")
ws.add_data_validation(tj); tj.add(f"F5:F{N + 4}")
for i in range(N):
    r = i + 5
    ws.cell(row=r, column=1, value=i + 1)
    if i < len(data):
        for c, v in enumerate(data[i], 2): ws.cell(row=r, column=c, value=v)
    F = f"LOWER(F{r})"
    ws.cell(row=r, column=7, value=f'=IF(F{r}="","",IF(OR(ISNUMBER(SEARCH("arsip dinamis",F{r})),ISNUMBER(SEARCH("PAD",F{r}))),"PAD",'
                                    f'IF(OR(ISNUMBER(SEARCH("ahli",F{r})),ISNUMBER(SEARCH("pertama",F{r})),ISNUMBER(SEARCH("muda",F{r})),ISNUMBER(SEARCH("madya",F{r}))),"Keahlian","Keterampilan")))')
    ws.cell(row=r, column=8, value=f'=IF(F{r}="","",IF(OR(ISNUMBER(SEARCH("muda",F{r})),ISNUMBER(SEARCH("madya",F{r}))),"Ahli Muda",'
                                    f'IF(OR(ISNUMBER(SEARCH("pertama",F{r})),ISNUMBER(SEARCH("penyelia",F{r}))),"Penyelia / Ahli Pertama","Terampil / Mahir / PAD")))')
    for c in range(1, 10):
        x = ws.cell(row=r, column=c); x.border = BOX; x.alignment = Alignment(vertical="top", wrap_text=c in (2, 4, 5))
        if c in (7, 8): x.fill = PatternFill("solid", fgColor=GREY)
ws.freeze_panes = "C5"; ws.auto_filter.ref = f"A4:I{N + 4}"

# ringkasan per tujuan
s = wb.create_sheet("RINGKASAN")
s["A1"] = "Ringkasan peserta per tujuan sertifikasi"; s["A1"].font = Font(bold=True, size=12, color=NAVY)
for j, h in enumerate(["Tujuan Sertifikasi", "Kategori", "Kunci Penilaian", "Jumlah"], 1):
    x = s.cell(row=3, column=j, value=h); x.font = Font(bold=True, color="FFFFFF"); x.fill = PatternFill("solid", fgColor=NAVY); x.border = BOX
KAT = {"Pengelolaan Arsip Dinamis": ("PAD", "Terampil / Mahir / PAD")}
for i, t in enumerate(TUJUAN, 4):
    kat, kun = KAT.get(t, ("Keahlian" if "Ahli" in t else "Keterampilan",
                           "Ahli Muda" if ("Muda" in t or "Madya" in t) else "Penyelia / Ahli Pertama" if ("Pertama" in t or "Penyelia" in t) else "Terampil / Mahir / PAD"))
    for j, v in enumerate([t, kat, kun, f"=COUNTIF('DAFTAR PESERTA'!F:F,A{i})"], 1):
        s.cell(row=i, column=j, value=v).border = BOX
e = 4 + len(TUJUAN)
s.cell(row=e, column=1, value="Total").font = Font(bold=True)
s.cell(row=e, column=4, value=f"=SUM(D4:D{e - 1})").font = Font(bold=True)
for c, w in zip("ABCD", (30, 14, 26, 10)): s.column_dimensions[c].width = w

wb.save(OUT); print("daftar:", OUT, "peserta:", len(data))
