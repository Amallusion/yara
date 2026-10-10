/*
 * Yara settings. Leave a value as "" to switch that feature off.
 */
window.YARA_CONFIG = {
  // Leave this empty when the price robot is on (README, part 4): the site then reads
  // data/prices.csv, which the robot updates every night.
  // Only without the robot: your Google Sheet's "Publish to the web" CSV link, so the site
  // reads the sheet directly (it falls back to data/prices.csv if that fails).
  pricesSheetUrl: "",

  // Prices older than this many days are marked "may have changed" on the site.
  staleAfterDays: 60,

  // Optional: a Google Form where visitors can report a price they saw in a store.
  priceReportUrl: "",

  // Your published Dify Web App link, e.g. "https://udify.app/chatbot/AbC123".
  // While this is empty, the chat window shows a friendly "coming soon" message.
  difyChatUrl: "",

  // Where the prices were collected. Shown under the price sections.
  // Example: { en: "Dhahran and Al Khobar", ar: "الظهران والخبر" }
  priceArea: { en: "", ar: "" },

  // Credit line under the dedication and in the footer. Add the year once you've confirmed it.
  credits: {
    en: "Luminous Logic · Mohamd Bremo · KFUPM",
    ar: "Luminous Logic · Mohamd Bremo · جامعة الملك فهد للبترول والمعادن"
  },

  // Link to the project's code, e.g. "https://github.com/your-name/yara". Leave "" to hide.
  githubUrl: "https://github.com/YOUR-USERNAME/yara",

  // Your live site address, printed at the bottom of the recipe guide.
  siteUrl: "https://YOUR-USERNAME.github.io/yara/"
};
