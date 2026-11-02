"""Template_Daftar_Peserta.xlsx — daftar peserta ujian praktik (nama, jenis sertifikasi, tujuan jabatan)."""
import sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation
OUT=sys.argv[1]; NAVY="1D5A94"; thin=Side(style="thin",color="D9DDE2"); BOX=Border(left=thin,right=thin,top=thin,bottom=thin)
wb=Workbook(); ws=wb.active; ws.title="DAFTAR PESERTA"
ws["A1"]="DAFTAR PESERTA UJIAN PRAKTIK SERTIFIKASI ARSIPARIS"; ws["A1"].font=Font(bold=True,size=13,color=NAVY)
ws["A2"]="Isi mulai baris 5. Nama ditulis sama dengan nama di file jawaban peserta supaya bisa dicocokkan otomatis. Tujuan jabatan menentukan kunci dan pembagi nilai."; ws["A2"].font=Font(italic=True,color="5F6B76")
H=[("No",6,"Nomor urut."),("Nama",34,"Nama lengkap peserta (tanpa gelar juga boleh)."),("NIP",22,"Opsional. Bila nama file memuat NIP, pencocokan lebih pasti."),
   ("Instansi",34,"Instansi/unit kerja peserta."),("Jenis Sertifikasi",28,"Mis. Pengangkatan Pertama, Perpindahan Jabatan, Kenaikan Jenjang. Boleh diketik bebas."),
   ("Tujuan Jabatan",26,"Pilih: Arsiparis Terampil, Mahir, Penyelia, Ahli Pertama, atau Ahli Muda."),("Nama File Jawaban (opsional)",34,"Kosongkan. Diisi bila nama file jauh berbeda dari nama peserta.")]
for c,(h,w,tip) in enumerate(H,1):
    x=ws.cell(row=4,column=c,value=h); x.font=Font(bold=True,color="FFFFFF"); x.fill=PatternFill("solid",fgColor=NAVY); x.alignment=Alignment(wrap_text=True,vertical="center",horizontal="center"); x.border=BOX
    ws.column_dimensions[x.column_letter].width=w
    dv=DataValidation(type="custom",formula1="TRUE",allow_blank=True,showInputMessage=True,promptTitle=h[:32],prompt=tip); ws.add_data_validation(dv); dv.add(f"{x.column_letter}5:{x.column_letter}400")
ws.row_dimensions[4].height=34
tj=DataValidation(type="list",formula1='"Arsiparis Terampil,Arsiparis Mahir,Arsiparis Penyelia,Arsiparis Ahli Pertama,Arsiparis Ahli Muda"',allow_blank=True,showErrorMessage=True,errorStyle="warning",errorTitle="Tujuan jabatan",error="Biasanya salah satu dari: Arsiparis Terampil, Mahir, Penyelia, Ahli Pertama, Ahli Muda.")
ws.add_data_validation(tj); tj.add("F5:F400")
js=DataValidation(type="list",formula1='"Pengangkatan Pertama,Perpindahan Jabatan,Kenaikan Jenjang,Penyesuaian/Inpassing"',allow_blank=True,showErrorMessage=True,errorStyle="information",errorTitle="Jenis sertifikasi",error="Nilai di luar daftar tetap boleh dipakai.")
ws.add_data_validation(js); js.add("E5:E400")
for r in range(5,205):
    ws.cell(row=r,column=1,value=r-4)
    for c in range(1,8): ws.cell(row=r,column=c).border=BOX
ws.freeze_panes="B5"
wb.save(OUT); print("template:",OUT)
