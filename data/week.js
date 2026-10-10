/*
 * A week with Yara: every meal is one of the recipes. Lunches marked "leftover"
 * reuse a dish cooked earlier in the week. The site adds up protein and cost per day.
 */
window.YARA_WEEK = [
  {
    "day": 1,
    "meals": [
      {
        "slot": "breakfast",
        "recipe": "foul-tahini"
      },
      {
        "slot": "lunch",
        "recipe": "lentil-kabsa"
      },
      {
        "slot": "dinner",
        "recipe": "chickpea-spinach"
      },
      {
        "slot": "snack",
        "recipe": "hummus"
      }
    ]
  },
  {
    "day": 2,
    "meals": [
      {
        "slot": "breakfast",
        "recipe": "date-oats"
      },
      {
        "slot": "lunch",
        "recipe": "lentil-kabsa",
        "leftover": true
      },
      {
        "slot": "dinner",
        "recipe": "red-beans-rice"
      },
      {
        "slot": "snack",
        "recipe": "roasted-chickpeas"
      }
    ]
  },
  {
    "day": 3,
    "meals": [
      {
        "slot": "breakfast",
        "recipe": "pb-date-toast"
      },
      {
        "slot": "lunch",
        "recipe": "white-bean-salad"
      },
      {
        "slot": "dinner",
        "recipe": "mujaddara"
      },
      {
        "slot": "snack",
        "recipe": "hummus"
      }
    ]
  },
  {
    "day": 4,
    "meals": [
      {
        "slot": "breakfast",
        "recipe": "foul-tahini"
      },
      {
        "slot": "lunch",
        "recipe": "mujaddara",
        "leftover": true
      },
      {
        "slot": "dinner",
        "recipe": "lentil-wraps"
      },
      {
        "slot": "snack",
        "recipe": "roasted-chickpeas"
      }
    ]
  },
  {
    "day": 5,
    "meals": [
      {
        "slot": "breakfast",
        "recipe": "date-oats"
      },
      {
        "slot": "lunch",
        "recipe": "red-beans-rice",
        "leftover": true
      },
      {
        "slot": "dinner",
        "recipe": "freekeh-chickpeas"
      },
      {
        "slot": "snack",
        "recipe": "pb-date-toast"
      }
    ]
  },
  {
    "day": 6,
    "meals": [
      {
        "slot": "breakfast",
        "recipe": "pb-date-toast"
      },
      {
        "slot": "lunch",
        "recipe": "lentil-wraps",
        "leftover": true
      },
      {
        "slot": "dinner",
        "recipe": "chickpea-bowl"
      },
      {
        "slot": "snack",
        "recipe": "roasted-chickpeas"
      }
    ]
  },
  {
    "day": 7,
    "meals": [
      {
        "slot": "breakfast",
        "recipe": "foul-tahini"
      },
      {
        "slot": "lunch",
        "recipe": "lentil-soup"
      },
      {
        "slot": "dinner",
        "recipe": "tahini-wrap"
      },
      {
        "slot": "snack",
        "recipe": "hummus"
      }
    ]
  }
];
