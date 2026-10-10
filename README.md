# Yara — plant-based in Saudi Arabia (v2)

A bilingual (Arabic + English) website for plant-based eating in Saudi Arabia: a
protein-per-riyal ranking, recipes, a basket planner, and a slot for the Yara chatbot.
It's plain HTML, CSS and JavaScript, so there's nothing to install or build.

## What's in the folder

```
index.html         the page
styles.css         the look
app.js             the logic (you rarely need to touch this)
i18n.js            every word on the site, in English and Arabic
config.js          settings: chatbot link, credits, GitHub link
data/prices.csv    the price file the website and chatbot read (written by the robot)
robot/             the price robot and its tests
data/recipes.js    15 recipes in both languages, with protein and links to the price list
data/week.js       the 7-day meal plan
assets/            logo, favicon, link-preview image
knowledge/         the chatbot's knowledge files (see knowledge/README.md)
tools/             builds the knowledge files from the site's data
.github/workflows/ runs the price robot every night
.nojekyll          tells GitHub Pages to serve the files as they are
```

## 1. Put it on GitHub

1. Create a free account at github.com and click **New repository**. Name it `yara`,
   keep it **Public**, and create it.
2. On the empty repository page, click **uploading an existing file**. Unzip this
   download, open the `yara` folder, select everything inside it, and drag it onto the
   page. Click **Commit changes**.

`.nojekyll` and the `.github` folder are hidden, so your computer may not let you drag
them. That's fine: the site works without `.nojekyll`, and part 4d shows how to add the
`.github` robot straight on GitHub.

## 2. Turn on GitHub Pages

In your repository: **Settings → Pages → Build and deployment**. Set **Source** to
**Deploy from a branch**, pick **main** and **/ (root)**, then **Save**.

After a minute or two the site is live at `https://YOUR-USERNAME.github.io/yara/`.
From then on, every file you upload or edit on GitHub goes live within a couple of
minutes, with no monthly deploy limit.

## 3. Send the old Netlify link to the new site (optional)

To keep `yaravegan.netlify.app` working, make a new folder containing one file named
`_redirects` (no extension) with this single line:

```
/*  https://YOUR-USERNAME.github.io/yara/:splat  301!
```

Drag that folder onto the **Deploys** page of your Netlify site. It's one deploy, so it
uses very few of Netlify's free credits, and anyone with the old link lands on v2.

## 4. Prices: a Google Sheet plus a price robot

You keep one Google Sheet: the product list, protein from the labels, and either a price
you checked or a link to the product's page on the store website. Every night a robot
(a GitHub workflow) visits those links, reads each store's price, and saves
`data/prices.csv`. The website and the chatbot both read that one file.

```
Google Sheet ──> price robot (every night) ──> data/prices.csv ──> website
 (you edit)       reads the store pages          + price-report.md └─> chatbot
```

The robot would rather keep an older, dated price than show a wrong one:

- It reads prices only from the store's structured product data (the machine-readable
  information stores publish for Google), never by guessing numbers from page text.
- It holds back a price that jumps more than 2.5 times from the last one, one whose price
  per kg is 3 times away from other stores, or one whose pack size doesn't match the
  sheet, and lists it in the report for you to check.
- When a page fails, the last good price stays, with its original date, so the site
  shows it as older instead of pretending it's new.
- It follows each store's robots.txt, names itself honestly with a link to your
  repository, waits 4 seconds between visits to the same store, and stops visiting a
  store that refuses it.

### 4a. Create the sheet

1. Go to sheets.google.com and create a **Blank spreadsheet**. Name it *Yara prices*.
2. **File → Import → Upload**, choose `yara-price-sheet.xlsx` (it came with this
   download), and pick **Replace spreadsheet**.
3. You now have two tabs: **Prices** (the table) and **How to use** (instructions in
   English and Arabic). The dropdowns for store, unit and category come with it.

### 4b. Publish it

1. **File → Share → Publish to the web**.
2. Under **Link**, choose the **Prices** tab (not "Entire document") and
   **Comma-separated values (.csv)**, then **Publish**.
3. Copy the link. It looks like
   `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`.

Publishing makes the **Prices** tab public (prices are public anyway). Only people you
share the sheet with can *edit* it. Leave `pricesSheetUrl` in `config.js` empty: the
website reads the robot's file, which includes everything from the sheet.

### 4c. Filling in the sheet

The sheet starts with 85 prices for 47 products from the LuLu, Carrefour and Panda
websites, checked on 19 September 2026. The `note` column gives each product's exact
name in the store, marks sale prices, and flags anything to check. Protein values are
typical values for each food, so confirm them against the real labels when you can.

One row per product per store. Use the same `id` for one product across stores, so the
site can compare them.

- **Automatic rows:** paste the product's page from the store's website into `url`
  (open the product on the store's site and copy the address bar). The robot fills in
  the price and date every night. If the sheet has no pack size, it takes it from the
  product's name.
- **Manual rows:** leave `url` empty, type `price_sar`, and set `checked` to the date you
  saw it, as `2026-09-20`. Use these for stores the robot can't read.
- A price you type with a newer date always wins over the robot's, so you can correct
  anything at any time.
- A product joins the **protein ranking** once it has a pack size, unit, price and
  `protein_per_100` (from the nutrition label).
- Prices older than 60 days show as "may have changed" on the site, and the chatbot
  warns about them too. Change the number with `staleAfterDays` in `config.js`.

### 4d. Turn on the price robot

1. In your repository, go to **Settings → Secrets and variables → Actions →
   Variables → New repository variable**. Name: `PRICES_SHEET_URL`. Value: the CSV link
   from step 4b.
2. Go to **Settings → Actions → General → Workflow permissions**, choose **Read and
   write permissions**, and **Save**, so the robot can save the new prices.
3. Go to **Add file → Create new file**. Type the name
   `.github/workflows/refresh-prices.yml` (the slashes create the folders), paste the
   code below, and click **Commit changes**. (Skip this if the file is already in your
   repository.)
4. Open the **Actions** tab, choose **Refresh prices**, and click **Run workflow**. After
   a few minutes, click the finished run to see the report.

```yaml
# Every night: visits the product links in your price sheet, reads each store's price,
# and saves data/prices.csv (what the website and chatbot read) plus data/price-report.md.
# Setup: README, part 4.
name: Refresh prices

on:
  schedule:
    - cron: "0 0 * * *" # every night at 3:00 am Riyadh time
  workflow_dispatch: # adds a "Run workflow" button

permissions:
  contents: write

concurrency:
  group: refresh-prices
  cancel-in-progress: false

jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 40
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Check the robot still works
        run: python -m unittest discover -s robot

      - name: Install the browser helper (for store pages built with JavaScript)
        continue-on-error: true
        run: |
          pip install -r robot/requirements.txt
          python -m playwright install --with-deps chromium

      - name: Visit the product links and update prices
        env:
          SHEET_URL: ${{ vars.PRICES_SHEET_URL }}
          PRICE_ROBOT_CONTACT: ${{ github.server_url }}/${{ github.repository }}
        run: |
          if [ -z "$SHEET_URL" ]; then
            echo "::error::Add a repository variable named PRICES_SHEET_URL (README, part 4)."
            exit 1
          fi
          python robot/refresh_prices.py --sheet "$SHEET_URL" --browser
          cat data/price-report.md >> "$GITHUB_STEP_SUMMARY"

      - name: Save the new prices
        run: |
          git add data/prices.csv data/price-report.md
          if git diff --cached --quiet; then
            echo "Nothing changed."
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git commit -m "Update prices"
          git push
```

### 4e. Reading the report

Every run saves `data/price-report.md` in your repository, and shows the same report on
the run's page in the **Actions** tab. It lists:

- **Updated tonight**, per store.
- **Needs a look:** prices the robot held back, and why. If a held price is actually
  right, type it into the sheet with today's date; the robot accepts it from then on.
- **New prices, worth a glance once:** the first time the robot reads a link, it has
  nothing to compare with, so check those once.
- **No price yet:** rows that have neither a typed price nor a working link.

The robot saves the report every night even when no price changed. That also keeps
GitHub from pausing it, which it does to scheduled workflows in inactive repositories.

### 4f. When a store refuses the robot

Some store websites block visits from cloud servers like GitHub's. The report then says
"the store refused the visit". You have two options for that store:

- **Keep its rows manual.** Remove the `url` and type the prices yourself.
- **Run the robot from your own computer**, where a Saudi home connection is less likely
  to be refused. Install Python from python.org, open a terminal in the site folder,
  and run:

  ```
  python robot/refresh_prices.py --sheet "YOUR-CSV-LINK" --previous "https://YOUR-SITE-URL/data/prices.csv"
  ```

  Then upload the new `data/prices.csv` and `data/price-report.md` to the `data` folder on
  GitHub (**Add file → Upload files**). It needs nothing else installed. Adding
  `--browser` also reads pages built with JavaScript, after
  `pip install -r robot/requirements.txt` and `python -m playwright install chromium`.

Never try to get around a refusal. A store that blocks automated visits is saying no,
and the robot respects that on purpose. Also check each store's terms of use before you
add its links.

### 4g. Let visitors report prices (optional)

Create a Google Form with five questions: product, store, price, pack size, and the date
they saw it. In the form's **Responses** tab, choose **Link to Sheets → Select existing
spreadsheet → Yara prices**. Reports arrive in their own tab, and you copy the good ones
into **Prices**, so nobody can publish a fake price. Put the form's link in `config.js`
as `priceReportUrl` to show a "Seen a different price? Tell us" link on the site.

### 4h. Without the robot

- **Sheet only:** put the CSV link from 4b in `config.js` as `pricesSheetUrl`. The
  website then reads the sheet directly, so typed prices show within minutes.
- **No sheet:** edit `data/prices.csv` in Excel (**Save As → CSV UTF-8**; plain "CSV"
  breaks the Arabic) and upload it to the `data` folder. The columns are the same.

## 5. Change the words

Every word on the site is in `i18n.js`: English first, Arabic below it. Change the text
between the quotes, and keep the names before the colons the same in both languages.
You can edit files directly on GitHub: open the file and click the pencil icon.

## 6. Recipes and the week plan

`data/recipes.js` holds 15 recipes in English and Arabic: 10 of Yara's own and 5 adapted
from the U.S. Department of Agriculture's MyPlate Kitchen (public domain), via MyPlate.food.
Each adapted recipe shows a credit line and a link to the original; keep those if you edit it.

Every recipe has its meal (breakfast, lunch, dinner, snack), protein per serving, and a
`uses` list that links its ingredients to the price list. The site costs each recipe from
that list with today's best prices, so costs update by themselves when prices change.

`data/week.js` is the 7-day plan. Each day lists one recipe per meal; the site adds up
protein and cost for each day and for the week.

After changing recipes or prices, rebuild the chatbot's knowledge files (part 7).

Yara's own recipes are drafts: cook each one and fix the amounts before you share the
site. Their protein is estimated from the ingredients; the adapted USDA recipes use the
original recipe's published nutrition figures.

## 7. Connect the chatbot

**Knowledge files.** `knowledge/yara-recipe-index.md`, `yara-recipes.md`,
`yara-ingredients.md` and `yara-prices-by-store.md` are built from the site's own data.
Upload all four to a Dify Knowledge base, with the chunk settings in
`knowledge/dify-prices.md`. Rebuild them after
changing prices or recipes:

```
python tools/build_knowledge.py
```

Add `--pdf some-folder` to also make the designed PDF versions (needs
`pip install playwright` and `python -m playwright install chromium`). Use the PDFs for
reading and sharing, and the Markdown files for Dify: Arabic text inside PDFs usually comes
out scrambled when a chatbot reads it.

**Live prices.** 
Follow `knowledge/dify-prices.md`. It builds the Dify flow that reads the same price file
as the website on every message, so the bot and the website always agree on prices. When the bot
is ready, click **Publish → Embed Into Site** in Dify, copy the link inside `src="..."`,
and paste it into `config.js` as `difyChatUrl`.

Until then, the chat window shows a "Yara is getting an upgrade" message instead of
setup instructions.

The example questions and **Ask Yara about this basket** copy the question to the
clipboard, and the chat window tells visitors to paste it. The chat runs inside Dify's
frame, so the site can't type into it directly.

## 8. Preview on your computer

Double-clicking `index.html` shows most of the page, but browsers block the price sheet
for files opened from disk. To preview everything, either:

- In VS Code, install the **Live Server** extension, right-click `index.html`, and choose
  **Open with Live Server**, or
- In a terminal inside the folder, run `python -m http.server` and open
  `http://localhost:8000`.

Or just upload to GitHub and check the live site.

## 9. Before you share it on LinkedIn

- [ ] Google Sheet published, and a few protein values confirmed against real labels
- [ ] Price robot run once from the Actions tab, and its report read
- [ ] Credits and year checked in `config.js`
- [ ] In `index.html`, replace `YOUR-SITE-URL` (2 places) with your live address so
      LinkedIn shows the preview image. Test it with LinkedIn's Post Inspector.
- [ ] Every recipe cooked and checked
- [ ] Site opened on your phone, in both languages
- [ ] Chatbot link added, or the "coming soon" message left in place on purpose

## Credits

Named after Yara, the creator behind [The Saudi Vegan](https://thesaudivegan.com).
Built by Luminous Logic at KFUPM.
