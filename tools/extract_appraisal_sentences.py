"""판결문 전문(.txt) 폴더에서 '감정' 포함 문장을 뽑아 라벨링용 CSV로 저장.
사용: python tools/extract_appraisal_sentences.py <텍스트폴더> <출력.csv>
파일명은 사건번호(예: 2020나2027066.txt)로 저장해 두면 됩니다. 라벨(type 등)은 사람이 붙입니다."""
import csv, pathlib, re, sys
src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
rows = []
for p in sorted(src.glob("*.txt")):
    text = p.read_text(encoding="utf-8", errors="ignore")
    for s in re.split(r"(?<=[.다])\s+", text):
        if "감정" in s and re.search(r"\d", s):
            rows.append([p.stem, s.strip()[:400], "", "", ""])
with open(dst, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["caseNoID", "sentence", "type", "appraiserCorrected(Y/N)", "courtResult"])
    w.writerows(rows)
print(f"{len(rows)}개 문장 -> {dst}")
