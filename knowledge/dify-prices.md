# Connect the chatbot to the live prices (Dify)

The bot reads the same price file as the website, `data/prices.csv`, on every message, so
it always quotes exactly what the website shows. The price robot refreshes that file every
night. You never upload prices to Dify, and there are no PDFs to redo.

```
Start → HTTP Request → Code → LLM → Answer
        (get prices)  (price table)
```

## Build the flow (about 10 minutes)

In Dify: **Studio → Create from Blank → Chatflow**, name it **Yara**. A blank chatflow
starts as Start → LLM → Answer. Add two nodes between Start and LLM:

1. **HTTP Request** (rename it *Get prices*)
   - Method: **GET**
   - URL: `https://YOUR-SITE-URL/data/prices.csv` (your live site's address, then
     `/data/prices.csv`)
   - Leave the other settings as they are.

2. **Code** (rename it *Price table*)
   - Language: **Python 3**
   - Input variable: name it `body` and set it to *Get prices → body*
   - Replace the sample code with everything in `price_table.py` (this folder)
   - Output variables: `price_table` (String) and `today` (String)

3. **LLM**
   - Choose your model. Dify's free credits run out after 200 messages; before you share
     the bot, add your own API key and set a spending limit with that provider.
   - Paste the prompt below into the **System** box. Where it says `{{price_table}}`,
     delete that text and insert the *Price table → price_table* variable with Dify's
     variable picker instead.
   - Turn on **Memory** so Yara remembers earlier messages in the conversation.

4. **Answer**: set it to show the LLM's text.

Click **Preview** and ask "What's the cheapest protein?" and "كم سعر الطحينة؟". Yara
should answer from the list, name the store, and give the date. Then **Publish → Embed
Into Site**, copy the link inside `src="..."`, and paste it into `config.js` as
`difyChatUrl`.

## The price part of Yara's instructions

```
You are Yara, a warm and practical plant-based food assistant for people in Saudi Arabia.
Reply in the language the user writes in, Arabic or English.

PRICES
This is today's price list from the Yara price sheet. It is your only source of prices.

{{price_table}}

Price rules:
- Only quote prices that appear in the list. Never estimate, remember or invent a price.
- Whenever you give a price, name the store and the date it was checked.
- If a row says OLD PRICE, say the price may have changed and suggest checking the shelf.
- For "most protein for my money" questions, rank by the g/SAR column. Don't calculate it yourself.
- For budget questions, add up the listed prices and show the total.
- If a product isn't in the list, say you don't have a checked price for it yet.
```

This is only the price section. Yara's full personality and the Saudi-situations guide
come next; they go above and below this block.

## Recipes and ingredients

Create a Dify **Knowledge** base and upload `yara-recipe-index.md`, `yara-recipes.md`,
`yara-ingredients.md` and `yara-prices-by-store.md` from this folder (the Markdown files,
not the PDFs: Arabic text inside PDFs usually comes out scrambled for chatbots).

Use these chunk settings so each recipe, ingredient or store list stays in one piece:
**General**, delimiter `###`, maximum chunk length `1000`, overlap `0`. Every `###`
section in these files is written to make sense on its own. Add a **Knowledge Retrieval** node after Start, and set the
LLM node's **Context** to its result. The prices inside those files are a dated snapshot;
add this line to Yara's instructions so the live list always wins:

```
For prices, trust the PRICES list above. Prices inside the knowledge files are an older snapshot.
```

## If something goes wrong

- **Yara says the price sheet is empty or couldn't be read:** open
  `https://YOUR-SITE-URL/data/prices.csv` in a private browser window. If it doesn't
  download a file, check the latest **Refresh prices** run in the Actions tab.
- **Prices look old:** open `data/price-report.md` in your repository; it says which
  stores the robot couldn't read and why.
