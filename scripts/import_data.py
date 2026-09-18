#!/usr/bin/env python3
"""Turn the raw district data on disk into the JSON the site builds from.

Inputs live in ../tish_paper/district_data (override with TCSD_DATA_DIR).
Outputs:
  src/data/*.json          read by the Astro pages at build time
  public/data/*.csv        the raw files, offered as "Download CSV"
  public/audits/*.pdf      the four State Auditor filings

Requires openpyxl only for the workbook tabs (pip install openpyxl).
Run: python3 scripts/import_data.py
"""
import csv
import datetime as dt
import json
import os
import shutil
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(os.environ.get("TCSD_DATA_DIR", ROOT.parent / "tish_paper" / "district_data"))
DATA = ROOT / "src" / "data"
PUB = ROOT / "public"
XLSX = SRC / "tcsd_openthebooks_2026-09-18.xlsx"


def write(name, obj):
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / name).write_text(json.dumps(obj, indent=1, ensure_ascii=False) + "\n")
    print(f"  wrote src/data/{name}")


def num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return int(f) if f.is_integer() else round(f, 2)


# ---------- CSVs ----------------------------------------------------------

def salaries():
    rows = list(csv.DictReader(open(SRC / "tcsd_salaries_2017-2025.csv", newline="")))
    out = [
        {"year": int(r["Year"]), "name": r["Name"].strip(), "title": r["Title"].strip(), "wages": num(r["Annual Wages"])}
        for r in rows
    ]
    by_year = defaultdict(list)
    for r in out:
        by_year[r["year"]].append(r)
    summary = []
    for y in sorted(by_year):
        w = sorted(x["wages"] or 0 for x in by_year[y])
        total = sum(w)
        summary.append({
            "year": y, "positions": len(w), "total": round(total, 2),
            "average": round(total / len(w), 2), "median": w[len(w) // 2] if len(w) % 2 else (w[len(w) // 2 - 1] + w[len(w) // 2]) / 2,
            "top": max(w),
        })
    bands = [(0, 10000), (10000, 25000), (25000, 40000), (40000, 55000), (55000, 70000), (70000, 100000), (100000, 10**9)]
    band_rows = []
    for y in sorted(by_year):
        counts = [sum(1 for x in by_year[y] if lo <= (x["wages"] or 0) < hi) for lo, hi in bands]
        band_rows.append({"year": y, "counts": counts})
    latest = max(by_year)
    titles = Counter()
    title_pay = defaultdict(float)
    for x in by_year[latest]:
        titles[x["title"]] += 1
        title_pay[x["title"]] += x["wages"] or 0
    top_titles = [
        {"title": t, "positions": n, "total": round(title_pay[t], 2), "average": round(title_pay[t] / n, 2)}
        for t, n in titles.most_common(20)
    ]
    for y, items in by_year.items():
        items.sort(key=lambda x: (-(x["wages"] or 0), x["name"]))
        write(f"salaries-{y}.json", [{k: x[k] for k in ("name", "title", "wages")} for x in items])
    write("salaries-summary.json", {
        "years": summary,
        "bandLabels": ["Under $10K", "$10K–25K", "$25K–40K", "$40K–55K", "$55K–70K", "$70K–100K", "$100K+"],
        "bands": band_rows,
        "topTitlesYear": latest,
        "topTitles": top_titles,
    })


def vendors():
    rows = list(csv.DictReader(open(SRC / "tcsd_checkbook_vendors.csv", newline="")))
    by_year = defaultdict(list)
    for r in rows:
        by_year[int(r["Year"])].append({"vendor": r["Vendor Name"].strip(), "amount": num(r["Amount"])})
    combined = defaultdict(lambda: {"total": 0.0, "years": {}})
    for y, items in by_year.items():
        items.sort(key=lambda x: -(x["amount"] or 0))
        write(f"vendors-{y}.json", items)
        for it in items:
            c = combined[it["vendor"]]
            c["total"] += it["amount"] or 0
            c["years"][str(y)] = round(c["years"].get(str(y), 0) + (it["amount"] or 0), 2)
    top = sorted(combined.items(), key=lambda kv: -kv[1]["total"])
    write("vendors-summary.json", {
        "years": [
            {"year": y, "vendors": len(by_year[y]), "total": round(sum(x["amount"] or 0 for x in by_year[y]), 2)}
            for y in sorted(by_year)
        ],
        "top": [{"vendor": v, "total": round(d["total"], 2), "years": d["years"]} for v, d in top[:25]],
    })


def policies():
    rows = list(csv.DictReader(open(SRC / "tcsd_policy_index.csv", newline="")))
    cutoff = dt.date(2024, 9, 1)
    out = []
    for r in rows:
        rev = r["Last Revised"].strip()
        iso = None
        if rev:
            m, d, y = rev.split("/")
            iso = f"{y}-{int(m):02d}-{int(d):02d}"
        out.append({
            "section": r["Section"].strip(), "code": r["Code"].strip(), "title": r["Title"].strip(),
            "type": r["Type"].strip(), "revised": iso,
            "recent": bool(iso and dt.date.fromisoformat(iso) >= cutoff), "url": r["URL"].strip(),
        })
    write("policies.json", out)


def benchmarks():
    rows = list(csv.DictReader(open(SRC / "tcsd_benchmarks.csv", newline="")))
    out = []
    for r in rows:
        row = {}
        for k, v in r.items():
            v = v.strip()
            try:
                f = float(v)  # keep full precision: shares like 0.584 must not round to 0.58
                row[k] = int(f) if f.is_integer() else f
            except ValueError:
                row[k] = v or None
        out.append(row)
    write("benchmarks.json", out)


# ---------- workbook tabs -------------------------------------------------

def sheet_rows(ws):
    return [list(r) for r in ws.iter_rows(values_only=True)]


def audit_financials(wb):
    rows = sheet_rows(wb["Audit Financials"])
    sections, cur = {}, None
    names = {
        "GENERAL FUND": "generalFund", "ALL GOVERNMENTAL FUNDS": "allFunds",
        "GOVERNMENT-WIDE": "governmentWide", "FY2025 GENERAL FUND BUDGET": "budgetVsActual",
    }
    for r in rows:
        first = r[0]
        if first is None:
            continue
        key = next((v for k, v in names.items() if str(first).startswith(k)), None)
        if key:
            cur = key
            sections[cur] = []
            continue
        if cur is None or first in ("Line item", "Item"):
            continue
        sections[cur].append(r)
    fy = ["FY2025", "FY2024", "FY2023", "FY2022"]
    four = lambda rs: [{"item": r[0], **{y: num(r[i + 1]) for i, y in enumerate(fy)}} for r in rs]
    return {
        "generalFund": four(sections["generalFund"]),
        "allFunds": four(sections["allFunds"]),
        "governmentWide": [
            {"item": r[0], "FY2025": num(r[1]), "FY2024": num(r[2]), "note": r[4]} for r in sections["governmentWide"]
        ],
        "budgetVsActual": [
            {"item": r[0], "original": num(r[1]), "final": num(r[2]), "actual": num(r[3]), "variance": num(r[4])}
            for r in sections["budgetVsActual"]
        ],
    }


def audit_findings(wb):
    rows = sheet_rows(wb["Audit Findings"])[3:]
    out, cur = [], None
    for r in rows:
        if not r[0] or r[0] == "Fiscal year":
            continue
        if r[1]:
            cur = {
                "fy": r[0], "reportDate": r[1].date().isoformat() if hasattr(r[1], "date") else str(r[1]),
                "lateness": r[2], "opinion": r[3], "materialWeakness": r[4], "findings": [],
            }
            out.append(cur)
        cur["findings"].append({"finding": r[5], "repeat": r[6] if r[6] else None})
    return out


def meetings_calendar(wb):
    rows = sheet_rows(wb["Board Meetings"])[3:]
    out = []
    for r in rows:
        if not isinstance(r[0], dt.datetime):
            continue
        out.append({
            "date": r[0].date().isoformat(), "time": r[1], "weekday": r[2], "type": r[3],
            "agendaPublic": r[4] == "Yes", "minutesPublic": r[5] == "Yes", "agendaId": str(r[6]),
        })
    out.sort(key=lambda m: (m["date"], m["time"]))
    return out


def main():
    print(f"Reading {SRC}")
    salaries()
    vendors()
    policies()
    benchmarks()
    import openpyxl
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    write("finances.json", audit_financials(wb))
    write("findings.json", audit_findings(wb))
    write("meetings-calendar.json", meetings_calendar(wb))

    (PUB / "data").mkdir(parents=True, exist_ok=True)
    for f in ("tcsd_salaries_2017-2025.csv", "tcsd_checkbook_vendors.csv", "tcsd_policy_index.csv", "tcsd_benchmarks.csv"):
        shutil.copy2(SRC / f, PUB / "data" / f)
    for src_dir, dest in (("audits", "audits"), ("peer_audits", "peer-audits"), ("ethics", "records")):
        (PUB / dest).mkdir(parents=True, exist_ok=True)
        for pdf in sorted((SRC / src_dir).glob("*.pdf")):
            shutil.copy2(pdf, PUB / dest / pdf.name)
    print("  copied CSVs to public/data and PDFs to public/audits, public/peer-audits, public/records")


if __name__ == "__main__":
    main()
