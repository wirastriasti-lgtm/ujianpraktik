"""Bangun dua versi tool dari source/:
  python3 source/assemble.py source
    -> Penilaian_Ujian_Praktik_Offline.html  (satu file, kunci Angkatan IX bawaan, tanpa internet)
    -> online/index.html                     (untuk GitHub Pages, data & kunci di Supabase, wajib login)
Butuh node_modules sejajar dengan folder source/: xlsx@0.18.5, @fontsource/inter@5, @fontsource/newsreader@5, @supabase/supabase-js@2.45.4
"""
import base64, os, sys
B = sys.argv[1].rstrip("/"); SP = os.path.dirname(os.path.abspath(B)); NM = SP + "/node_modules/"
def ff(fam, path, w, st):
    return "@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}" % (
        fam, st, w, base64.b64encode(open(NM + "@fontsource/" + path, "rb").read()).decode())
fonts = "\n".join([ff("Newsreader", "newsreader/files/newsreader-latin-500-normal.woff2", 500, "normal"),
                   ff("Newsreader", "newsreader/files/newsreader-latin-500-italic.woff2", 500, "italic"),
                   ff("Inter", "inter/files/inter-latin-400-normal.woff2", 400, "normal"),
                   ff("Inter", "inter/files/inter-latin-500-normal.woff2", 500, "normal"),
                   ff("Inter", "inter/files/inter-latin-600-normal.woff2", 600, "normal"),
                   ff("Inter", "inter/files/inter-latin-700-normal.woff2", 700, "normal")])
rd = lambda p: open(p, encoding="utf-8").read()
shell = rd(B + "/shell.html").replace("/*FONTS*/", fonts)
uri = lambda p: "data:image/png;base64," + base64.b64encode(open(B + "/" + p, "rb").read()).decode()
shell = shell.replace("/*LOGO*/", uri("logo_anri.png")).replace("/*FAVICON*/", uri("favicon_anri.png"))
if ".faint{" not in shell: shell = shell.replace(".toast{", ".faint{color:var(--faint)}\n.toast{")
rules = rd(B + "/rules.js")
i = rules.index(' "<b>Fisik berkas</b>'); j = rules.index('\n', i)
rules = rules[:i] + ' "<b>Fisik berkas</b> (notes + praktik penilai, diisi di menu Penilaian fisik): R guide primer, sekunder, tersier + folder = 25 per bagian benar, 12,5 bila ada tapi kurang tepat, 0 bila tidak ada; semua tidak ada → 20. S indeks/folder = 100 benar, 60 kurang lengkap, 20 salah/tidak membuat. T item di dalam folder = 100 × item benar ÷ jumlah item kunci (3 item → 33,33 per item), 0 → 20. Nilai fisik berkas = (R+S+T) ÷ 3; rata-rata fisik = jumlah 4 berkas ÷ 4. Nilai total = (rata-rata fisik + rata-rata DA) ÷ 2."' + rules[j:]
esc = lambda t: t.replace("</script>", "<\\/script>")
xlsx = esc(rd(NM + "xlsx/dist/xlsx.full.min.js"))
logic, ui = rd(B + "/logic.js"), rd(B + "/ui.js")
ui = ui.replace('"/*TEMPLATE*/"', '"' + base64.b64encode(open(B + "/Template_Kunci_Jawaban.xlsx", "rb").read()).decode() + '"')

if os.path.exists(B + "/kunci_default.js"):
  off = "<script>" + xlsx + "</script>\n<script>\n" + rd(B + "/kunci_default.js") + "\n" + logic + "\n" + rules + "\n" + ui + "\n</script>"
  open(SP + "/Penilaian_Ujian_Praktik_Offline.html", "w", encoding="utf-8").write(shell.replace("<!--SCRIPTS-->", off))

SBJS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"  # UMD build tidak bisa di-inline (webpack publicPath)
on = "<script>" + xlsx + "</script>\n<script src=\"" + SBJS + "\" crossorigin=\"anonymous\"></script>\n<script>\n" + rd(B + "/online.js") + "\n" + logic + "\n" + rules + "\n" + ui + "\n</script>"
os.makedirs(SP + "/online", exist_ok=True)
open(SP + "/online/index.html", "w", encoding="utf-8").write(
    shell.replace("<title>Penilaian Ujian Praktik</title>", "<title>Penilaian Ujian Praktik</title>\n<meta name=\"robots\" content=\"noindex,nofollow\">").replace("<!--SCRIPTS-->", on))
print("built offline + online")
