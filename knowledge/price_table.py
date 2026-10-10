# Yara: price table for the chatbot
#
# Paste this whole file into a Dify "Code" node (Python 3).
#   Input variable:   body   <- the HTTP Request node's body (the Google Sheet as CSV)
#   Output variables: price_table (String), today (String)
#
# It reads the same sheet the website uses, works out grams of protein per riyal for every
# row, marks old prices, and sorts everything so the bot never has to do the math itself.

import csv
import io
import re
from datetime import date

STALE_DAYS = 60  # keep this the same as staleAfterDays in the website's config.js

# unit typed in the sheet -> (base unit, multiplier to base, unit to show)
UNITS = {
    "g": ("g", 1, "g"), "gm": ("g", 1, "g"), "gr": ("g", 1, "g"), "gram": ("g", 1, "g"), "grams": ("g", 1, "g"),
    "جم": ("g", 1, "g"), "غ": ("g", 1, "g"), "جرام": ("g", 1, "g"), "غرام": ("g", 1, "g"),
    "kg": ("g", 1000, "kg"), "كجم": ("g", 1000, "kg"), "كغ": ("g", 1000, "kg"), "كيلو": ("g", 1000, "kg"),
    "ml": ("ml", 1, "ml"), "مل": ("ml", 1, "ml"),
    "l": ("ml", 1000, "L"), "ltr": ("ml", 1000, "L"), "litre": ("ml", 1000, "L"), "liter": ("ml", 1000, "L"),
    "لتر": ("ml", 1000, "L"),
    "pcs": ("pcs", 1, "pcs"), "pc": ("pcs", 1, "pcs"), "piece": ("pcs", 1, "pcs"), "pieces": ("pcs", 1, "pcs"),
    "حبة": ("pcs", 1, "pcs"),
}

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹٫٬", "01234567890123456789.,")


def to_number(value):
    text = re.sub(r"[^\d.,-]", "", str(value or "").translate(ARABIC_DIGITS))
    if not text:
        return None
    text = text.replace(",", ".") if ("," in text and "." not in text) else text.replace(",", "")
    try:
        return float(text)
    except ValueError:
        return None


def to_date(value):
    text = str(value or "").strip().translate(ARABIC_DIGITS)
    match = re.match(r"^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?", text)
    try:
        if match:
            return date(int(match.group(1)), int(match.group(2)), int(match.group(3) or 1)), bool(match.group(3))
        match = re.match(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})", text)
        if match:
            day, month = int(match.group(1)), int(match.group(2))
            if month > 12 and day <= 12:
                day, month = month, day
            return date(int(match.group(3)), month, day), True
    except ValueError:
        pass
    return None, False


def clean(text):
    return " ".join(str(text or "").split()).replace("|", "/")


def number_text(value):
    return f"{value:.2f}".rstrip("0").rstrip(".")


def main(body: str) -> dict:
    today = date.today()
    text = (body or "").lstrip("\ufeff")
    first_line = text.split("\n", 1)[0]
    delimiter = ";" if first_line.count(";") > first_line.count(",") else ","
    rows = []

    for raw in csv.DictReader(io.StringIO(text), delimiter=delimiter):
        row = {str(k).strip().lower(): str(v or "").strip() for k, v in raw.items() if k}
        price = to_number(row.get("price_sar"))
        name_en, name_ar = clean(row.get("name_en")), clean(row.get("name_ar"))
        if not price or price <= 0 or not (name_en or name_ar):
            continue  # skips empty and half-filled rows

        size = to_number(row.get("size"))
        unit = UNITS.get(row.get("unit", "").strip().lower())
        protein = to_number(row.get("protein_per_100"))
        per_sar = per_kilo = None
        if size and unit and unit[0] != "pcs":
            per_kilo = price / (size * unit[1]) * 1000
            if protein is not None:
                per_sar = size * unit[1] * protein / 100 / price

        checked, has_day = to_date(row.get("checked"))
        if checked:
            age = (today - checked).days
            checked_text = checked.isoformat() if has_day else checked.strftime("%Y-%m")
            note = f"OLD PRICE ({age} days)" if age > STALE_DAYS else ""
        else:
            checked_text, note = "unknown", "NO DATE"
        if row.get("availability", "").lower() == "out_of_stock":
            note = (note + "; " if note else "") + "OUT OF STOCK at last check"

        rows.append({
            "name": name_en or name_ar,
            "arabic": name_ar,
            "store": clean(row.get("store")) or "store not recorded",
            "brand": clean(row.get("brand")),
            "pack": f"{number_text(size)} {unit[2]}" if size and unit else "",
            "price": price,
            "per_sar": per_sar,
            "per_kilo": (f"{per_kilo:.2f}/{'L' if unit and unit[0] == 'ml' else 'kg'}" if per_kilo else "-"),
            "checked": checked_text,
            "note": note,
        })

    rows.sort(key=lambda r: (r["per_sar"] is None, -(r["per_sar"] or 0), r["name"].lower(), r["price"]))

    lines = [
        f"Today is {today.isoformat()}. {len(rows)} prices from the Yara price sheet.",
        "g/SAR = grams of protein for every 1 SAR (higher means more protein for the money).",
        "SAR per kg/L = price per kilo or litre, for comparing packs of different sizes.",
        "",
        "| Product | Arabic name | Store | Brand | Pack | Price (SAR) | SAR per kg/L | g/SAR | Checked | Note |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        per_sar = f"{r['per_sar']:.1f}" if r["per_sar"] is not None else "-"
        lines.append(
            f"| {r['name']} | {r['arabic']} | {r['store']} | {r['brand']} | {r['pack']} | "
            f"{r['price']:.2f} | {r['per_kilo']} | {per_sar} | {r['checked']} | {r['note']} |"
        )
    if not rows:
        lines.append("| (the price sheet is empty or couldn't be read) | | | | | | | | | |")

    return {"price_table": "\n".join(lines), "today": today.isoformat()}
