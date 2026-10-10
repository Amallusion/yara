# Yara price robot

Keeps Yara's prices current without trusting anything it isn't sure of.

Every night (`.github/workflows/refresh-prices.yml`) it reads the published price sheet,
visits the store page linked in each row's `url` column, and writes:

- `data/prices.csv`: the prices the website and the chatbot read
- `data/price-report.md`: what was updated, what was held back and why

## How it reads a price

In order, it looks for the price in the store's own product markup:

1. Structured data (schema.org `Product` / `Offer` in JSON-LD), including sale prices
   and stock status
2. Microdata (`itemprop="price"`)
3. Product price tags (`product:price:amount`)
4. The main price box of Magento-style stores
5. The page data of Next.js sites, but only when the same price is also visible on
   the page

Pages built entirely with JavaScript are rendered in a headless browser when
`--browser` is on. It never reads prices out of plain page text: that's how a
"free delivery over SAR 150" banner ends up as a product's price.

## When it holds a price back

The last good price is kept (with its original date) and the row is reported when:

- the page shows several different prices, or it isn't clear which product the page is
  about
- the price jumps outside 0.4x to 2.5x of the last one
- the price per kg is more than 3x away from the same product in other stores
- the pack size in the product's name doesn't match the sheet
- the price isn't in riyals, or is outside 0.25 to 2,000 SAR

## Manners

It follows robots.txt (RFC 9309) and any crawl delay, names itself honestly as
`YaraPriceRobot` with a link to this repository, waits between visits to the same store,
and stops visiting a store after it refuses twice. A refusal is never retried in a
browser.

## Run it

```
python robot/refresh_prices.py --sheet "SHEET_CSV_LINK"              # standard library only
python robot/refresh_prices.py --sheet sheet.csv --dry-run --only lulu  # try one store, write nothing
python -m unittest discover -s robot -v                                # the tests
```

The workflow runs the tests first and doesn't update any prices if one fails.
