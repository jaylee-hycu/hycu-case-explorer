"""data_src/*.csv -> public/data/appraisal.json  (사용: python tools/build_appraisal.py)"""
import csv, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
def num(v):
    v = (v or "").strip().replace(",", "")
    return int(v) if v else None
def read(name):
    with open(root / "data_src" / name, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))
cases = read("appraisal_cases.csv")
items = read("appraisal_items.csv")
known = {c["caseNoID"] for c in cases}
for c in cases:
    for k in ("liabilityPct", "defectTotal", "awardedTotal"):
        c[k] = num(c[k])
for i in items:
    if i["caseNoID"] not in known:
        raise SystemExit(f"cases.csv에 없는 사건번호: {i['caseNoID']}")
    i["appraiserCorrected"] = i["appraiserCorrected"].strip().upper() == "Y"
    i["appraisedAmt"] = num(i["appraisedAmt"])
    i["awardedAmt"] = num(i["awardedAmt"])
out = root / "public" / "data" / "appraisal.json"
out.write_text(json.dumps({"cases": cases, "items": items}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"cases {len(cases)}, items {len(items)} -> {out}")
