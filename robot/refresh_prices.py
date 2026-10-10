#!/usr/bin/env python3
"""
Yara price robot.

Reads the price sheet (your published Google Sheet, as CSV), opens the product page
link in each row's `url` column, reads the price the store publishes for that
product, and writes data/prices.csv for the website and the chatbot, plus a short
report of what happened.

It would rather keep an older, dated price than show a wrong one:
  * Prices come only from the store's structured product data (the machine-readable
    information stores add for Google). It never guesses numbers from page text.
  * If the page shows several different prices, it doesn't pick one.
  * A price that jumps too far from the last one, or a pack size that doesn't match
    the sheet, is held back and reported for a person to check.
  * When a page fails, the last good price is kept with its original date, so the
    website shows it as older instead of pretending it's new.
  * It respects each store's robots.txt, uses an honest name, waits between visits,
    and stops visiting a store that refuses it.

Usage (Python 3.9+; no extra packages needed):
  python robot/refresh_prices.py --sheet "SHEET_CSV_LINK"

Options:
  --previous  last price file, as a path or link (default: data/prices.csv)
  --out       where to write the new price file (default: data/prices.csv)
  --report    where to write the report (default: data/price-report.md)
  --browser   also render pages that are built with JavaScript (needs: pip install playwright)
  --delay     seconds to wait between visits to the same store (default: 4)
  --only      only check rows whose store, id or link contains this text (for testing)
  --dry-run   print the report without writing any files
"""

from __future__ import annotations

import argparse
import csv
import gzip
import io
import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
import zlib
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from html.parser import HTMLParser

RIYADH = timezone(timedelta(hours=3))  # Saudi Arabia doesn't use daylight saving time

OUTPUT_COLUMNS = [
    "id", "name_en", "name_ar", "category", "store", "brand", "size", "unit",
    "price_sar", "protein_per_100", "checked", "source", "url", "availability", "updated_by",
]

MIN_PRICE, MAX_PRICE = 0.25, 2000.0   # anything outside this range is treated as a reading error
MAX_RISE, MAX_DROP = 2.5, 0.4        # new price must stay between 0.4x and 2.5x the last one
SIZE_TOLERANCE = 0.15                # pack sizes may differ by up to 15% (e.g. 400 g vs 380 g)
MAX_STORE_GAP = 3.0                  # price per kg may be at most 3x above or below other stores' price
TIMEOUT = 25
MAX_BYTES = 6_000_000
BLOCKS_BEFORE_STOPPING = 2           # refusals from one store before the robot leaves it alone

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹٫٬", "01234567890123456789.,")

# unit written in the sheet or on a product -> (base unit, multiplier, unit to show)
UNITS = {
    "g": ("g", 1, "g"), "gm": ("g", 1, "g"), "gms": ("g", 1, "g"), "gr": ("g", 1, "g"), "gram": ("g", 1, "g"),
    "grams": ("g", 1, "g"), "جم": ("g", 1, "g"), "غ": ("g", 1, "g"), "جرام": ("g", 1, "g"), "غرام": ("g", 1, "g"),
    "kg": ("g", 1000, "kg"), "kgs": ("g", 1000, "kg"), "kilo": ("g", 1000, "kg"), "كجم": ("g", 1000, "kg"),
    "كغ": ("g", 1000, "kg"), "كيلو": ("g", 1000, "kg"),
    "ml": ("ml", 1, "ml"), "مل": ("ml", 1, "ml"),
    "l": ("ml", 1000, "L"), "lt": ("ml", 1000, "L"), "ltr": ("ml", 1000, "L"), "litre": ("ml", 1000, "L"),
    "liter": ("ml", 1000, "L"), "litres": ("ml", 1000, "L"), "liters": ("ml", 1000, "L"), "لتر": ("ml", 1000, "L"),
    "pcs": ("pcs", 1, "pcs"), "pc": ("pcs", 1, "pcs"), "piece": ("pcs", 1, "pcs"), "pieces": ("pcs", 1, "pcs"),
    "حبة": ("pcs", 1, "pcs"),
}


# --------------------------------------------------------------------------- small helpers

def to_number(value):
    """6.75, "6,75", "SAR 6.75", "٦٫٧٥" -> 6.75. Returns None when there's no number."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if value == value else None
    text = re.sub(r"[^\d.,-]", "", str(value).translate(ARABIC_DIGITS))
    if not re.search(r"\d", text):
        return None
    if "," in text and "." in text:
        text = text.replace(",", "")
    elif "," in text:
        head, _, tail = text.rpartition(",")
        text = text.replace(",", "") if len(tail) == 3 else head.replace(",", "") + "." + tail
    try:
        return float(text)
    except ValueError:
        return None


def parse_date(value):
    """2026-09-20, 2026-09, 2026/9/20 or 20/09/2026 -> date (month-only dates become the 1st)."""
    text = str(value or "").strip().translate(ARABIC_DIGITS)
    try:
        match = re.match(r"^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?", text)
        if match:
            return date(int(match.group(1)), int(match.group(2)), int(match.group(3) or 1))
        match = re.match(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})", text)
        if match:
            day, month = int(match.group(1)), int(match.group(2))
            if month > 12 >= day:
                day, month = month, day
            return date(int(match.group(3)), month, day)
    except ValueError:
        return None
    return None


def row_key(row):
    ident = (row.get("id") or row.get("name_en") or row.get("name_ar") or "").strip().lower()
    return f"{ident}|{(row.get('store') or '').strip().lower()}"


def money(value):
    return f"{value:.2f}"


def words(text):
    text = str(text or "").lower().translate(ARABIC_DIGITS)
    return set(re.findall(r"[a-z0-9\u0600-\u06ff]+", text))


def similarity(a, b):
    """How much two product names share, from 0 to 1."""
    wa, wb = words(a), words(b)
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / min(len(wa), len(wb))


def as_list(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def type_names(node):
    return {str(t).rsplit("/", 1)[-1].lower() for t in as_list(node.get("@type"))} if isinstance(node, dict) else set()


def availability_of(value):
    text = str(value or "").rsplit("/", 1)[-1].lower()
    if not text:
        return ""
    if any(word in text for word in ("outofstock", "soldout", "discontinued", "out_of_stock")):
        return "out_of_stock"
    if any(word in text for word in ("instock", "limitedavailability", "instoreonly", "onlineonly", "in_stock")):
        return "in_stock"
    return ""


def currency_of(value):
    text = str(value or "").strip().upper()
    if text in ("", "SAR", "SR", "ر.س", "ريال"):
        return "SAR" if text else ""
    return text


# --------------------------------------------------------------------------- pack sizes

SIZE_RE = re.compile(
    r"(?<![\d.,])(\d+(?:[.,]\d+)?)\s*"
    r"(kgs?|kilo|g|gms?|gr|grams?|ml|lt|ltr|litres?|liters?|l|كجم|كغ|كيلو|جم|غ|جرام|غرام|مل|لتر)"
    r"(?![a-z\u0600-\u06ff])",
    re.IGNORECASE,
)
MULTIPACK_RE = re.compile(
    r"\d\s*(?:[a-z]+\s*)?[x×*]\s*\d|pack\s+of\s+\d|\d+\s*(?:pcs|pieces|pack|حبات|عبوات)\b",
    re.IGNORECASE,
)


def size_in_name(name):
    """The one pack size written in a product name, or None if there's none or it's unclear."""
    text = str(name or "").translate(ARABIC_DIGITS)
    if MULTIPACK_RE.search(text):
        return None
    found = set()
    for amount, unit in SIZE_RE.findall(text):
        info = UNITS.get(unit.lower())
        number = to_number(amount)
        if info and number:
            found.add((info[0], round(number * info[1], 3), amount.replace(",", "."), info[2]))
    distinct = {(base, qty) for base, qty, _, _ in found}
    if len(distinct) != 1:
        return None
    return sorted(found)[0]


def size_of_row(row):
    number = to_number(row.get("size"))
    info = UNITS.get(str(row.get("unit") or "").strip().lower())
    if not number or not info:
        return None
    return info[0], round(number * info[1], 3)


def describe_size(base, amount):
    if base == "g" and amount >= 1000:
        return f"{amount / 1000:g} kg"
    if base == "ml" and amount >= 1000:
        return f"{amount / 1000:g} L"
    return f"{amount:g} {base}"


def per_kilo(price, size):
    """(base unit, SAR per kg or per litre) for a price and a pack size, or None."""
    if not price or not size or not size[1] or size[0] == "pcs":
        return None
    return size[0], price / size[1] * 1000


def build_references(sheet_rows, previous):
    """Price per kg for every product in every store we already know, to sanity-check new readings."""
    refs = {}

    def add(row, price):
        ident = (row.get("id") or "").strip().lower()
        value = per_kilo(price, size_of_row(row))
        if ident and value:
            refs.setdefault(ident, {})[row_key(row)] = value

    for row in previous.values():
        add(row, to_number(row.get("price_sar")))
    for row in sheet_rows:
        add(row, to_number(row.get("price_sar")))
    return refs


# --------------------------------------------------------------------------- reading a page

VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
HIDDEN_TAGS = {"script", "style", "noscript", "template", "svg"}


class PageReader(HTMLParser):
    """Collects the machine-readable product data (and visible text) from one page."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.jsonld = []
        self.next_data = None
        self.meta = {}
        self.itemprop_prices = []
        self.itemprop_currency = []
        self.magento = []            # (price, inside the main product box?)
        self.title = ""
        self.h1 = ""
        self.visible = []
        self._stack = []             # open tags as (tag, classes)
        self._hidden = 0
        self._script = None
        self._capture = None         # ("title" | "h1" | "price", depth, buffer)

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "script":
            kind = a.get("type", "").lower()
            self._script = ["jsonld" if "ld+json" in kind else "next" if a.get("id") == "__NEXT_DATA__" else "other", []]
        if tag in HIDDEN_TAGS:
            self._hidden += 1

        key = (a.get("property") or a.get("name") or "").lower()
        if tag == "meta" and key and "content" in a:
            self.meta.setdefault(key, []).append(a["content"])

        itemprop = a.get("itemprop", "").lower()
        if itemprop == "price":
            if "content" in a:
                self.itemprop_prices.append(a["content"])
            elif tag not in VOID_TAGS:
                self._capture = ("price", len(self._stack), [])
        elif itemprop == "pricecurrency":
            self.itemprop_currency.append(a.get("content", ""))

        if a.get("data-price-type", "").lower() == "finalprice" and a.get("data-price-amount"):
            classes = " ".join(c for _, c in self._stack)
            self.magento.append((a["data-price-amount"], "product-info-main" in classes or "product-info-price" in classes))

        if tag == "title" and not self.title:
            self._capture = ("title", len(self._stack), [])
        elif tag == "h1" and not self.h1 and self._capture is None:
            self._capture = ("h1", len(self._stack), [])

        if tag not in VOID_TAGS:
            self._stack.append((tag, a.get("class", "").lower()))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag.lower() not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "script" and self._script:
            kind, parts = self._script
            if kind == "jsonld":
                self.jsonld.append("".join(parts))
            elif kind == "next":
                self.next_data = "".join(parts)
            self._script = None
        if tag in HIDDEN_TAGS and self._hidden:
            self._hidden -= 1
        # close the most recent matching tag (pages aren't always tidy)
        for index in range(len(self._stack) - 1, -1, -1):
            if self._stack[index][0] == tag:
                del self._stack[index:]
                break
        if self._capture and len(self._stack) <= self._capture[1]:
            kind, _, parts = self._capture
            text = " ".join("".join(parts).split())
            if kind == "title":
                self.title = text
            elif kind == "h1":
                self.h1 = text
            elif kind == "price" and text:
                self.itemprop_prices.append(text)
            self._capture = None

    def handle_data(self, data):
        if self._script:
            self._script[1].append(data)
            return
        if self._capture:
            self._capture[2].append(data)
        if not self._hidden and data.strip():
            self.visible.append(data)

    @property
    def page_name(self):
        for key in ("og:title", "twitter:title"):
            if self.meta.get(key):
                return self.meta[key][0]
        return self.h1 or self.title

    @property
    def text(self):
        return " ".join(" ".join(self.visible).split()).translate(ARABIC_DIGITS)


@dataclass
class Found:
    price: float
    currency: str = ""
    availability: str = ""
    name: str = ""
    method: str = ""


class NoPrice(Exception):
    """The page loaded, but the robot couldn't be sure of the price. The message says why."""


def distinct_prices(values):
    return sorted({round(v, 2) for v in values if v is not None})


def walk_jsonld(node):
    skip = {"offers", "review", "reviews", "aggregaterating", "isrelatedto", "issimilarto", "itemlistelement"}
    if isinstance(node, list):
        for item in node:
            yield from walk_jsonld(item)
    elif isinstance(node, dict):
        yield node
        for key, value in node.items():
            if key.lower() not in skip and isinstance(value, (dict, list)):
                yield from walk_jsonld(value)


def offer_prices(offers):
    """All prices a product's offers mention, with currency and stock status."""
    prices, currencies, stock = [], set(), []
    for offer in as_list(offers):
        if not isinstance(offer, dict):
            continue
        types = type_names(offer)
        stock.append(availability_of(offer.get("availability")))
        if offer.get("priceCurrency"):
            currencies.add(currency_of(offer.get("priceCurrency")))
        if "aggregateoffer" in types:
            if offer.get("offers"):
                sub_prices, sub_currencies, sub_stock = offer_prices(offer["offers"])
                prices += sub_prices
                currencies |= sub_currencies
                stock += sub_stock
            else:
                prices += [to_number(offer.get("lowPrice")), to_number(offer.get("highPrice"))]
            continue
        price = to_number(offer.get("price"))
        if price is None:
            for spec in as_list(offer.get("priceSpecification")):
                if not isinstance(spec, dict):
                    continue
                kind = str(spec.get("priceType") or "").rsplit("/", 1)[-1].lower()
                if kind in ("listprice", "strikethroughprice", "msrp", "srp", "invoiceprice"):
                    continue  # the crossed-out "was" price, not what you pay
                price = to_number(spec.get("price"))
                if spec.get("priceCurrency"):
                    currencies.add(currency_of(spec.get("priceCurrency")))
                if price is not None:
                    break
        prices.append(price)
    stock = [s for s in stock if s]
    status = "in_stock" if "in_stock" in stock else ("out_of_stock" if stock else "")
    return [p for p in prices if p is not None and p > 0], currencies, status


@dataclass
class Candidate:
    name: str
    prices: list
    currency: str = ""
    availability: str = ""


def choose(candidates, page_name, method):
    """Picks the product the page is about. Raises NoPrice when that isn't clear."""
    every_price = distinct_prices(p for c in candidates for p in c.prices)
    if len(candidates) == 1 or len(every_price) == 1:
        target = candidates[0]
    else:
        scored = sorted(candidates, key=lambda c: -similarity(c.name, page_name))
        best = scored[0]
        best_score = similarity(best.name, page_name)
        rival = max((similarity(c.name, page_name) for c in scored[1:] if c.prices != best.prices), default=0.0)
        if best_score < 0.5 or best_score - rival < 0.25:
            raise NoPrice(f"the page lists several products with different prices "
                          f"({', '.join(money(p) for p in every_price[:4])}), so the robot didn't pick one")
        target = best
    if len(target.prices) > 1:
        raise NoPrice(f"the product has several prices on the page ({', '.join(money(p) for p in target.prices[:4])}), "
                      "probably different sizes or sellers, so the robot didn't pick one")
    return Found(target.prices[0], target.currency, target.availability, target.name, method)


def from_jsonld(page):
    candidates, out_of_stock_without_price = [], False
    for raw in page.jsonld:
        try:
            data = json.loads(raw.strip().rstrip(";"))
        except (json.JSONDecodeError, ValueError):
            continue
        for node in walk_jsonld(data):
            types = type_names(node)
            if not any(t.endswith("product") for t in types) or "productgroup" in types:
                continue
            prices, currencies, status = offer_prices(node.get("offers"))
            if not prices and node.get("price") is not None:
                prices = [to_number(node.get("price"))]
            prices = [p for p in distinct_prices(prices) if p > 0]
            if not prices:
                out_of_stock_without_price |= status == "out_of_stock"
                continue
            currency = next(iter(currencies)) if len(currencies) == 1 else ("MIXED" if currencies else "")
            name = node.get("name")
            if isinstance(name, list):
                name = name[0] if name else ""
            candidates.append(Candidate(str(name or ""), prices, currency, status))
    if not candidates:
        if out_of_stock_without_price:
            raise NoPrice("the store lists this product as out of stock, without a price")
        return None
    return choose(candidates, page.page_name, "structured data (JSON-LD)")


def from_microdata(page):
    prices = distinct_prices(to_number(v) for v in page.itemprop_prices)
    if not prices:
        return None
    if len(prices) > 1:
        raise NoPrice(f"the page marks several different prices ({', '.join(money(p) for p in prices[:4])})")
    currencies = {currency_of(c) for c in page.itemprop_currency if c}
    return Found(prices[0], next(iter(currencies)) if len(currencies) == 1 else "", "", page.page_name, "structured data (microdata)")


def from_meta(page):
    values = page.meta.get("product:price:amount", []) + page.meta.get("og:price:amount", [])
    prices = distinct_prices(to_number(v) for v in values)
    if len(prices) != 1:
        return None
    currencies = {currency_of(c) for c in page.meta.get("product:price:currency", []) + page.meta.get("og:price:currency", [])}
    return Found(prices[0], next(iter(currencies)) if len(currencies) == 1 else "", "", page.page_name, "product tags")


def from_magento(page):
    main = distinct_prices(to_number(v) for v, inside in page.magento if inside)
    every = distinct_prices(to_number(v) for v, _ in page.magento)
    prices = main or every
    if len(prices) == 1:
        return Found(prices[0], "", "", page.page_name, "product price box")
    return None


PRICE_KEYS = ("finalprice", "sellingprice", "saleprice", "specialprice", "offerprice", "discountedprice",
              "currentprice", "price")
NAME_KEYS = ("name", "title", "productname", "name_en", "nameen", "displayname")


def price_shown_on_page(price, text):
    forms = {f"{price:.2f}", f"{price:.2f}".replace(".", ","), f"{price:g}"}
    if abs(price - round(price)) < 0.005:
        forms.add(str(int(round(price))))
    return any(re.search(rf"(?<![\d.,]){re.escape(form)}(?!\d)", text) for form in forms)


def from_next_data(page):
    """Websites built with Next.js carry their data as JSON. Only trusted when the same price is visible on the page."""
    if not page.next_data:
        return None
    try:
        data = json.loads(page.next_data)
    except (json.JSONDecodeError, ValueError):
        return None
    text = page.text
    found = []

    def visit(node, depth=0):
        if depth > 40:
            return
        if isinstance(node, list):
            for item in node:
                visit(item, depth + 1)
            return
        if not isinstance(node, dict):
            return
        lower = {str(k).lower(): v for k, v in node.items()}
        name = next((lower[k] for k in NAME_KEYS if isinstance(lower.get(k), str)), None)
        if name:
            for key in PRICE_KEYS:
                value = lower.get(key)
                if isinstance(value, dict):
                    value = value.get("value", value.get("amount"))
                price = to_number(value) if isinstance(value, (int, float, str)) else None
                if price and price > 0 and price_shown_on_page(price, text):
                    raw_currency = lower.get("currency") or lower.get("pricecurrency")
                    currency = currency_of(raw_currency) if isinstance(raw_currency, str) else ""
                    found.append(Candidate(name, [round(price, 2)], currency))
                    break
        for value in node.values():
            if isinstance(value, (dict, list)):
                visit(value, depth + 1)

    visit(data)
    found = [c for c in found if similarity(c.name, page.page_name) >= 0.5]
    if not found:
        return None
    return choose(found, page.page_name, "page data (Next.js)")


def read_price(html):
    """Finds the product's price in a page, or raises NoPrice explaining why not."""
    page = PageReader()
    try:
        page.feed(html)
        page.close()
    except Exception:  # a badly broken page: use whatever was read before the error
        pass
    problems = []
    for method in (from_jsonld, from_microdata, from_meta, from_magento, from_next_data):
        try:
            found = method(page)
        except NoPrice as reason:
            problems.append(str(reason))
            continue
        if found:
            if not found.name:
                found.name = page.page_name
            return found
    if problems:
        raise NoPrice(problems[0])
    raise NoPrice("the page has no machine-readable price, so the robot didn't guess one from the text")


# --------------------------------------------------------------------------- visiting pages

class FetchError(Exception):
    def __init__(self, kind, message):
        super().__init__(message)
        self.kind = kind


class Fetcher:
    """Downloads pages politely: honest name, robots.txt, a pause per store, and backs off when refused."""

    def __init__(self, delay, contact=""):
        self.delay = delay
        self.user_agent = "YaraPriceRobot/1.0 (student project; one visit per product per night"
        self.user_agent += f"; +{contact})" if contact else ")"
        self.last_visit = {}
        self.robots = {}
        self.strikes = {}
        self.stopped_hosts = set()
        self.opener = urllib.request.build_opener()

    def _headers(self):
        return {
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-SA,en;q=0.9,ar;q=0.8",
            "Accept-Encoding": "gzip, deflate",
        }

    def _wait(self, host, extra=0.0):
        pause = max(self.delay, extra)
        elapsed = time.monotonic() - self.last_visit.get(host, -1e9)
        if elapsed < pause:
            time.sleep(pause - elapsed)
        self.last_visit[host] = time.monotonic()

    def _download(self, url):
        request = urllib.request.Request(url, headers=self._headers())
        with self.opener.open(request, timeout=TIMEOUT) as response:
            body = response.read(MAX_BYTES)
            encoding = (response.headers.get("Content-Encoding") or "").lower()
            if encoding == "gzip":
                body = gzip.decompress(body)
            elif encoding == "deflate":
                try:
                    body = zlib.decompress(body)
                except zlib.error:
                    body = zlib.decompress(body, -zlib.MAX_WBITS)
            charset = response.headers.get_content_charset() or "utf-8"
            return body.decode(charset, errors="replace"), response.geturl(), response.headers.get_content_type()

    def _robots_for(self, url):
        parts = urllib.parse.urlsplit(url)
        root = f"{parts.scheme}://{parts.netloc}"
        if root not in self.robots:
            rules = urllib.robotparser.RobotFileParser()
            try:
                self._wait(parts.netloc.lower())
                text, _, _ = self._download(root + "/robots.txt")
                rules.parse(text.splitlines())
            except urllib.error.HTTPError as error:
                if 400 <= error.code < 500:
                    rules.parse([])            # no robots.txt: visiting is allowed
                else:
                    rules.disallow_all = True  # store unreachable: assume not allowed (RFC 9309)
            except Exception:
                rules.disallow_all = True
            self.robots[root] = rules
        return self.robots[root]

    def get(self, url):
        host = urllib.parse.urlsplit(url).netloc.lower()
        if host in self.stopped_hosts:
            raise FetchError("blocked", "the store refused earlier visits tonight, so the robot left it alone")
        rules = self._robots_for(url)
        if not rules.can_fetch(self.user_agent, url):
            raise FetchError("robots", "the store's robots.txt asks robots not to visit this page")
        crawl_delay = rules.crawl_delay(self.user_agent) or 0
        for attempt in (1, 2):
            self._wait(host, float(crawl_delay))
            try:
                html, final_url, content_type = self._download(url)
                self.strikes[host] = 0
                if "html" not in content_type and "xml" not in content_type:
                    raise FetchError("other", f"the link doesn't open a web page ({content_type})")
                return html, final_url
            except urllib.error.HTTPError as error:
                if error.code in (401, 403, 429):
                    self.strikes[host] = self.strikes.get(host, 0) + 1
                    if self.strikes[host] >= BLOCKS_BEFORE_STOPPING:
                        self.stopped_hosts.add(host)
                    raise FetchError("blocked", f"the store refused the visit (HTTP {error.code})")
                if error.code in (404, 410):
                    raise FetchError("missing", f"the product page is gone (HTTP {error.code}); update the link")
                if attempt == 2 or error.code < 500:
                    raise FetchError("server", f"the store's website returned an error (HTTP {error.code})")
            except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError, OSError):
                if attempt == 2:
                    raise FetchError("server", "the store's website didn't answer")
        raise FetchError("server", "the store's website didn't answer")


class Browser:
    """Optional: renders pages that are built with JavaScript. Never used to get past a refusal."""

    def __init__(self, user_agent):
        from playwright.sync_api import sync_playwright  # only needed with --browser
        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch()
        self._context = self._browser.new_context(user_agent=user_agent, locale="en-SA")

    def render(self, url):
        page = self._context.new_page()
        try:
            response = page.goto(url, wait_until="domcontentloaded", timeout=30000)
            if response is not None and response.status >= 400:
                raise FetchError("blocked" if response.status in (401, 403, 429) else "server",
                                 f"the store's website returned HTTP {response.status}")
            try:
                page.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            return page.content()
        finally:
            page.close()

    def close(self):
        for closer in (self._context.close, self._browser.close, self._playwright.stop):
            try:
                closer()
            except Exception:
                pass


# --------------------------------------------------------------------------- checking a price

@dataclass
class Outcome:
    row: dict
    ok: bool = False
    price: float = 0.0
    availability: str = ""
    page_size: tuple | None = None
    method: str = ""
    problem: str = ""
    kind: str = ""               # "blocked", "robots", "missing", "server", "unsure", "held", "other"
    first: bool = False          # the robot had no earlier price to compare with
    notes: list = field(default_factory=list)


def check_price(found, row, last_price, others=()):
    """Returns a reason to hold the price back, or None when it looks right.
    others: (base unit, price per kg) of the same product in other stores."""
    if found.currency and found.currency != "SAR":
        return f"the price isn't in riyals ({found.currency})"
    if not MIN_PRICE <= found.price <= MAX_PRICE:
        return f"the price read as {money(found.price)} SAR, which looks like a reading error"
    if last_price:
        ratio = found.price / last_price
        if ratio > MAX_RISE or ratio < MAX_DROP:
            return (f"the price jumped from {money(last_price)} to {money(found.price)} SAR; the old one is kept "
                    "until someone confirms it in the sheet")
    page_size = size_in_name(found.name)
    sheet_size = size_of_row(row)
    if page_size and sheet_size and page_size[0] == sheet_size[0]:
        if abs(page_size[1] - sheet_size[1]) / sheet_size[1] > SIZE_TOLERANCE:
            return (f"the page is for {describe_size(page_size[0], page_size[1])} but the sheet says "
                    f"{describe_size(*sheet_size)}; fix the size or the link")
    mine = per_kilo(found.price, sheet_size or (page_size[:2] if page_size else None))
    comparable = sorted(value for base, value in others if mine and base == mine[0])
    if mine and comparable:
        typical = comparable[len(comparable) // 2]
        if not 1 / MAX_STORE_GAP <= mine[1] / typical <= MAX_STORE_GAP:
            unit = "kg" if mine[0] == "g" else "litre"
            return (f"that's {money(mine[1])} SAR per {unit}, far from other stores ({money(typical)} SAR per {unit}); "
                    "check the link and the pack size")
    return None


def visit_row(row, fetcher, browser, last_price, others=()):
    outcome = Outcome(row=row)
    url = row["url"]
    try:
        html, final_url = fetcher.get(url)
        try:
            found = read_price(html)
        except NoPrice as reason:
            if browser is None:
                raise
            html = browser.render(final_url)
            found = read_price(html)
            outcome.notes.append("page needed a browser")
    except FetchError as error:
        outcome.kind, outcome.problem = error.kind, str(error)
        return outcome
    except NoPrice as reason:
        outcome.kind, outcome.problem = "unsure", str(reason)
        return outcome
    except Exception as error:  # never let one odd page stop the whole run
        outcome.kind, outcome.problem = "other", f"unexpected problem: {error}"
        return outcome

    held = check_price(found, row, last_price, others)
    if held:
        outcome.kind, outcome.problem = "held", held
        return outcome
    outcome.ok = True
    outcome.price = round(found.price, 2)
    outcome.availability = found.availability
    outcome.method = found.method
    outcome.page_size = size_in_name(found.name)
    outcome.first = not last_price
    return outcome


# --------------------------------------------------------------------------- files

def read_text(source):
    if re.match(r"^https?://", source, re.IGNORECASE):
        request = urllib.request.Request(source, headers={"User-Agent": "YaraPriceRobot/1.0"})
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read().decode("utf-8-sig", errors="replace")
    with open(source, encoding="utf-8-sig") as handle:
        return handle.read()


def read_rows(text):
    text = text.lstrip("\ufeff")
    first = text.split("\n", 1)[0]
    delimiter = ";" if first.count(";") > first.count(",") else ","
    rows = []
    for raw in csv.DictReader(io.StringIO(text), delimiter=delimiter):
        row = {str(k).strip().lower(): str(v or "").strip() for k, v in raw.items() if k}
        if any(row.values()):
            rows.append(row)
    return rows, [h.strip().lower() for h in next(csv.reader(io.StringIO(first), delimiter=delimiter), [])]


def write_file(path, content):
    folder = os.path.dirname(os.path.abspath(path))
    os.makedirs(folder, exist_ok=True)
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8", newline="") as handle:
        handle.write(content)
    os.replace(temporary, path)  # the old file is only replaced once the new one is complete


def to_csv(rows):
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=OUTPUT_COLUMNS, extrasaction="ignore", lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return "\ufeff" + buffer.getvalue()   # the mark helps Excel show Arabic correctly


# --------------------------------------------------------------------------- the run

def build_output(sheet_rows, previous, outcomes, today):
    output, no_price = [], []
    for index, row in enumerate(sheet_rows):
        key = row_key(row)
        last = previous.get(key)
        outcome = outcomes.get(index)
        record = {column: row.get(column, "") for column in OUTPUT_COLUMNS}
        record["url"] = row.get("url", "")
        manual_price, manual_date = to_number(row.get("price_sar")), parse_date(row.get("checked"))
        today_text = today.isoformat()

        if outcome and outcome.ok and not (manual_price and manual_date and manual_date >= today):
            record.update(price_sar=money(outcome.price), checked=today_text, source="store website",
                          availability=outcome.availability, updated_by="robot")
            if not record["size"] and outcome.page_size:
                record["size"], record["unit"] = outcome.page_size[2], outcome.page_size[3]
        else:
            options = []
            if manual_price:
                options.append((manual_date or date.min, 1, {"price_sar": money(manual_price),
                                "checked": row.get("checked", ""), "updated_by": "manual", "availability": ""}))
            if last and to_number(last.get("price_sar")):
                options.append((parse_date(last.get("checked")) or date.min, 0, {
                    "price_sar": money(to_number(last["price_sar"])), "checked": last.get("checked", ""),
                    "updated_by": last.get("updated_by") or "manual", "availability": last.get("availability", ""),
                    "source": last.get("source") or record["source"]}))
            if not options:
                no_price.append(row)
                continue
            options.sort(key=lambda item: (item[0], item[1]))   # newest date wins; the sheet wins a tie
            record.update(options[-1][2])
        output.append(record)
    return output, no_price


def report(outcomes, output, no_price, sheet_rows, started, finished, browser_note):
    by_store = {}
    for index, row in enumerate(sheet_rows):
        store = row.get("store") or "(no store)"
        stats = by_store.setdefault(store, {"rows": 0, "links": 0, "updated": 0})
        stats["rows"] += 1
        if row.get("url"):
            stats["links"] += 1
        outcome = outcomes.get(index)
        if outcome and outcome.ok:
            stats["updated"] += 1

    updated = sum(1 for o in outcomes.values() if o.ok)
    lines = [
        "# Yara price robot report",
        "",
        f"Run on {started.strftime('%Y-%m-%d %H:%M')} (Riyadh time), took {int((finished - started).total_seconds())} seconds. {browser_note}",
        "",
        f"**{updated} of {len(outcomes)} product links updated automatically.** "
        f"{len(output)} prices are in the price file.",
        "",
        "| Store | Rows | With a product link | Updated tonight |",
        "|---|---|---|---|",
    ]
    for store, stats in sorted(by_store.items()):
        lines.append(f"| {store} | {stats['rows']} | {stats['links']} | {stats['updated']} |")

    held = [o for o in outcomes.values() if not o.ok]
    lines += ["", "## Needs a look", ""]
    if held:
        lines += ["These kept their last price (with its original date, so the site shows them as older).", "",
                  "| Product | Store | What happened |", "|---|---|---|"]
        for outcome in held:
            row = outcome.row
            name = row.get("name_en") or row.get("name_ar") or row.get("id")
            lines.append(f"| {name} | {row.get('store', '')} | {outcome.problem} |")
        kinds = {o.kind for o in held}
        tips = []
        if "blocked" in kinds or "robots" in kinds:
            tips.append("A store that refuses the robot can't be checked from GitHub. Run the robot from your own "
                        "computer instead (README, part 4f), or keep typing that store's prices in the sheet.")
        if "held" in kinds:
            tips.append("For a held price: if the new price is right, type it into the sheet with today's date and "
                        "the robot will accept it from then on.")
        if "unsure" in kinds:
            tips.append("\"No machine-readable price\" means this store's pages don't publish their price in a form the "
                        "robot trusts. Keep that store's prices manual.")
        if tips:
            lines += [""] + [f"- {tip}" for tip in tips]
    elif outcomes:
        lines.append("Nothing. Every product link was updated.")
    else:
        lines.append("No rows have a product link yet. Paste store links into the sheet's url column to turn on "
                     "automatic updates; until then, the prices you type are used as they are.")

    first = [o for o in outcomes.values() if o.ok and o.first]
    if first:
        lines += ["", "## New prices, worth a glance once", "",
                  "The robot read these for the first time, so it had nothing to compare them with.", "",
                  "| Product | Store | Price read |", "|---|---|---|"]
        for outcome in first:
            row = outcome.row
            name = row.get("name_en") or row.get("name_ar") or row.get("id")
            size = row.get("size") and f" for {row.get('size')} {row.get('unit', '')}".rstrip()
            lines.append(f"| {name} | {row.get('store', '')} | {money(outcome.price)} SAR{size or ''} |")

    if no_price:
        lines += ["", "## No price yet", "", "These rows have no price in the sheet and none from the robot, so they "
                  "aren't on the site yet:", ""]
        lines += [f"- {r.get('name_en') or r.get('name_ar') or r.get('id')} ({r.get('store', 'no store')})" for r in no_price]
    return "\n".join(lines) + "\n"


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Refresh Yara's prices from the stores' product pages.")
    parser.add_argument("--sheet", required=True, help="the published price sheet (CSV link or file)")
    parser.add_argument("--previous", default="data/prices.csv", help="the last price file (path or link)")
    parser.add_argument("--out", default="data/prices.csv")
    parser.add_argument("--report", default="data/price-report.md")
    parser.add_argument("--browser", action="store_true", help="render JavaScript pages (needs playwright)")
    parser.add_argument("--delay", type=float, default=4.0, help="seconds between visits to the same store")
    parser.add_argument("--only", default="", help="only check rows whose store, id or link contains this text")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    started = datetime.now(RIYADH)
    today = started.date()

    try:
        sheet_rows, headers = read_rows(read_text(args.sheet))
    except Exception as error:
        print(f"Couldn't read the price sheet: {error}")
        return 1
    if "price_sar" not in headers or not sheet_rows:
        print("That doesn't look like the price sheet (no price_sar column, or no rows). Nothing was changed.")
        return 1

    previous = {}
    try:
        for row in read_rows(read_text(args.previous))[0]:
            previous[row_key(row)] = row
    except Exception:
        print(f"No earlier price file at {args.previous}; starting fresh.")

    fetcher = Fetcher(args.delay, os.environ.get("PRICE_ROBOT_CONTACT", ""))
    browser, browser_note = None, ""
    if args.browser:
        try:
            browser = Browser(fetcher.user_agent)
            browser_note = "Pages built with JavaScript were rendered in a browser."
        except Exception as error:
            browser_note = f"(The browser helper isn't available, so JavaScript-only pages were skipped: {error})"

    # Visit stores in turn, so each store gets a pause between the robot's visits.
    queues = {}
    for index, row in enumerate(sheet_rows):
        url = row.get("url", "")
        if not re.match(r"^https?://", url, re.IGNORECASE):
            continue
        needle = args.only.lower()
        if needle and needle not in " ".join([row.get("store", ""), row.get("id", ""), url]).lower():
            continue
        queues.setdefault(urllib.parse.urlsplit(url).netloc.lower(), []).append(index)

    outcomes = {}
    references = build_references(sheet_rows, previous)
    try:
        while any(queues.values()):
            for host in list(queues):
                if not queues[host]:
                    continue
                index = queues[host].pop(0)
                row = sheet_rows[index]
                last = previous.get(row_key(row))
                last_price = to_number(last.get("price_sar")) if last else to_number(row.get("price_sar"))
                ident, key = (row.get("id") or "").strip().lower(), row_key(row)
                others = [value for other_key, value in references.get(ident, {}).items() if other_key != key]
                outcome = visit_row(row, fetcher, browser, last_price, others)
                outcomes[index] = outcome
                if outcome.ok and ident:
                    size = size_of_row(row) or (outcome.page_size[:2] if outcome.page_size else None)
                    value = per_kilo(outcome.price, size)
                    if value:
                        references.setdefault(ident, {})[key] = value
                label = row.get("name_en") or row.get("id")
                status = f"{money(outcome.price)} SAR ({outcome.method})" if outcome.ok else f"kept last price: {outcome.problem}"
                print(f"  {row.get('store', '?'):<12} {label[:40]:<40} {status}")
    finally:
        if browser:
            browser.close()

    output, no_price = build_output(sheet_rows, previous, outcomes, today)
    finished = datetime.now(RIYADH)
    text = report(outcomes, output, no_price, sheet_rows, started, finished, browser_note)
    print()
    print(text)
    if not output:
        print("No prices at all, so the price file was left as it was.")
        return 1
    if not args.dry_run:
        write_file(args.out, to_csv(output))
        write_file(args.report, text)
        print(f"Wrote {args.out} and {args.report}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
