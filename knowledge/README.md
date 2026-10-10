# The chatbot's knowledge

Everything Yara the chatbot knows lives in this folder or in the price file, so it can't
disappear with a free trial again.

| What | Where it lives | Status |
| --- | --- | --- |
| Prices, stores, pack sizes, protein | `data/prices.csv`, made every night by the price robot from your Google Sheet. The bot reads it on every message; see `dify-prices.md`. | Ready once the robot has run |
| Price table script | `price_table.py`, pasted into Dify's Code node | Ready |
| Price rules for the bot | `dify-prices.md` | Ready |
| Recipe index: every recipe name, for "give me recipes" questions | `yara-recipe-index.md` (built by `tools/build_knowledge.py`) | Ready |
| Recipes and the 7-day plan, in both languages | `yara-recipes.md` (built by `tools/build_knowledge.py`) | Ready |
| Ingredients: names in both languages, protein, cooking, label checks, prices | `yara-ingredients.md` (built by `tools/build_knowledge.py`) | Ready |
| Prices grouped by store, one self-contained line per product | `yara-prices-by-store.md` (built by `tools/build_knowledge.py`) | Ready |
| Notes behind the ingredients guide | `ingredient-notes.json` | Edit freely, then rebuild |
| Yara's full personality and rules | `bot-instructions.md` | To write |
| Saudi situations: kabsa invitations, Ramadan iftar, campus food, eating out | `saudi-situations.md` | To write |

Things that rarely change (recipes, situations) go into a Dify Knowledge base as `.md`
files. Things that change (prices) come from the sheet and the robot, so there's only ever one
copy to update.

This repository is public, so only add content you have the right to publish. If
anything comes from The Saudi Vegan, ask her first.
