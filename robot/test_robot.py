"""
Tests for the Yara price robot. They run offline, in about a second:

    python -m unittest discover -s robot -v

The nightly robot runs these first and doesn't touch any prices if one fails.
"""

import json
import os
import sys
import tempfile
import unittest
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
import refresh_prices as robot  # noqa: E402


def page(head="", body="", title="Store"):
    return f"<!doctype html><html><head><title>{title}</title>{head}</head><body>{body}</body></html>"


def ld(data):
    return f'<script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>'


class ReadsPrices(unittest.TestCase):
    def test_json_ld_product(self):
        html = page(ld({"@type": "Product", "name": "Red Lentils 1kg",
                        "offers": {"@type": "Offer", "price": "7.50", "priceCurrency": "SAR",
                                   "availability": "https://schema.org/InStock"}}))
        found = robot.read_price(html)
        self.assertEqual((found.price, found.currency, found.availability), (7.5, "SAR", "in_stock"))

    def test_json_ld_inside_graph_with_a_single_price_range(self):
        html = page(ld({"@graph": [{"@type": "BreadcrumbList"},
                                   {"@type": ["Product"], "name": "Oats 500g",
                                    "offers": {"@type": "AggregateOffer", "lowPrice": 3.99, "highPrice": 3.99}}]}))
        self.assertEqual(robot.read_price(html).price, 3.99)

    def test_sale_price_not_the_crossed_out_price(self):
        html = page(ld({"@type": "Product", "name": "Tahini 500g", "offers": {"@type": "Offer", "priceSpecification": [
            {"@type": "UnitPriceSpecification", "priceType": "https://schema.org/ListPrice", "price": 15.25},
            {"@type": "UnitPriceSpecification", "price": 12.50, "priceCurrency": "SAR"}]}}))
        self.assertEqual(robot.read_price(html).price, 12.5)

    def test_picks_the_main_product_over_related_ones(self):
        html = page(ld([{"@type": "Product", "name": "Almarai Soy Milk 1L", "offers": {"price": "11.99"}},
                        {"@type": "Product", "name": "Coconut Water 330ml", "offers": {"price": "4.50"}}]),
                    title="Almarai Soy Milk 1L | LuLu")
        self.assertEqual(robot.read_price(html).price, 11.99)

    def test_microdata(self):
        html = page(body='<div itemscope itemtype="https://schema.org/Product"><h1 itemprop="name">Foul 400g</h1>'
                         '<span itemprop="price" content="2.25"></span><meta itemprop="priceCurrency" content="SAR"></div>')
        self.assertEqual(robot.read_price(html).price, 2.25)

    def test_product_price_tags(self):
        html = page('<meta property="product:price:amount" content="9.95">'
                    '<meta property="product:price:currency" content="SAR">')
        self.assertEqual(robot.read_price(html).price, 9.95)

    def test_magento_main_price_box_wins_over_related_products(self):
        html = page(body='<div class="product-info-main"><span data-price-type="finalPrice" data-price-amount="6.75">'
                         'SAR 6.75</span></div><div class="related"><span data-price-type="finalPrice" '
                         'data-price-amount="14.00">SAR 14.00</span></div>')
        self.assertEqual(robot.read_price(html).price, 6.75)

    def test_next_js_data_only_when_the_price_is_visible(self):
        data = {"props": {"pageProps": {"product": {"name": "Soya Chunks 200g", "price": {"value": 3.5}},
                                        "recommended": [{"name": "Rice 5kg", "price": 30}]}}}
        script = f'<script id="__NEXT_DATA__" type="application/json">{json.dumps(data)}</script>'
        visible = robot.read_price(page(body=f"<h1>Soya Chunks 200g</h1><p>SAR 3.50</p>{script}"))
        self.assertEqual(visible.price, 3.5)
        with self.assertRaises(robot.NoPrice):   # same data, but the price isn't on the page
            robot.read_price(page(body=f"<h1>Soya Chunks 200g</h1>{script}"))

    def test_arabic_digits(self):
        html = page(ld({"@type": "Product", "name": "حمص", "offers": {"price": "٦٫٧٥"}}))
        self.assertEqual(robot.read_price(html).price, 6.75)


class RefusesToGuess(unittest.TestCase):
    def test_price_only_in_the_text_is_not_used(self):
        html = page(body="<p>Free delivery on orders above SAR 150</p><h1>Red Lentils 1kg</h1><p>SAR 7.50</p>")
        with self.assertRaises(robot.NoPrice):
            robot.read_price(html)

    def test_several_prices_for_one_product(self):
        html = page(ld({"@type": "Product", "name": "Chickpeas", "offers": [{"price": 4.75}, {"price": 9.95}]}))
        with self.assertRaises(robot.NoPrice):
            robot.read_price(html)

    def test_unclear_which_product_the_page_is_about(self):
        html = page(ld([{"@type": "Product", "name": "Oats 500g", "offers": {"price": 3.99}},
                        {"@type": "Product", "name": "Oats 1kg", "offers": {"price": 7.25}}]), title="Oats")
        with self.assertRaises(robot.NoPrice):
            robot.read_price(html)

    def test_out_of_stock_without_a_price(self):
        html = page(ld({"@type": "Product", "name": "Tofu", "offers": {
            "price": 0, "availability": "https://schema.org/OutOfStock"}}))
        with self.assertRaises(robot.NoPrice) as caught:
            robot.read_price(html)
        self.assertIn("out of stock", str(caught.exception))


class SafetyChecks(unittest.TestCase):
    row = {"size": "1", "unit": "kg"}

    def found(self, price, name="Red Lentils 1kg", currency="SAR"):
        return robot.Found(price, currency, "", name, "test")

    def test_normal_price_passes(self):
        self.assertIsNone(robot.check_price(self.found(7.95), self.row, last_price=7.50))

    def test_big_jump_is_held(self):
        self.assertIn("jumped", robot.check_price(self.found(75.0), self.row, last_price=7.50))

    def test_other_currency_is_held(self):
        self.assertIn("riyals", robot.check_price(self.found(2.0, currency="USD"), self.row, None))

    def test_pack_size_mismatch_is_held(self):
        self.assertIn("sheet says", robot.check_price(self.found(4.5, "Red Lentils 400g"), self.row, None))

    def test_similar_pack_size_is_fine(self):
        self.assertIsNone(robot.check_price(self.found(7.5, "Red Lentils 950 g"), self.row, None))

    def test_price_far_from_other_stores_is_held(self):
        oats = {"size": "500", "unit": "g"}
        others = [("g", 7.98), ("g", 8.50)]            # other stores: about 8 SAR per kg
        self.assertIn("far from other stores", robot.check_price(self.found(39.90, "Oats 500g"), oats, None, others))
        self.assertIsNone(robot.check_price(self.found(4.25, "Oats 500g"), oats, None, others))

    def test_multipacks_are_not_compared(self):
        self.assertIsNone(robot.size_in_name("Chickpeas 6 x 400g"))
        self.assertEqual(robot.size_in_name("حليب الصويا 1 لتر")[:2], ("ml", 1000.0))


class BuildsTheFile(unittest.TestCase):
    today = date(2026, 9, 20)

    def test_robot_price_wins_over_older_prices(self):
        sheet = [{"id": "oats", "store": "Tamimi", "price_sar": "3.99", "checked": "2025-06", "url": "https://x"}]
        outcome = robot.Outcome(row=sheet[0], ok=True, price=4.25, availability="in_stock")
        output, _ = robot.build_output(sheet, {}, {0: outcome}, self.today)
        self.assertEqual((output[0]["price_sar"], output[0]["checked"], output[0]["updated_by"]),
                         ("4.25", "2026-09-20", "robot"))

    def test_failed_visit_keeps_the_last_price_and_its_date(self):
        sheet = [{"id": "oats", "store": "Tamimi", "price_sar": "3.99", "checked": "2025-06", "url": "https://x"}]
        previous = {"oats|tamimi": {"price_sar": "4.10", "checked": "2026-09-01", "updated_by": "robot"}}
        outcome = robot.Outcome(row=sheet[0], ok=False, kind="blocked", problem="refused")
        output, _ = robot.build_output(sheet, previous, {0: outcome}, self.today)
        self.assertEqual((output[0]["price_sar"], output[0]["checked"]), ("4.10", "2026-09-01"))

    def test_a_fresher_price_typed_in_the_sheet_wins(self):
        sheet = [{"id": "oats", "store": "Tamimi", "price_sar": "3.75", "checked": "2026-09-15"}]
        previous = {"oats|tamimi": {"price_sar": "4.10", "checked": "2026-09-01", "updated_by": "robot"}}
        output, _ = robot.build_output(sheet, previous, {}, self.today)
        self.assertEqual((output[0]["price_sar"], output[0]["updated_by"]), ("3.75", "manual"))

    def test_rows_without_any_price_are_listed_not_published(self):
        output, no_price = robot.build_output([{"id": "tofu", "store": "Lulu"}], {}, {}, self.today)
        self.assertEqual((len(output), len(no_price)), (0, 1))

    def test_refuses_a_sheet_that_is_not_the_price_sheet(self):
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as handle:
            handle.write("<html>Sign in to Google</html>")
        try:
            self.assertEqual(robot.main(["--sheet", handle.name, "--dry-run"]), 1)
        finally:
            os.unlink(handle.name)


if __name__ == "__main__":
    unittest.main()
