#!/usr/bin/env python3
"""
Builds Yara's two knowledge guides from the website's own data, so the chatbot,
the PDFs and the website always agree.

    python tools/build_knowledge.py              # Markdown for Dify, in knowledge/: yara-recipe-index.md,
                                                 #   yara-recipes.md, yara-ingredients.md, yara-prices-by-store.md
    python tools/build_knowledge.py --pdf OUT    # also designed PDFs in OUT (needs: pip install playwright,
                                                 #   python -m playwright install chromium)

Reads data/prices.csv, data/recipes.js, data/week.js and knowledge/ingredient-notes.json.
Upload the Markdown files to Dify: Arabic text inside PDFs often comes out scrambled
for chatbots, while Markdown keeps both languages clean.
"""

import argparse
import html
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "robot"))
import refresh_prices as prices  # noqa: E402  (shares the price-sheet parsing rules)

CATEGORIES = [
    ("legumes", "Beans and lentils", "البقوليات"),
    ("grains", "Grains and pasta", "الحبوب والمعكرونة"),
    ("nuts_seeds", "Nuts, seeds and tahini", "المكسرات والبذور والطحينة"),
    ("dairy_free", "Plant milks", "الحليب النباتي"),
    ("bread", "Bread", "الخبز"),
    ("produce", "Fruit, vegetables and herbs", "الخضار والفواكه والأعشاب"),
    ("other", "Pantry", "مؤونة المطبخ"),
]
MEALS = {"breakfast": ("Breakfast", "فطور"), "lunch": ("Lunch", "غداء"), "dinner": ("Dinner", "عشاء"), "snack": ("Snack", "وجبة خفيفة")}
STORES = {"lulu": "LuLu", "carrefour": "Carrefour", "panda": "Panda", "tamimi": "Tamimi"}

NOT_FOUND = [
    ("Tofu", "توفو", "Look in Tamimi, Danube, and the Asian food aisles of LuLu and Carrefour."),
    ("Soya chunks", "قطع فول الصويا", "Usually in Indian grocery sections (sold as soya chunks or soya wadi). Very high protein per riyal."),
    ("Soy milk", "حليب الصويا", "The highest-protein plant milk. Check the plant-milk shelves and pick a calcium- and B12-fortified one."),
    ("Edamame", "إدامامي", "Usually frozen, in larger supermarkets."),
]
LABEL_CHECK = [
    ("Bread and tortillas", "milk or milk powder"),
    ("Pasta", "egg, especially fresh pasta"),
    ("Peanut butter and spreads", "honey or whey"),
    ("Stock cubes and spice mixes", "chicken fat or chicken flavor, common in kabsa seasonings"),
    ("Sweets and jellies", "gelatin"),
    ("Words that mean an animal ingredient", "whey, casein, lactose, milk solids, ghee or samn, gelatin, albumin (egg), carmine or E120, shellac or E904"),
]
NUTRIENTS = [
    "Vitamin B12 isn't reliably found in plant foods. Get it from fortified plant milk or cereal, or a supplement.",
    "Vitamin D deficiency is common in Saudi Arabia, plant-based or not. A doctor can test for it.",
    "Iron from beans and lentils is absorbed better with vitamin C, so the lemon and tomato in Saudi cooking help.",
    "Calcium: tahini, almonds, and calcium-fortified plant milk. Omega-3: chia seeds and walnuts.",
    "This is general information, not medical advice.",
]


# --------------------------------------------------------------------------- data

def load_js(path, name):
    text = open(path, encoding="utf-8").read()
    match = re.search(r"window\." + name + r"\s*=\s*(\[.*\])\s*;?\s*$", text, re.S)
    if not match:
        raise SystemExit(f"Couldn't read {path}")
    return json.loads(match.group(1))


def load_products():
    rows, _ = prices.read_rows(prices.read_text(os.path.join(ROOT, "data", "prices.csv")))
    groups = {}
    for row in rows:
        price = prices.to_number(row.get("price_sar"))
        if not price:
            continue
        unit = prices.UNITS.get(row.get("unit", "").strip().lower())
        size = prices.to_number(row.get("size"))
        row["_price"] = price
        row["_base"] = unit[0] if unit else ""
        row["_amount"] = size * unit[1] if (size and unit) else None
        row["_checked"] = prices.parse_date(row.get("checked"))
        row["_protein"] = prices.to_number(row.get("protein_per_100"))
        groups.setdefault(row["id"], []).append(row)
    products = {}
    for pid, group in groups.items():
        pool = [r for r in group if r.get("availability") != "out_of_stock"] or group
        comparable = all(r["_amount"] and r["_base"] != "pcs" and r["_base"] == pool[0]["_base"] for r in pool)
        cost = (lambda r: r["_price"] / r["_amount"]) if comparable else (lambda r: r["_price"])
        cheapest = min(pool, key=cost)
        protein = next((r["_protein"] for r in group if r["_protein"] is not None), None)
        products[pid] = {"id": pid, "rows": group, "cheapest": cheapest, "protein": protein,
                         "name_en": group[0]["name_en"], "name_ar": group[0]["name_ar"], "category": group[0]["category"]}
    return products


def per_kilo(row):
    if not row["_amount"] or row["_base"] == "pcs":
        return None
    return row["_price"] / row["_amount"] * 1000


def protein_per_sar(product):
    best = None
    for row in product["rows"]:
        if product["protein"] is None or not row["_amount"] or row["_base"] == "pcs":
            continue
        value = row["_amount"] * product["protein"] / 100 / row["_price"]
        if best is None or value > best[0]:
            best = (value, row)
    return best


def recipe_cost(recipe, products):
    total, counted = 0.0, 0
    for use in recipe.get("uses", []):
        product = products.get(use["id"])
        if not product:
            continue
        row = product["cheapest"]
        if row["_base"] == "pcs" or not row["_amount"]:
            if use.get("count") is not None:
                total += use["count"] * row["_price"] / (prices.to_number(row.get("size")) or 1)
                counted += 1
            continue
        total += use["grams"] / row["_amount"] * row["_price"]
        counted += 1
    return total / recipe["servings"] if counted else None


def store_name(raw):
    return STORES.get(str(raw).strip().lower(), str(raw).strip() or "store not recorded")


def pack(row):
    size = prices.to_number(row.get("size"))
    unit = {"pcs": "bunch" if size == 1 else "pieces"}.get(row.get("unit"), row.get("unit"))
    return f"{size:g} {unit}" if size else "pack size not recorded"


def checked_range(products):
    dates = sorted(r["_checked"] for p in products.values() for r in p["rows"] if r["_checked"])
    if not dates:
        return "unknown dates"
    return dates[0].isoformat() if dates[0] == dates[-1] else f"{dates[0].isoformat()} to {dates[-1].isoformat()}"


def used_in(products, recipes):
    uses = {pid: [] for pid in products}
    for recipe in recipes:
        for use in recipe.get("uses", []):
            uses.setdefault(use["id"], []).append(recipe)
    return uses


# --------------------------------------------------------------------------- Markdown
#
# Written for retrieval: every "###" section is one self-contained chunk that names what
# it is about, so it still makes sense on its own. In Dify, set the chunk delimiter to ###
# (see knowledge/dify-prices.md).

STORE_AR = {"LuLu": "لولو", "Carrefour": "كارفور", "Panda": "بنده", "Tamimi": "التميمي"}
CATEGORY_NAMES = {key: (en, ar) for key, en, ar in CATEGORIES}


def minutes_ar(n):
    if n == 1:
        return "دقيقة واحدة"
    if n == 2:
        return "دقيقتان"
    return f"{n} دقائق" if 3 <= n <= 10 else f"{n} دقيقة"


def price_line(product, row, with_ar=True):
    kilo = per_kilo(row)
    unit = "litre" if row["_base"] == "ml" else "kg"
    store = store_name(row["store"])
    name = f"{product['name_en']} ({product['name_ar']})" if with_ar else product["name_en"]
    text = f"{name} at {store}: {pack(row)} for SAR {row['_price']:.2f}"
    if kilo:
        text += f" (SAR {kilo:.2f} per {unit})"
    text += f", checked {row.get('checked') or 'on an unknown date'}"
    extras = []
    if row.get("brand"):
        extras.append(f"brand: {row['brand']}")
    if row.get("availability") == "out_of_stock":
        extras.append("out of stock at the last check")
    return text + (f" ({', '.join(extras)})" if extras else "") + "."


def ingredients_md(products, recipes, notes):
    when = checked_range(products)
    uses = used_in(products, recipes)
    out = [
        "# Yara ingredients guide | دليل مكونات يارا", "",
        "### About Yara's ingredients guide | عن دليل مكونات يارا",
        "This guide describes the plant-based ingredients Yara tracks in Saudi supermarkets (LuLu, Carrefour and Panda): "
        "Arabic and English names, protein, how to cook them, what to check on the label, which Yara recipes use them, and their prices.",
        f"Prices in this guide are a snapshot checked {when}. If the live price list says something different, the live list is right. "
        "Always say when a price was checked.",
        "Protein values are typical values in grams per 100 g (per 100 ml for milks); labels vary a little by brand.", "",
        "### Ingredients with the most protein per riyal (snapshot) | المكونات الأكثر بروتينًا مقابل الريال",
        f"Grams of protein for every 1 SAR, using each ingredient's best-value pack, prices checked {when}.", "",
        "| # | Ingredient | المكون | g protein per SAR | Best value at | Pack and price |",
        "|---|---|---|---|---|---|",
    ]
    ranked = sorted(((protein_per_sar(p), p) for p in products.values() if protein_per_sar(p)), key=lambda x: -x[0][0])
    for i, ((value, row), p) in enumerate(ranked[:15], 1):
        out.append(f"| {i} | {p['name_en']} | {p['name_ar']} | {value:.1f} | {store_name(row['store'])} | {pack(row)} for SAR {row['_price']:.2f} |")
    for key, _, _ in CATEGORIES:
        for p in sorted((p for p in products.values() if p["category"] == key), key=lambda p: p["name_en"]):
            note = notes.get(p["id"], {})
            cat_en, cat_ar = CATEGORY_NAMES.get(p["category"], ("Pantry", "مؤونة المطبخ"))
            best = p["cheapest"]
            out += ["", f"### {p['name_en']} | {p['name_ar']}",
                    f"Ingredient: {p['name_en']} ({p['name_ar']}). Category: {cat_en} | {cat_ar}."]
            if note.get("aka"):
                out.append(f"Also called: {note['aka']}.")
            out.append(f"Protein: {p['protein']:g} g per 100 g (typical value)." if p["protein"] is not None
                       else "Protein: not a main protein source.")
            if note.get("note"):
                out.append(f"How to use {p['name_en'].lower()}: {note['note']}")
            out.append(f"Prices for {p['name_en'].lower()}:")
            out += [f"- {price_line(p, row, with_ar=False)}" for row in sorted(p["rows"], key=lambda r: store_name(r["store"]))]
            out.append(f"Best price per kg for {p['name_en'].lower()}: {store_name(best['store'])}, {pack(best)} for SAR {best['_price']:.2f}.")
            if uses.get(p["id"]):
                out.append(f"Yara recipes that use {p['name_en'].lower()}: "
                           + ", ".join(f"{r['name']['en']} ({r['name']['ar']})" for r in uses[p["id"]]) + ".")
    out += ["", "### Ingredients Yara has not found in these stores yet | مكونات لم تجدها يارا بعد",
            "Yara has no prices for these, because they were not in the LuLu, Carrefour or Panda pages checked. "
            "Do not say they are available or give a price for them:"]
    out += [f"- {en} ({ar}): {tip}" for en, ar, tip in NOT_FOUND]
    out += ["", "### Check the label for animal ingredients | اقرأ المكونات",
            "Most foods in this guide are plant-based by nature. These vary by brand, so check the ingredients:"]
    out += [f"- {what}: {why}." for what, why in LABEL_CHECK]
    out += ["", "### Nutrients to plan for on a vegan diet | عناصر غذائية تحتاج تخطيطًا"] + [f"- {line}" for line in NUTRIENTS]
    return "\n".join(out) + "\n"


def prices_by_store_md(products):
    when = checked_range(products)
    out = [
        "# Yara prices by store | الأسعار حسب المتجر", "",
        "### About Yara's prices by store | عن أسعار يارا حسب المتجر",
        f"Plant-based grocery prices from the LuLu, Carrefour and Panda websites, checked {when}. Each line gives the product, "
        "the store, the pack size, the price in SAR and the date it was checked. If the live price list says something different, "
        "the live list is right.",
    ]
    stores = sorted({store_name(r["store"]) for p in products.values() for r in p["rows"]})
    for store in stores:
        ar_store = STORE_AR.get(store, store)
        for key, cat_en, cat_ar in CATEGORIES:
            lines = []
            for p in sorted((p for p in products.values() if p["category"] == key), key=lambda p: p["name_en"]):
                lines += [f"- {price_line(p, row)}" for row in p["rows"] if store_name(row["store"]) == store]
            if lines:
                out += ["", f"### {store} prices: {cat_en.lower()} | أسعار {ar_store}: {cat_ar}",
                        f"{cat_en} at {store} ({ar_store}), prices checked {when}:"] + lines
    return "\n".join(out) + "\n"


def meals_text(recipe, lang):
    names = [MEALS[m][0 if lang == "en" else 1] for m in recipe.get("meal", [])]
    return (" or " if lang == "en" else " أو ").join(names)


def protein_line(recipe):
    if recipe.get("proteinSource") == "usda":
        text = f"{recipe['protein']:g} g per serving (from the original recipe's USDA nutrition panel)"
        if recipe.get("calories"):
            text += f", {recipe['calories']} kcal"
        if recipe.get("nutritionNote") == "filling":
            text += "; figures are for the filling, without the bread"
        return text
    return f"about {recipe['protein']:g} g per serving (estimated from the ingredients)"


def protein_line_ar(recipe):
    if recipe.get("proteinSource") == "usda":
        return f"{recipe['protein']:g} جم للحصة (من لوحة التغذية الأصلية للوصفة لدى وزارة الزراعة الأمريكية)"
    return f"نحو {recipe['protein']:g} جم للحصة (تقدير من المكونات)"


def week_days(recipes, week, products):
    by_id = {r["id"]: r for r in recipes}
    days = []
    for day in week:
        meals = [(m, by_id[m["recipe"]]) for m in day["meals"] if m["recipe"] in by_id]
        protein = sum(r["protein"] for _, r in meals)
        costs = [recipe_cost(r, products) for _, r in meals]
        days.append((day["day"], meals, protein, sum(costs) if all(c is not None for c in costs) else None))
    return days


def recipe_index_md(recipes, products):
    when = checked_range(products)

    def line(r):
        cost = recipe_cost(r, products)
        return (f"{r['name']['en']} | {r['name']['ar']} ({meals_text(r, 'en').lower()}, {r['time']} min, "
                f"about {r['protein']:.0f} g protein" + (f", about SAR {cost:.2f} per serving" if cost is not None else "") + ")")

    out = ["# Yara recipe index | فهرس وصفات يارا", "",
           "### All Yara vegan recipes | كل وصفات يارا النباتية",
           "This is the list of vegan recipes on the Yara website. Use it for general requests such as: give me vegan recipes, "
           "recipe ideas, what can I cook, suggest a meal, plant-based dishes, وصفات نباتية، اقترح علي وصفة، وش أطبخ، أكلات نباتية. "
           "Copy recipe names exactly as written here.", ""]
    out += [f"{i}. {line(r)}" for i, r in enumerate(recipes, 1)]
    groups = [
        ("Yara vegan breakfast recipes | وصفات فطور نباتية من يارا", "Vegan breakfast ideas from Yara's recipes:",
         [r for r in recipes if "breakfast" in r.get("meal", [])]),
        ("Yara vegan lunch and dinner recipes | وصفات غداء وعشاء نباتية من يارا", "Vegan lunch and dinner ideas from Yara's recipes:",
         [r for r in recipes if {"lunch", "dinner"} & set(r.get("meal", []))]),
        ("Yara vegan snack recipes | وجبات خفيفة نباتية من يارا", "Vegan snack ideas from Yara's recipes:",
         [r for r in recipes if "snack" in r.get("meal", [])]),
        ("Yara high-protein vegan recipes | وصفات يارا النباتية الغنية بالبروتين",
         "Yara recipes with 15 g of protein or more per serving:", sorted([r for r in recipes if r["protein"] >= 15], key=lambda r: -r["protein"])),
        ("Yara cheapest vegan recipes | أرخص وصفات يارا النباتية",
         f"Yara recipes under SAR 2 per serving, at prices checked {when}:",
         sorted([r for r in recipes if (recipe_cost(r, products) or 99) < 2], key=lambda r: recipe_cost(r, products))),
    ]
    for title, intro, items in groups:
        out += ["", f"### {title}", intro] + [f"- {line(r)}" for r in items]
    return "\n".join(out) + "\n"


def recipes_md(recipes, week, products):
    when = checked_range(products)
    out = [
        "# Yara recipes | وصفات يارا", "",
        "### About Yara's recipes | عن وصفات يارا",
        "Every recipe on the Yara website, in English and Arabic. All of them are vegan. Each recipe appears twice: once in English "
        "and once in Arabic.",
        f"Cost per serving uses the best price per kg across LuLu, Carrefour and Panda, checked {when}, for the main ingredients only "
        "(not salt, water or small extras).",
        "Recipes adapted from the USDA use the original recipe's published nutrition panel; Yara's own recipes use an estimate from the "
        "ingredients. Five recipes are adapted from the U.S. Department of Agriculture's MyPlate Kitchen (public domain), via MyPlate.food; "
        "mention the original source when you share one of them.", "",
        "### Yara recipes at a glance | وصفات يارا في لمحة",
        "| Recipe | الوصفة | Meal | Minutes | Serves | Protein per serving (g) | Cost per serving (SAR) |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in sorted(recipes, key=lambda r: -r["protein"]):
        cost = recipe_cost(r, products)
        out.append(f"| {r['name']['en']} | {r['name']['ar']} | {meals_text(r, 'en')} | {r['time']} | {r['servings']} | "
                   f"{r['protein']:g} | {f'{cost:.2f}' if cost is not None else '-'} |")
    days = week_days(recipes, week, products)
    avg_p = sum(d[2] for d in days) / len(days)
    costs = [d[3] for d in days if d[3] is not None]
    out += ["", "### Yara 7-day vegan meal plan | خطة يارا النباتية لسبعة أيام",
            f"Every meal is one of Yara's recipes. On average the week gives {avg_p:.0f} g of protein a day "
            f"({min(d[2] for d in days):.0f} to {max(d[2] for d in days):.0f} g)"
            + (f" and costs about SAR {sum(costs) / len(costs):.2f} a day, SAR {sum(costs):.2f} for the week (prices checked {when})."
               if len(costs) == len(days) else "."),
            "Lunches marked leftovers reuse a dish cooked earlier in the week."]
    for day, meals, protein, cost in days:
        out.append(f"- Day {day} ({protein:.0f} g protein" + (f", about SAR {cost:.2f}" if cost is not None else "") + "): "
                   + "; ".join(f"{MEALS[m['slot']][0]}: {r['name']['en']}" + (" (leftovers)" if m.get("leftover") else "") for m, r in meals))
    for r in recipes:
        cost = recipe_cost(r, products)
        en, ar = r["name"]["en"], r["name"]["ar"]
        time_en = f"{r['time']} minutes" + (f" {r['timeNote']['en']}" if r.get("timeNote") else "")
        time_ar = minutes_ar(r["time"]) + (f" {r['timeNote']['ar']}" if r.get("timeNote") else "")
        out += ["", f"### Recipe: {en} | {ar}",
                f"Yara vegan recipe: {en} (Arabic name: {ar}). Meal: {meals_text(r, 'en')}. Time: {time_en}. Serves {r['servings']}.",
                f"Protein: {protein_line(r)}.",
                f"Cost: about SAR {cost:.2f} per serving at prices checked {when}." if cost is not None else "Cost: not available.",
                f"About: {r['description']['en']}", "", f"Ingredients for {en.lower()}:"]
        out += [f"- {item}" for item in r["ingredients"]["en"]]
        out += ["", f"Method for {en.lower()}:"] + [f"{i}. {step}" for i, step in enumerate(r["steps"]["en"], 1)]
        if r.get("swaps"):
            out += ["", f"What Yara changed: {r['swaps']['en']}"]
        out += ["", f"Source: {r['source']['credit']['en']} Original recipe: \"{r['source']['title']}\", {r['source']['url']}"
                if r.get("source") else "Source: a Yara original recipe."]
        out += ["", f"### وصفة: {ar} | Recipe in Arabic: {en}",
                f"وصفة نباتية من يارا: {ar} ({en}). الوجبة: {meals_text(r, 'ar')}. مدة التحضير: {time_ar}. عدد الحصص: {r['servings']}.",
                f"البروتين: {protein_line_ar(r)}.",
                f"التكلفة: نحو {cost:.2f} ر.س للحصة بأسعار رُوجعت في {when}." if cost is not None else "التكلفة: غير متوفرة.",
                f"نبذة: {r['description']['ar']}", "", f"مكونات {ar}:"]
        out += [f"- {item}" for item in r["ingredients"]["ar"]]
        out += ["", f"طريقة تحضير {ar}:"] + [f"{i}. {step}" for i, step in enumerate(r["steps"]["ar"], 1)]
        if r.get("swaps"):
            out += ["", f"ما الذي غيّرته يارا: {r['swaps']['ar']}"]
        out += ["", f"المصدر: {r['source']['credit']['ar']} الوصفة الأصلية: \"{r['source']['title']}\"، {r['source']['url']}"
                if r.get("source") else "المصدر: وصفة أصلية من يارا."]
    return "\n".join(out) + "\n"


# --------------------------------------------------------------------------- PDF (HTML printed by Chromium)

LOGO = ('<svg viewBox="0 0 100 100" width="{s}" height="{s}"><rect width="100" height="100" rx="22" fill="#20544a"/>'
        '<rect x="45.7" y="50.5" width="4.8" height="28" rx="2.4" fill="#f3efe3"/>'
        '<path d="M26.1 26.3C26.1 42.4 33.4 53.2 47.9 55.2C47.9 40.1 40.1 29.1 26.1 26.3Z" fill="#f3efe3"/>'
        '<path d="M70.1 28C70.1 42.3 63.4 52.7 48.3 55.2C48.9 41.1 56.4 30.4 70.1 28Z" fill="#8ecab4"/>'
        '<path d="M48.1 26.2C48.6 29.6 49.9 30.9 53.4 31.4C49.9 31.9 48.6 33.2 48.1 36.6C47.6 33.2 46.3 31.9 42.8 31.4C46.3 30.9 47.6 29.6 48.1 26.2Z" fill="#d9b672"/></svg>')

CSS = """
@page { size: A4; margin: 16mm 15mm 18mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #16261f; font-family: 'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif; font-size: 10pt; line-height: 1.5; }
.ar, [dir=rtl] { font-family: 'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif; }
h1, h2, h3 { margin: 0; font-family: 'Gelasio', Georgia, serif; font-weight: 400; color: #143a31; }
.ar h1, .ar h2, .ar h3, h1 .ar, h2 .ar, h3 .ar { font-family: 'Amiri', serif; font-weight: 700; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: space-between; padding: 8mm 2mm; }
.cover h1 { font-size: 40pt; line-height: 1.05; margin-top: 18mm; }
.cover .ar-title { font-family: 'Amiri', serif; font-weight: 700; font-size: 32pt; color: #20544a; margin-top: 4mm; }
.cover p { max-width: 140mm; color: #53645b; font-size: 11pt; }
.cover .meta { border-top: 1px solid #dbe5dd; padding-top: 4mm; font-size: 9pt; color: #53645b; }
.box { background: #f1f8f4; border-radius: 4mm; padding: 4mm 5mm; margin: 4mm 0; }
.box p { margin: 1mm 0; }
section { break-before: page; }
section > h2 { font-size: 22pt; margin-bottom: 1mm; }
section > h2 .ar { font-size: 18pt; color: #20544a; margin-inline-start: 3mm; }
.item { break-inside: avoid; border-top: 1px solid #dbe5dd; padding: 3mm 0 2.5mm; }
.item h3 { font-size: 13pt; display: flex; justify-content: space-between; gap: 4mm; }
.item h3 .ar { font-size: 13pt; color: #20544a; }
.chips { margin: 1mm 0; display: flex; flex-wrap: wrap; gap: 2mm; }
.chip { background: #e2f1ea; color: #143a31; border-radius: 10mm; padding: 0.4mm 2.5mm; font-size: 8.5pt; font-weight: 600; }
.chip.sand { background: #f5efe3; color: #16261f; }
.aka { color: #53645b; font-size: 9pt; }
table { width: 100%; border-collapse: collapse; font-size: 8.8pt; margin-top: 1.5mm; }
th, td { text-align: start; padding: 1.2mm 2mm; border-bottom: 1px solid #e6ece7; vertical-align: top; }
th { color: #53645b; font-weight: 600; font-size: 8pt; }
td.num, th.num { text-align: end; font-variant-numeric: tabular-nums; }
tr.best td { background: #f1f8f4; font-weight: 600; }
.small { color: #53645b; font-size: 8.5pt; }
.recipe { break-before: page; }
.recipe-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 6mm; border-bottom: 2px solid #20544a; padding-bottom: 3mm; }
.recipe-head h2 { font-size: 22pt; }
.recipe-head .ar { font-family: 'Amiri', serif; font-weight: 700; font-size: 20pt; color: #20544a; }
.numbers { display: flex; gap: 8mm; margin: 4mm 0 2mm; }
.numbers div { display: grid; }
.numbers strong { font-family: 'Gelasio', serif; font-weight: 400; font-size: 18pt; color: #143a31; line-height: 1.1; }
.numbers span { font-size: 8pt; color: #53645b; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 3mm; }
.cols h4 { margin: 2mm 0 1mm; font-size: 10pt; color: #20544a; }
.cols ul, .cols ol { margin: 0; padding-inline-start: 5mm; }
.cols li { margin-bottom: 0.8mm; }
.cols [dir=rtl] { font-size: 10.5pt; line-height: 1.75; }
.source { margin-top: 5mm; padding-top: 3mm; border-top: 1px solid #dbe5dd; font-size: 8.5pt; color: #53645b; }
.day { break-inside: avoid; border: 1px solid #dbe5dd; border-radius: 3mm; padding: 2.5mm 4mm; margin-bottom: 2.5mm; }
.day strong { font-family: 'Gelasio', serif; font-weight: 400; font-size: 12pt; color: #143a31; }
ul.plain { padding-inline-start: 5mm; }
"""


def esc(value):
    return html.escape(str(value))


def page(title, body):
    return f"<!doctype html><html><head><meta charset='utf-8'><title>{esc(title)}</title><style>{CSS}</style></head><body>{body}</body></html>"


def cover(title_en, title_ar, intro, meta):
    return (f"<div class='cover'><div>{LOGO.format(s=64)}<h1>{esc(title_en)}</h1><div class='ar-title' dir='rtl'>{esc(title_ar)}</div>"
            f"<div class='box'>{''.join(f'<p>{line}</p>' for line in intro)}</div></div><div class='meta'>{meta}</div></div>")


def ingredients_html(products, recipes, notes):
    when = checked_range(products)
    uses = used_in(products, recipes)
    body = [cover("Ingredients guide", "دليل المكونات", [
        "The plant-based ingredients Yara knows in Saudi supermarkets: names in both languages, protein, how to cook them, what to check on the label, and which recipes use them.",
        f"<strong>Prices are a snapshot checked {esc(when)}.</strong> Current prices live on the Yara website, where the price robot updates them.",
        "Protein values are typical values per 100 g (or 100 ml for milks). Labels vary a little by brand."],
        f"Yara · Plant-based in Saudi Arabia · LuLu, Carrefour and Panda websites · Generated {date.today().isoformat()}")]
    ranked = sorted(((protein_per_sar(p), p) for p in products.values() if protein_per_sar(p)), key=lambda x: -x[0][0])
    rows = "".join(f"<tr{' class=best' if i == 1 else ''}><td class=num>{i}</td><td>{esc(p['name_en'])}</td><td dir=rtl>{esc(p['name_ar'])}</td>"
                   f"<td class=num>{v:.1f}</td><td>{esc(store_name(r['store']))}</td><td>{esc(pack(r))} for SAR {r['_price']:.2f}</td></tr>"
                   for i, ((v, r), p) in enumerate(ranked[:15], 1))
    body.append(f"<section><h2>Most protein per riyal <span class=ar>أكثر بروتين مقابل الريال</span></h2>"
                f"<p class=small>Grams of protein for every 1 SAR, using each product's best-value pack (snapshot {esc(when)}).</p>"
                f"<table><tr><th class=num>#</th><th>Ingredient</th><th>المكون</th><th class=num>g per SAR</th><th>Best value</th><th>Pack and price</th></tr>{rows}</table></section>")
    for key, title_en, title_ar in CATEGORIES:
        group = sorted((p for p in products.values() if p["category"] == key), key=lambda p: p["name_en"])
        if not group:
            continue
        items = []
        for p in group:
            note = notes.get(p["id"], {})
            chips = (f"<span class=chip>{p['protein']:g} g protein / 100 g</span>" if p["protein"] is not None else "")
            chips += f"<span class='chip sand'>Best price: {esc(store_name(p['cheapest']['store']))}</span>"
            price_rows = ""
            for row in sorted(p["rows"], key=lambda r: store_name(r["store"])):
                kilo = per_kilo(row)
                flags = ["sale" if "sale price" in row.get("note", "") else "", "out of stock" if row.get("availability") == "out_of_stock" else ""]
                price_rows += (f"<tr{' class=best' if row is p['cheapest'] else ''}><td>{esc(store_name(row['store']))}</td><td>{esc(pack(row))}</td>"
                               f"<td class=num>SAR {row['_price']:.2f}</td><td class=num>{f'SAR {kilo:.2f}' if kilo else '-'}</td>"
                               f"<td>{esc(row.get('checked', ''))} {esc(' '.join(f for f in flags if f))}</td></tr>")
            used = ", ".join(esc(r["name"]["en"]) for r in uses.get(p["id"], []))
            items.append(f"<div class=item><h3><span>{esc(p['name_en'])}</span><span class=ar dir=rtl>{esc(p['name_ar'])}</span></h3>"
                         f"<div class=chips>{chips}</div>"
                         + (f"<p class=aka dir=rtl>{esc(note['aka'])}</p>" if note.get("aka") else "")
                         + (f"<p>{esc(note['note'])}</p>" if note.get("note") else "")
                         + f"<table><tr><th>Store</th><th>Pack</th><th class=num>Price</th><th class=num>Per kg / L</th><th>Checked</th></tr>{price_rows}</table>"
                         + (f"<p class=small>Used in: {used}</p>" if used else "") + "</div>")
        body.append(f"<section><h2>{esc(title_en)} <span class=ar>{esc(title_ar)}</span></h2>{''.join(items)}</section>")
    body.append("<section><h2>Good to know <span class=ar>معلومات مهمة</span></h2>"
                "<h3 style='margin-top:4mm'>Not in these stores yet</h3><ul class=plain>"
                + "".join(f"<li><strong>{esc(en)}</strong> ({esc(ar)}): {esc(tip)}</li>" for en, ar, tip in NOT_FOUND) + "</ul>"
                "<h3 style='margin-top:4mm'>Check the label</h3><ul class=plain>"
                + "".join(f"<li><strong>{esc(what)}</strong>: {esc(why)}.</li>" for what, why in LABEL_CHECK) + "</ul>"
                "<h3 style='margin-top:4mm'>Nutrients to plan for</h3><ul class=plain>"
                + "".join(f"<li>{esc(line)}</li>" for line in NUTRIENTS) + "</ul></section>")
    return page("Yara ingredients guide", "".join(body))


def recipes_html(recipes, week, products):
    when = checked_range(products)
    body = [cover("Recipes", "الوصفات", [
        f"Every Yara recipe in English and Arabic, with protein and cost per serving, and a 7-day plan built from them. All {len(recipes)} recipes are vegan.",
        f"<strong>Cost per serving</strong> uses the best price per kg across LuLu, Carrefour and Panda, checked {esc(when)}, for the main ingredients.",
        "Five recipes are adapted from the U.S. Department of Agriculture's MyPlate Kitchen (public domain), via MyPlate.food; each credits its original author."],
        f"Yara · Plant-based in Saudi Arabia · Generated {date.today().isoformat()}")]
    rows = ""
    for r in sorted(recipes, key=lambda r: -r["protein"]):
        cost = recipe_cost(r, products)
        rows += (f"<tr><td>{esc(r['name']['en'])}</td><td dir=rtl>{esc(r['name']['ar'])}</td><td>{esc(meals_text(r, 'en'))}</td>"
                 f"<td class=num>{r['time']}</td><td class=num>{r['servings']}</td><td class=num>{r['protein']:g}</td>"
                 f"<td class=num>{f'{cost:.2f}' if cost is not None else '-'}</td></tr>")
    body.append("<section><h2>At a glance <span class=ar>نظرة سريعة</span></h2>"
                "<table><tr><th>Recipe</th><th>الوصفة</th><th>Meal</th><th class=num>Min</th><th class=num>Serves</th>"
                f"<th class=num>Protein g</th><th class=num>SAR / serving</th></tr>{rows}</table>")
    days = week_days(recipes, week, products)
    avg_p = sum(d[2] for d in days) / len(days)
    costs = [d[3] for d in days if d[3] is not None]
    body.append(f"<h2 style='margin-top:8mm'>A plant-based week <span class=ar>أسبوع نباتي</span></h2>"
                f"<div class=numbers><div><strong>{avg_p:.0f} g</strong><span>protein a day on average</span></div>"
                + (f"<div><strong>SAR {sum(costs) / len(costs):.2f}</strong><span>a day on average</span></div>"
                   f"<div><strong>SAR {sum(costs):.2f}</strong><span>for the week</span></div>" if len(costs) == len(days) else "")
                + "</div>")
    for day, meals, protein, cost in days:
        body.append(f"<div class=day><strong>Day {day}</strong> <span class=small>{protein:.0f} g protein"
                    + (f" · about SAR {cost:.2f}" if cost is not None else "") + "</span><br>"
                    + " · ".join(f"<span class=small>{MEALS[m['slot']][0]}:</span> {esc(r['name']['en'])}" + (" <span class=small>(leftovers)</span>" if m.get("leftover") else "")
                                 for m, r in meals) + "</div>")
    body.append("</section>")
    for r in recipes:
        cost = recipe_cost(r, products)
        numbers = (f"<div><strong>{r['protein']:g} g</strong><span>protein per serving{' (USDA panel)' if r.get('proteinSource') == 'usda' else ' (estimate)'}</span></div>"
                   + (f"<div><strong>{r['calories']}</strong><span>kcal per serving</span></div>" if r.get("calories") else "")
                   + (f"<div><strong>SAR {cost:.2f}</strong><span>per serving ({esc(when)})</span></div>" if cost is not None else "")
                   + f"<div><strong>{r['time']}</strong><span>minutes{(' ' + esc(r['timeNote']['en'])) if r.get('timeNote') else ''}</span></div>"
                   + f"<div><strong>{r['servings']}</strong><span>servings</span></div>")
        en = (f"<div><p>{esc(r['description']['en'])}</p><h4>Ingredients</h4><ul>{''.join(f'<li>{esc(i)}</li>' for i in r['ingredients']['en'])}</ul>"
              f"<h4>Method</h4><ol>{''.join(f'<li>{esc(s)}</li>' for s in r['steps']['en'])}</ol>"
              + (f"<h4>What we changed</h4><p>{esc(r['swaps']['en'])}</p>" if r.get("swaps") else "") + "</div>")
        ar = (f"<div dir=rtl lang=ar><p>{esc(r['description']['ar'])}</p><h4>المكونات</h4><ul>{''.join(f'<li>{esc(i)}</li>' for i in r['ingredients']['ar'])}</ul>"
              f"<h4>طريقة التحضير</h4><ol>{''.join(f'<li>{esc(s)}</li>' for s in r['steps']['ar'])}</ol>"
              + (f"<h4>ما الذي غيّرناه</h4><p>{esc(r['swaps']['ar'])}</p>" if r.get("swaps") else "") + "</div>")
        source = (f"<div class=source>{esc(r['source']['credit']['en'])} Original: “{esc(r['source']['title'])}”, {esc(r['source']['url'])}</div>"
                  if r.get("source") else "<div class=source>A Yara original recipe.</div>")
        body.append(f"<div class=recipe><div class=recipe-head><div><p class=small>{esc(meals_text(r, 'en'))}</p><h2>{esc(r['name']['en'])}</h2></div>"
                    f"<div class=ar dir=rtl>{esc(r['name']['ar'])}</div></div><div class=numbers>{numbers}</div>"
                    f"<div class=cols>{en}{ar}</div>{source}</div>")
    return page("Yara recipes", "".join(body))


def write_pdf(html_text, path, title):
    from playwright.sync_api import sync_playwright
    footer = ("<div style=\"width:100%;padding:0 15mm;font-family:'IBM Plex Sans',sans-serif;font-size:7.5px;color:#53645b;"
              f"display:flex;justify-content:space-between;\"><span>Yara · {esc(title)}</span>"
              "<span><span class=pageNumber></span> / <span class=totalPages></span></span></div>")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        pg = browser.new_page()
        pg.set_content(html_text, wait_until="load")
        pg.evaluate("document.fonts.ready")
        pg.pdf(path=path, format="A4", print_background=True, display_header_footer=True,
               header_template="<span></span>", footer_template=footer, prefer_css_page_size=True)
        browser.close()


def main():
    parser = argparse.ArgumentParser(description="Build Yara's knowledge files from the site's data.")
    parser.add_argument("--pdf", metavar="FOLDER", help="also write designed PDFs into this folder")
    args = parser.parse_args()
    products = load_products()
    recipes = load_js(os.path.join(ROOT, "data", "recipes.js"), "YARA_RECIPES")
    week = load_js(os.path.join(ROOT, "data", "week.js"), "YARA_WEEK")
    notes = json.load(open(os.path.join(ROOT, "knowledge", "ingredient-notes.json"), encoding="utf-8"))
    out_dir = os.path.join(ROOT, "knowledge")
    for name, text in (("yara-recipe-index.md", recipe_index_md(recipes, products)),
                       ("yara-recipes.md", recipes_md(recipes, week, products)),
                       ("yara-ingredients.md", ingredients_md(products, recipes, notes)),
                       ("yara-prices-by-store.md", prices_by_store_md(products))):
        with open(os.path.join(out_dir, name), "w", encoding="utf-8") as handle:
            handle.write(text)
        print(f"wrote knowledge/{name}")
    if args.pdf:
        os.makedirs(args.pdf, exist_ok=True)
        write_pdf(ingredients_html(products, recipes, notes), os.path.join(args.pdf, "yara-ingredients.pdf"), "Ingredients guide")
        write_pdf(recipes_html(recipes, week, products), os.path.join(args.pdf, "yara-recipes.pdf"), "Recipes")
        print(f"wrote yara-ingredients.pdf and yara-recipes.pdf in {args.pdf}")


if __name__ == "__main__":
    main()
