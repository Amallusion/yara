/*
 * Yara recipes, in English and Arabic. Generated from one source, so the website,
 * the PDFs and the chatbot's knowledge files always match (see tools/build_knowledge.py).
 *
 * Fields:
 *   meal          breakfast, lunch, dinner, snack
 *   protein       grams per serving; proteinSource is "usda" (the original recipe's
 *                 published USDA panel) or "estimate" (from the ingredients, typical values)
 *   uses          what one batch needs, linked to the price list by id, in grams or ml
 *                 ("count" when a store sells it by the bunch). The site costs each
 *                 recipe from these with today's best prices.
 *   source        for recipes adapted from the USDA's public-domain MyPlate Kitchen,
 *                 via MyPlate.food, with the credit line shown on the site
 */
window.YARA_RECIPES = [
  {
    "id": "lentil-kabsa",
    "meal": [
      "lunch",
      "dinner"
    ],
    "time": 35,
    "servings": 4,
    "tags": [
      "budget",
      "protein"
    ],
    "name": {
      "en": "Lentil kabsa",
      "ar": "كبسة العدس"
    },
    "hero": {
      "en": "Lentils",
      "ar": "عدس"
    },
    "description": {
      "en": "Warm spiced lentils and rice with tomato, lemon, and fresh herbs.",
      "ar": "عدس وأرز بتوابل الكبسة مع الطماطم والليمون والأعشاب الطازجة."
    },
    "ingredients": {
      "en": [
        "1 cup brown lentils (about 190 g)",
        "1 cup basmati rice (about 185 g)",
        "About 2 cups water",
        "2 tbsp vegetable oil",
        "1 onion, sliced",
        "2 tomatoes, chopped",
        "1 tbsp kabsa spice, 1 tsp cumin, lemon, and fresh coriander"
      ],
      "ar": [
        "كوب عدس بني (نحو 190 جم)",
        "كوب أرز بسمتي (نحو 185 جم)",
        "نحو كوبين من الماء",
        "ملعقتان كبيرتان زيت نباتي",
        "بصلة مقطعة شرائح",
        "حبتا طماطم مقطعتان",
        "ملعقة كبيرة بهارات كبسة، وملعقة صغيرة كمون، وليمون، وكزبرة خضراء"
      ]
    },
    "steps": {
      "en": [
        "Cook the lentils until tender, then drain.",
        "Brown the onion in the oil with the spices, then add the tomatoes.",
        "Add the rice, lentils, and water. Cover and simmer until the rice is tender.",
        "Finish with lemon and coriander."
      ],
      "ar": [
        "اسلق العدس حتى ينضج ثم صفّه.",
        "حمّر البصل في الزيت مع البهارات ثم أضف الطماطم.",
        "أضف الأرز والعدس والماء، ثم غطِّ القدر واتركه على نار هادئة حتى ينضج الأرز.",
        "قدّمه مع الليمون والكزبرة."
      ]
    },
    "uses": [
      {
        "id": "lentils-brown",
        "grams": 190
      },
      {
        "id": "rice-basmati",
        "grams": 185
      },
      {
        "id": "vegetable-oil",
        "grams": 30
      },
      {
        "id": "onion",
        "grams": 150
      },
      {
        "id": "tomato",
        "grams": 240
      },
      {
        "id": "cumin",
        "grams": 2
      },
      {
        "id": "lemon",
        "grams": 50
      },
      {
        "id": "coriander",
        "grams": 30,
        "count": 1
      }
    ],
    "protein": 16.2,
    "proteinSource": "estimate"
  },
  {
    "id": "chickpea-bowl",
    "meal": [
      "lunch",
      "dinner"
    ],
    "time": 25,
    "servings": 2,
    "tags": [
      "budget",
      "protein"
    ],
    "name": {
      "en": "Chickpea kabsa bowl",
      "ar": "طبق الحمص بنكهة الكبسة"
    },
    "hero": {
      "en": "Chickpeas",
      "ar": "حمص"
    },
    "description": {
      "en": "A fast pantry bowl for nights when you want something filling without a long shopping list.",
      "ar": "طبق سريع من مكونات المطبخ، للأيام التي تريد فيها وجبة مشبعة دون قائمة تسوق طويلة."
    },
    "ingredients": {
      "en": [
        "1 can chickpeas (about 380 g), rinsed",
        "1 cup cooked rice",
        "1 bell pepper, sliced",
        "1 tbsp vegetable oil",
        "1 tbsp tomato paste and 1 tsp kabsa spice",
        "Tahini-lemon sauce: 2 tbsp tahini, juice of half a lemon, a little water"
      ],
      "ar": [
        "علبة حمص (نحو 380 جم) مصفّاة ومغسولة",
        "كوب أرز مطبوخ",
        "حبة فلفل رومي مقطعة شرائح",
        "ملعقة كبيرة زيت نباتي",
        "ملعقة كبيرة معجون طماطم وملعقة صغيرة بهارات كبسة",
        "صلصة الطحينة: ملعقتان كبيرتان طحينة، وعصير نصف ليمونة، وقليل من الماء"
      ]
    },
    "steps": {
      "en": [
        "Sauté the pepper in the oil with the tomato paste and spices.",
        "Fold in the chickpeas and warm through.",
        "Whisk the tahini with lemon and water until smooth.",
        "Serve over rice with the tahini-lemon sauce."
      ],
      "ar": [
        "قلّب الفلفل في الزيت مع معجون الطماطم والبهارات.",
        "أضف الحمص وقلّبه حتى يسخن.",
        "اخفق الطحينة مع الليمون والماء حتى تصبح ناعمة.",
        "قدّمه فوق الأرز مع صلصة الطحينة بالليمون."
      ]
    },
    "uses": [
      {
        "id": "chickpeas-canned",
        "grams": 380
      },
      {
        "id": "rice-basmati",
        "grams": 60
      },
      {
        "id": "bell-pepper",
        "grams": 150
      },
      {
        "id": "vegetable-oil",
        "grams": 15
      },
      {
        "id": "tomato-paste",
        "grams": 16
      },
      {
        "id": "tahini",
        "grams": 30
      },
      {
        "id": "lemon",
        "grams": 50
      }
    ],
    "protein": 15.6,
    "proteinSource": "estimate"
  },
  {
    "id": "foul-tahini",
    "meal": [
      "breakfast"
    ],
    "time": 15,
    "servings": 2,
    "tags": [
      "budget",
      "protein"
    ],
    "name": {
      "en": "Foul with tahini and herbs",
      "ar": "فول بالطحينة والأعشاب"
    },
    "hero": {
      "en": "Foul",
      "ar": "فول"
    },
    "description": {
      "en": "A simple breakfast or light dinner with lemon, cumin, and a creamy tahini finish.",
      "ar": "فطور بسيط أو عشاء خفيف بالليمون والكمون، مع لمسة كريمية من الطحينة."
    },
    "ingredients": {
      "en": [
        "1 can foul medames (about 400 g)",
        "1 garlic clove, crushed",
        "Lemon juice and cumin",
        "1 tbsp tahini",
        "Tomato, parsley, and 2 Arabic breads"
      ],
      "ar": [
        "علبة فول مدمس (نحو 400 جم)",
        "فص ثوم مهروس",
        "عصير ليمون وكمون",
        "ملعقة كبيرة طحينة",
        "طماطم وبقدونس ورغيفا خبز عربي"
      ]
    },
    "steps": {
      "en": [
        "Warm the foul with the garlic, lemon, and cumin.",
        "Mash lightly, keeping some texture.",
        "Top with tahini, tomato, and parsley, and serve with the bread."
      ],
      "ar": [
        "سخّن الفول مع الثوم والليمون والكمون.",
        "اهرسه قليلًا مع ترك بعض القوام.",
        "زيّنه بالطحينة والطماطم والبقدونس، وقدّمه مع الخبز."
      ]
    },
    "uses": [
      {
        "id": "foul-canned",
        "grams": 400
      },
      {
        "id": "garlic",
        "grams": 5
      },
      {
        "id": "lemon",
        "grams": 50
      },
      {
        "id": "cumin",
        "grams": 2
      },
      {
        "id": "tahini",
        "grams": 15
      },
      {
        "id": "tomato",
        "grams": 120
      },
      {
        "id": "parsley",
        "grams": 30,
        "count": 1
      },
      {
        "id": "bread-arabic",
        "grams": 170
      }
    ],
    "protein": 21.5,
    "proteinSource": "estimate"
  },
  {
    "id": "mujaddara",
    "meal": [
      "lunch",
      "dinner"
    ],
    "time": 45,
    "servings": 4,
    "tags": [
      "budget",
      "protein"
    ],
    "name": {
      "en": "Mujaddara with cucumber salad",
      "ar": "مجدرة مع سلطة الخيار"
    },
    "hero": {
      "en": "Mujaddara",
      "ar": "مجدرة"
    },
    "description": {
      "en": "Lentils, rice, and caramelized onion with a bright cucumber and mint salad.",
      "ar": "عدس وأرز مع بصل مكرمل، وسلطة خيار منعشة بالنعناع."
    },
    "ingredients": {
      "en": [
        "1 cup green or brown lentils",
        "1 cup rice",
        "About 2 cups water",
        "3 onions, thinly sliced",
        "3 tbsp olive oil, cumin, and black pepper",
        "Cucumber, mint, and lemon for the salad"
      ],
      "ar": [
        "كوب عدس أخضر أو بني",
        "كوب أرز",
        "نحو كوبين من الماء",
        "3 بصلات مقطعة شرائح رفيعة",
        "3 ملاعق كبيرة زيت زيتون، وكمون، وفلفل أسود",
        "خيار ونعناع وليمون للسلطة"
      ]
    },
    "steps": {
      "en": [
        "Cook the lentils until nearly tender.",
        "Caramelize the onions slowly in olive oil until deep golden.",
        "Add the rice, lentils, spices, and water. Cover and simmer until the rice is tender.",
        "Top with the onions and serve with the cucumber-mint salad."
      ],
      "ar": [
        "اسلق العدس حتى يقارب النضج.",
        "حمّر البصل ببطء في زيت الزيتون حتى يصبح ذهبيًا غامقًا.",
        "أضف الأرز والعدس والبهارات والماء، ثم غطِّ القدر واتركه على نار هادئة حتى ينضج الأرز.",
        "زيّنه بالبصل، وقدّمه مع سلطة الخيار بالنعناع."
      ]
    },
    "uses": [
      {
        "id": "lentils-brown",
        "grams": 190
      },
      {
        "id": "rice-basmati",
        "grams": 185
      },
      {
        "id": "onion",
        "grams": 450
      },
      {
        "id": "olive-oil",
        "grams": 45
      },
      {
        "id": "cumin",
        "grams": 2
      },
      {
        "id": "black-pepper",
        "grams": 1
      },
      {
        "id": "cucumber",
        "grams": 300
      },
      {
        "id": "mint",
        "grams": 30,
        "count": 1
      },
      {
        "id": "lemon",
        "grams": 50
      }
    ],
    "protein": 17.2,
    "proteinSource": "estimate"
  },
  {
    "id": "date-oats",
    "meal": [
      "breakfast"
    ],
    "time": 5,
    "servings": 1,
    "tags": [
      "budget"
    ],
    "timeNote": {
      "en": "+ overnight soak",
      "ar": "+ نقع ليلة كاملة"
    },
    "name": {
      "en": "Date and tahini overnight oats",
      "ar": "شوفان منقوع بالتمر والطحينة"
    },
    "hero": {
      "en": "Dates",
      "ar": "تمر"
    },
    "description": {
      "en": "A no-cook breakfast with dates, oats, tahini, and plant milk.",
      "ar": "فطور بلا طبخ من الشوفان والتمر والطحينة والحليب النباتي."
    },
    "ingredients": {
      "en": [
        "½ cup rolled oats",
        "1 cup unsweetened plant milk",
        "2 dates, chopped",
        "1 tbsp tahini",
        "Cardamom and sesame seeds"
      ],
      "ar": [
        "نصف كوب شوفان",
        "كوب حليب نباتي غير محلّى",
        "حبتا تمر مقطعتان",
        "ملعقة كبيرة طحينة",
        "هيل وسمسم"
      ]
    },
    "steps": {
      "en": [
        "Mix everything in a jar.",
        "Refrigerate for at least 4 hours, or overnight.",
        "Loosen with a splash of milk before serving if needed."
      ],
      "ar": [
        "اخلط جميع المكونات في برطمان.",
        "ضعه في الثلاجة 4 ساعات على الأقل، أو طوال الليل.",
        "أضف قليلًا من الحليب قبل التقديم إذا احتاج."
      ]
    },
    "uses": [
      {
        "id": "oats",
        "grams": 45
      },
      {
        "id": "almond-milk",
        "grams": 240
      },
      {
        "id": "dates",
        "grams": 20
      },
      {
        "id": "tahini",
        "grams": 15
      },
      {
        "id": "cardamom",
        "grams": 0.5
      },
      {
        "id": "sesame",
        "grams": 3
      }
    ],
    "protein": 10.6,
    "proteinSource": "estimate"
  },
  {
    "id": "tahini-wrap",
    "meal": [
      "lunch"
    ],
    "time": 30,
    "servings": 2,
    "tags": [
      "budget"
    ],
    "name": {
      "en": "Roasted vegetable tahini wrap",
      "ar": "لفائف الخضار المشوية بالطحينة"
    },
    "hero": {
      "en": "Tahini",
      "ar": "طحينة"
    },
    "description": {
      "en": "Roasted vegetables, chickpeas, and tahini in warm flatbread.",
      "ar": "خضار مشوية وحمص وطحينة في خبز دافئ."
    },
    "ingredients": {
      "en": [
        "2 whole-wheat flatbreads or tortillas",
        "1½ cups chickpeas (most of a can)",
        "1 bell pepper and 1 zucchini",
        "1 tbsp olive oil, cumin, and black pepper",
        "Tahini, lemon, and garlic",
        "Parsley and pickles"
      ],
      "ar": [
        "رغيفا خبز قمح كامل أو تورتيلا",
        "كوب ونصف من الحمص (معظم العلبة)",
        "حبة فلفل رومي وحبة كوسة",
        "ملعقة كبيرة زيت زيتون، وكمون، وفلفل أسود",
        "طحينة وليمون وثوم",
        "بقدونس ومخلل"
      ]
    },
    "steps": {
      "en": [
        "Roast the vegetables with the oil, cumin, and black pepper.",
        "Whisk the tahini with lemon, garlic, and a little water into a sauce.",
        "Fill the bread with the vegetables, chickpeas, sauce, and herbs."
      ],
      "ar": [
        "اشوِ الخضار مع الزيت والكمون والفلفل الأسود.",
        "اخفق الطحينة مع الليمون والثوم وقليل من الماء حتى تصبح صلصة.",
        "احشُ الخبز بالخضار والحمص والصلصة والأعشاب."
      ]
    },
    "uses": [
      {
        "id": "tortilla-brown",
        "grams": 84
      },
      {
        "id": "chickpeas-canned",
        "grams": 250
      },
      {
        "id": "bell-pepper",
        "grams": 150
      },
      {
        "id": "zucchini",
        "grams": 200
      },
      {
        "id": "olive-oil",
        "grams": 15
      },
      {
        "id": "tahini",
        "grams": 30
      },
      {
        "id": "lemon",
        "grams": 50
      },
      {
        "id": "garlic",
        "grams": 5
      },
      {
        "id": "parsley",
        "grams": 30,
        "count": 1
      }
    ],
    "protein": 15.3,
    "proteinSource": "estimate"
  },
  {
    "id": "pb-date-toast",
    "meal": [
      "breakfast",
      "snack"
    ],
    "time": 5,
    "servings": 1,
    "tags": [
      "budget",
      "protein"
    ],
    "name": {
      "en": "Peanut butter and date toast",
      "ar": "خبز محمص بزبدة الفول السوداني والتمر"
    },
    "hero": {
      "en": "Peanut",
      "ar": "فول سوداني"
    },
    "description": {
      "en": "Five minutes, three ingredients, and about 15 grams of protein.",
      "ar": "خمس دقائق، وثلاثة مكونات، ونحو 15 جرامًا من البروتين."
    },
    "ingredients": {
      "en": [
        "1 Arabic bread or 2 slices of bread",
        "2 tbsp peanut butter",
        "2 dates, chopped",
        "A pinch of cinnamon"
      ],
      "ar": [
        "رغيف خبز عربي أو شريحتا خبز",
        "ملعقتان كبيرتان زبدة فول سوداني",
        "حبتا تمر مقطعتان",
        "رشة قرفة"
      ]
    },
    "steps": {
      "en": [
        "Toast the bread.",
        "Spread with peanut butter.",
        "Top with the dates and a pinch of cinnamon."
      ],
      "ar": [
        "حمّص الخبز.",
        "ادهنه بزبدة الفول السوداني.",
        "وزّع التمر فوقه مع رشة قرفة."
      ]
    },
    "uses": [
      {
        "id": "bread-arabic",
        "grams": 85
      },
      {
        "id": "peanut-butter",
        "grams": 32
      },
      {
        "id": "dates",
        "grams": 20
      }
    ],
    "protein": 15.7,
    "proteinSource": "estimate"
  },
  {
    "id": "freekeh-chickpeas",
    "meal": [
      "lunch",
      "dinner"
    ],
    "time": 40,
    "servings": 4,
    "tags": [
      "protein"
    ],
    "name": {
      "en": "Freekeh with chickpeas and parsley",
      "ar": "فريكة بالحمص والبقدونس"
    },
    "hero": {
      "en": "Freekeh",
      "ar": "فريكة"
    },
    "description": {
      "en": "Smoky green wheat with chickpeas, warm spices, lemon, and toasted almonds.",
      "ar": "قمح أخضر مدخّن مع الحمص والبهارات الدافئة والليمون واللوز المحمص."
    },
    "ingredients": {
      "en": [
        "1 cup cracked freekeh (about 170 g), rinsed",
        "1 can chickpeas (about 380 g), rinsed",
        "1 onion, chopped",
        "2 tbsp vegetable oil",
        "1 tsp cumin, ½ tsp black pepper, a pinch of cardamom",
        "2½ cups water and salt",
        "Parsley, lemon, and a handful of toasted almonds"
      ],
      "ar": [
        "كوب فريكة مجروشة (نحو 170 جم) مغسولة",
        "علبة حمص (نحو 380 جم) مصفّاة ومغسولة",
        "بصلة مفرومة",
        "ملعقتان كبيرتان زيت نباتي",
        "ملعقة صغيرة كمون، ونصف ملعقة صغيرة فلفل أسود، ورشة هيل",
        "كوبان ونصف من الماء وملح",
        "بقدونس وليمون وحفنة لوز محمص"
      ]
    },
    "steps": {
      "en": [
        "Soften the onion in the oil until golden.",
        "Stir in the spices and freekeh and toast for a minute.",
        "Add the water and salt, bring to a boil, then cover and simmer for 20 to 25 minutes until tender.",
        "Fold in the chickpeas and warm through for 5 minutes, then rest off the heat.",
        "Finish with parsley, lemon, and almonds."
      ],
      "ar": [
        "قلّب البصل في الزيت حتى يذبل ويصفرّ.",
        "أضف البهارات والفريكة وقلّبها دقيقة.",
        "أضف الماء والملح، واتركه حتى يغلي، ثم غطِّه واتركه على نار هادئة 20 إلى 25 دقيقة حتى تنضج الفريكة.",
        "أضف الحمص وقلّبه 5 دقائق حتى يسخن، ثم ارفعه عن النار واتركه يرتاح.",
        "زيّنه بالبقدونس والليمون واللوز."
      ]
    },
    "uses": [
      {
        "id": "freekeh",
        "grams": 170
      },
      {
        "id": "chickpeas-canned",
        "grams": 380
      },
      {
        "id": "onion",
        "grams": 150
      },
      {
        "id": "vegetable-oil",
        "grams": 30
      },
      {
        "id": "cumin",
        "grams": 2
      },
      {
        "id": "black-pepper",
        "grams": 1
      },
      {
        "id": "cardamom",
        "grams": 0.5
      },
      {
        "id": "parsley",
        "grams": 30,
        "count": 1
      },
      {
        "id": "lemon",
        "grams": 50
      },
      {
        "id": "almonds",
        "grams": 20
      }
    ],
    "protein": 11.8,
    "proteinSource": "estimate"
  },
  {
    "id": "hummus",
    "meal": [
      "snack"
    ],
    "time": 10,
    "servings": 6,
    "tags": [
      "budget"
    ],
    "name": {
      "en": "Smooth hummus",
      "ar": "حمص بالطحينة"
    },
    "hero": {
      "en": "Hummus",
      "ar": "حمص"
    },
    "description": {
      "en": "The everyday dip, made silky by blending the tahini and lemon first.",
      "ar": "الغموس اليومي، ناعم كالحرير لأننا نخفق الطحينة والليمون أولًا."
    },
    "ingredients": {
      "en": [
        "1 can chickpeas (about 380 g), drained, liquid kept",
        "3 tbsp tahini",
        "Juice of 1 lemon",
        "1 garlic clove",
        "½ tsp cumin and salt",
        "Ice water or the can's liquid",
        "Olive oil to finish"
      ],
      "ar": [
        "علبة حمص (نحو 380 جم) مصفّاة مع الاحتفاظ بمائها",
        "3 ملاعق كبيرة طحينة",
        "عصير ليمونة",
        "فص ثوم",
        "نصف ملعقة صغيرة كمون وملح",
        "ماء مثلّج أو ماء العلبة",
        "زيت زيتون للتقديم"
      ]
    },
    "steps": {
      "en": [
        "Blend the tahini, lemon, garlic, and salt until pale and thick.",
        "Add the chickpeas and cumin and blend.",
        "Loosen with ice water or the can's liquid, a spoonful at a time, until smooth.",
        "Serve topped with olive oil and cumin."
      ],
      "ar": [
        "اخلط الطحينة والليمون والثوم والملح حتى يفتح لونها وتتماسك.",
        "أضف الحمص والكمون واخلط.",
        "أضف الماء المثلج أو ماء العلبة ملعقةً ملعقة حتى يصبح ناعمًا.",
        "قدّمه مع زيت الزيتون والكمون."
      ]
    },
    "uses": [
      {
        "id": "chickpeas-canned",
        "grams": 380
      },
      {
        "id": "tahini",
        "grams": 45
      },
      {
        "id": "lemon",
        "grams": 100
      },
      {
        "id": "garlic",
        "grams": 5
      },
      {
        "id": "cumin",
        "grams": 1
      },
      {
        "id": "olive-oil",
        "grams": 14
      }
    ],
    "protein": 4.7,
    "proteinSource": "estimate"
  },
  {
    "id": "roasted-chickpeas",
    "meal": [
      "snack"
    ],
    "time": 40,
    "servings": 4,
    "tags": [
      "budget"
    ],
    "name": {
      "en": "Crunchy roasted chickpeas",
      "ar": "حمص محمص مقرمش"
    },
    "hero": {
      "en": "Crunch",
      "ar": "مقرمش"
    },
    "description": {
      "en": "An oven snack that keeps for two days in an open jar.",
      "ar": "وجبة خفيفة من الفرن تبقى مقرمشة يومين في برطمان مفتوح."
    },
    "ingredients": {
      "en": [
        "1 can chickpeas (about 380 g), drained and rinsed",
        "1 tbsp olive oil",
        "½ tsp cumin, ½ tsp chili powder, and salt"
      ],
      "ar": [
        "علبة حمص (نحو 380 جم) مصفّاة ومغسولة",
        "ملعقة كبيرة زيت زيتون",
        "نصف ملعقة صغيرة كمون، ونصف ملعقة صغيرة شطة، وملح"
      ]
    },
    "steps": {
      "en": [
        "Heat the oven to 200°C.",
        "Pat the chickpeas very dry with a towel.",
        "Toss with the oil and spices.",
        "Roast for 30 to 35 minutes, shaking the tray halfway, until crisp. They crisp more as they cool."
      ],
      "ar": [
        "سخّن الفرن على 200 درجة مئوية.",
        "جفّف الحمص جيدًا بمنشفة.",
        "قلّبه مع الزيت والبهارات.",
        "حمّصه 30 إلى 35 دقيقة مع هزّ الصينية في المنتصف حتى يقرمش. يزداد قرمشة عندما يبرد."
      ]
    },
    "uses": [
      {
        "id": "chickpeas-canned",
        "grams": 380
      },
      {
        "id": "olive-oil",
        "grams": 14
      },
      {
        "id": "cumin",
        "grams": 1
      },
      {
        "id": "chili-powder",
        "grams": 1
      }
    ],
    "protein": 4.8,
    "proteinSource": "estimate"
  },
  {
    "id": "lentil-soup",
    "meal": [
      "lunch",
      "dinner"
    ],
    "time": 60,
    "servings": 6,
    "tags": [
      "budget",
      "protein"
    ],
    "name": {
      "en": "Lentil vegetable soup",
      "ar": "شوربة العدس بالخضار"
    },
    "hero": {
      "en": "Soup",
      "ar": "شوربة"
    },
    "description": {
      "en": "A slow, hearty lentil soup that suits a cold evening or the iftar table.",
      "ar": "شوربة عدس دافئة على نار هادئة، تناسب المساء البارد ومائدة الإفطار."
    },
    "protein": 9.0,
    "calories": 163,
    "proteinSource": "usda",
    "source": {
      "title": "Lentil Vegetable Soup",
      "by": "University of Nebraska–Lincoln, Nebraska Nutrition Education Program",
      "url": "https://myplate.food/recipes/lentil-vegetable-soup",
      "credit": {
        "en": "Adapted for Saudi kitchens by Yara. Original recipe by University of Nebraska–Lincoln, Nebraska Nutrition Education Program, published by the U.S. Department of Agriculture on MyPlate Kitchen (public domain), from the edition preserved by MyPlate.food.",
        "ar": "كيّفتها يارا للمطبخ السعودي. الوصفة الأصلية من University of Nebraska–Lincoln, Nebraska Nutrition Education Program، ونشرتها وزارة الزراعة الأمريكية على MyPlate Kitchen (ملكية عامة)، عن النسخة المحفوظة في MyPlate.food."
      }
    },
    "ingredients": {
      "en": [
        "1 cup dry red or brown lentils (about 190 g), rinsed",
        "5 cups water",
        "2 tbsp vegetable oil",
        "Half an onion, finely chopped",
        "1 cup canned chopped tomatoes, blended",
        "1 garlic clove",
        "1 tsp salt, ¼ tsp black pepper, 1 bay leaf",
        "1 celery stalk, chopped",
        "2 tbsp vinegar, or the juice of half a lemon"
      ],
      "ar": [
        "كوب عدس أحمر أو بني (نحو 190 جم) مغسول",
        "5 أكواب ماء",
        "ملعقتان كبيرتان زيت نباتي",
        "نصف بصلة مفرومة ناعمًا",
        "كوب طماطم معلبة مقطعة ومهروسة",
        "فص ثوم",
        "ملعقة صغيرة ملح، وربع ملعقة صغيرة فلفل أسود، وورقة غار",
        "عود كرفس مقطع",
        "ملعقتان كبيرتان خل، أو عصير نصف ليمونة"
      ]
    },
    "steps": {
      "en": [
        "Put the lentils and water in a deep pot and bring to a boil.",
        "Add everything except the vinegar or lemon, lower the heat, and cover.",
        "Simmer gently, adding water if needed: about 30 minutes for red lentils, up to an hour for brown.",
        "Stir in the vinegar or lemon and remove the bay leaf. Serve with extra lemon and cumin."
      ],
      "ar": [
        "ضع العدس والماء في قدر عميق واتركه حتى يغلي.",
        "أضف كل المكونات عدا الخل أو الليمون، وخفّف النار وغطِّ القدر.",
        "اتركه على نار هادئة مع إضافة الماء عند الحاجة: نحو 30 دقيقة للعدس الأحمر، وحتى ساعة للبني.",
        "أضف الخل أو الليمون وأخرج ورقة الغار. قدّمها مع ليمون وكمون إضافيين."
      ]
    },
    "uses": [
      {
        "id": "lentils-red",
        "grams": 190
      },
      {
        "id": "vegetable-oil",
        "grams": 30
      },
      {
        "id": "onion",
        "grams": 75
      },
      {
        "id": "tomatoes-canned",
        "grams": 250
      },
      {
        "id": "garlic",
        "grams": 5
      },
      {
        "id": "black-pepper",
        "grams": 0.5
      },
      {
        "id": "celery",
        "grams": 40
      },
      {
        "id": "lemon",
        "grams": 50
      }
    ],
    "swaps": {
      "en": "We use canned chopped tomatoes because tomato sauce is less common here, and lemon works instead of vinegar.",
      "ar": "استخدمنا الطماطم المعلبة لأن صلصة الطماطم أقل شيوعًا هنا، ويصلح الليمون بدل الخل."
    }
  },
  {
    "id": "lentil-wraps",
    "meal": [
      "lunch",
      "dinner"
    ],
    "time": 45,
    "servings": 6,
    "tags": [
      "budget",
      "protein"
    ],
    "name": {
      "en": "Spiced lentil wraps",
      "ar": "لفائف العدس المتبّل"
    },
    "hero": {
      "en": "Wraps",
      "ar": "لفائف"
    },
    "description": {
      "en": "Lentils simmered with pepper, garlic, cumin, and tomato, rolled in warm bread.",
      "ar": "عدس مطبوخ مع الفلفل والثوم والكمون والطماطم، ملفوف في خبز دافئ."
    },
    "protein": 14.2,
    "calories": 193,
    "proteinSource": "usda",
    "nutritionNote": "filling",
    "source": {
      "title": "Lentil Tacos",
      "by": "Washington State WIC Program",
      "url": "https://myplate.food/recipes/lentil-tacos",
      "credit": {
        "en": "Adapted for Saudi kitchens by Yara. Original recipe by Washington State WIC Program, published by the U.S. Department of Agriculture on MyPlate Kitchen (public domain), from the edition preserved by MyPlate.food.",
        "ar": "كيّفتها يارا للمطبخ السعودي. الوصفة الأصلية من Washington State WIC Program، ونشرتها وزارة الزراعة الأمريكية على MyPlate Kitchen (ملكية عامة)، عن النسخة المحفوظة في MyPlate.food."
      }
    },
    "ingredients": {
      "en": [
        "1½ cups dry brown lentils (about 285 g), rinsed",
        "4 cups water",
        "Half a green bell pepper, chopped",
        "4 garlic cloves, minced",
        "1 tsp chili powder, 1 tsp cumin, ½ tsp dried basil, chili flakes to taste",
        "⅔ cup tomato paste",
        "¼ cup raisins (optional)",
        "6 tortillas or Arabic breads to serve"
      ],
      "ar": [
        "كوب ونصف عدس بني (نحو 285 جم) مغسول",
        "4 أكواب ماء",
        "نصف حبة فلفل رومي أخضر مقطعة",
        "4 فصوص ثوم مفرومة",
        "ملعقة صغيرة شطة، وملعقة صغيرة كمون، ونصف ملعقة صغيرة ريحان مجفف، وشطة مجروشة حسب الرغبة",
        "ثلثا كوب معجون طماطم",
        "ربع كوب زبيب (اختياري)",
        "6 أرغفة تورتيلا أو خبز عربي للتقديم"
      ]
    },
    "steps": {
      "en": [
        "Cook the lentils in 3 cups of the water for 10 minutes.",
        "Add everything else and simmer for 30 minutes, adding water if it gets dry.",
        "Spoon into warm tortillas or Arabic bread, or serve over rice."
      ],
      "ar": [
        "اطبخ العدس في 3 أكواب من الماء 10 دقائق.",
        "أضف باقي المكونات واتركه على نار هادئة 30 دقيقة، مع إضافة الماء إذا جفّ.",
        "ضعه في خبز تورتيلا أو خبز عربي دافئ، أو قدّمه فوق الأرز."
      ]
    },
    "uses": [
      {
        "id": "lentils-brown",
        "grams": 285
      },
      {
        "id": "bell-pepper",
        "grams": 75
      },
      {
        "id": "garlic",
        "grams": 20
      },
      {
        "id": "chili-powder",
        "grams": 2
      },
      {
        "id": "cumin",
        "grams": 2
      },
      {
        "id": "tomato-paste",
        "grams": 170
      },
      {
        "id": "tortilla-brown",
        "grams": 250
      }
    ],
    "swaps": {
      "en": "The original serves this in corn tortillas; Arabic bread or brown tortillas from Saudi shops work just as well.",
      "ar": "تُقدَّم الوصفة الأصلية في تورتيلا الذرة، ويصلح الخبز العربي أو التورتيلا السمراء المتوفرة هنا بالقدر نفسه."
    }
  },
  {
    "id": "white-bean-salad",
    "meal": [
      "lunch"
    ],
    "time": 20,
    "servings": 4,
    "tags": [
      "protein"
    ],
    "name": {
      "en": "Garden white bean salad",
      "ar": "سلطة الفاصوليا البيضاء بالخضار"
    },
    "hero": {
      "en": "Beans",
      "ar": "فاصوليا"
    },
    "description": {
      "en": "White beans, crunchy vegetables, and toasted almonds with a lemon and date-syrup dressing.",
      "ar": "فاصوليا بيضاء وخضار مقرمشة ولوز محمص مع صلصة الليمون ودبس التمر."
    },
    "protein": 20.2,
    "calories": 409,
    "proteinSource": "usda",
    "source": {
      "title": "Garden Cannellini Bean Salad",
      "by": "Produce for Better Health Foundation",
      "url": "https://myplate.food/recipes/garden-cannellini-bean-salad",
      "credit": {
        "en": "Adapted for Saudi kitchens by Yara. Original recipe by Produce for Better Health Foundation, published by the U.S. Department of Agriculture on MyPlate Kitchen (public domain), from the edition preserved by MyPlate.food.",
        "ar": "كيّفتها يارا للمطبخ السعودي. الوصفة الأصلية من Produce for Better Health Foundation، ونشرتها وزارة الزراعة الأمريكية على MyPlate Kitchen (ملكية عامة)، عن النسخة المحفوظة في MyPlate.food."
      }
    },
    "ingredients": {
      "en": [
        "Dressing: 1 tbsp olive oil, 2 tsp vinegar, juice of half a lemon, 1 tbsp date syrup, dried basil and garlic powder",
        "½ cup slivered almonds",
        "2 tomatoes, chopped",
        "Half a bell pepper, chopped",
        "Half a cucumber, chopped",
        "3 green onions, sliced",
        "2 cans white beans (about 380 g each), drained and rinsed",
        "Lettuce leaves to serve"
      ],
      "ar": [
        "الصلصة: ملعقة كبيرة زيت زيتون، وملعقتان صغيرتان خل، وعصير نصف ليمونة، وملعقة كبيرة دبس تمر، وريحان مجفف وثوم بودرة",
        "نصف كوب لوز مقطع أصابع",
        "حبتا طماطم مقطعتان",
        "نصف حبة فلفل رومي مقطعة",
        "نصف حبة خيار مقطعة",
        "3 أعواد بصل أخضر مقطعة",
        "علبتا فاصوليا بيضاء (نحو 380 جم لكل علبة) مصفّاة ومغسولة",
        "أوراق خس للتقديم"
      ]
    },
    "steps": {
      "en": [
        "Whisk the dressing in a small bowl.",
        "Toast the almonds in a dry pan until golden, then let them cool.",
        "Toss everything except the lettuce with the dressing and chill until serving.",
        "Spoon onto lettuce leaves."
      ],
      "ar": [
        "اخفق مكونات الصلصة في وعاء صغير.",
        "حمّص اللوز في مقلاة جافة حتى يصفرّ، ثم اتركه يبرد.",
        "اخلط كل المكونات عدا الخس مع الصلصة، وضعها في الثلاجة حتى التقديم.",
        "قدّمها فوق أوراق الخس."
      ]
    },
    "uses": [
      {
        "id": "olive-oil",
        "grams": 14
      },
      {
        "id": "vinegar",
        "grams": 10
      },
      {
        "id": "lemon",
        "grams": 50
      },
      {
        "id": "date-syrup",
        "grams": 20
      },
      {
        "id": "almonds",
        "grams": 55
      },
      {
        "id": "tomato",
        "grams": 240
      },
      {
        "id": "bell-pepper",
        "grams": 75
      },
      {
        "id": "cucumber",
        "grams": 150
      },
      {
        "id": "green-onion",
        "grams": 40,
        "count": 1
      },
      {
        "id": "white-beans-canned",
        "grams": 760
      }
    ],
    "swaps": {
      "en": "The original dressing uses apple juice; we sweeten it with a spoon of date syrup instead.",
      "ar": "تستخدم الصلصة الأصلية عصير التفاح، وحلّيناها نحن بملعقة من دبس التمر."
    }
  },
  {
    "id": "chickpea-spinach",
    "meal": [
      "dinner"
    ],
    "time": 35,
    "servings": 4,
    "tags": [
      "protein"
    ],
    "name": {
      "en": "Chickpeas and spinach sauté",
      "ar": "حمص مع السبانخ"
    },
    "hero": {
      "en": "Spinach",
      "ar": "سبانخ"
    },
    "description": {
      "en": "Soft vegetables, tomatoes, chickpeas, and wilted spinach in one pan. Any beans and greens work.",
      "ar": "خضار طرية وطماطم وحمص وسبانخ ذابلة في مقلاة واحدة. تصلح أي بقوليات مع أي خضار ورقية."
    },
    "protein": 9.7,
    "calories": 193,
    "proteinSource": "usda",
    "source": {
      "title": "Chickpeas and Spinach Sauté",
      "by": "USDA Center for Nutrition Policy and Promotion",
      "url": "https://myplate.food/recipes/chickpeas-and-spinach-saute",
      "credit": {
        "en": "Adapted for Saudi kitchens by Yara. Original recipe by USDA Center for Nutrition Policy and Promotion, published by the U.S. Department of Agriculture on MyPlate Kitchen (public domain), from the edition preserved by MyPlate.food.",
        "ar": "كيّفتها يارا للمطبخ السعودي. الوصفة الأصلية من USDA Center for Nutrition Policy and Promotion، ونشرتها وزارة الزراعة الأمريكية على MyPlate Kitchen (ملكية عامة)، عن النسخة المحفوظة في MyPlate.food."
      }
    },
    "ingredients": {
      "en": [
        "1 tbsp vegetable oil",
        "1 onion, chopped",
        "1 garlic clove, minced",
        "1 celery stalk, chopped",
        "1 carrot, chopped",
        "1 can chopped tomatoes (about 400 g)",
        "1 can chickpeas (about 380 g), drained and rinsed",
        "¼ cup water",
        "About 300 g spinach (frozen, or 2 fresh bunches)",
        "1 tsp lemon juice and a pinch of chili flakes"
      ],
      "ar": [
        "ملعقة كبيرة زيت نباتي",
        "بصلة مفرومة",
        "فص ثوم مفروم",
        "عود كرفس مقطع",
        "حبة جزر مقطعة",
        "علبة طماطم مقطعة (نحو 400 جم)",
        "علبة حمص (نحو 380 جم) مصفّاة ومغسولة",
        "ربع كوب ماء",
        "نحو 300 جم سبانخ (مجمدة، أو ربطتان طازجتان)",
        "ملعقة صغيرة عصير ليمون ورشة شطة مجروشة"
      ]
    },
    "steps": {
      "en": [
        "Heat the oil and cook the onion, garlic, celery, and carrot for about 15 minutes until soft and lightly browned.",
        "Turn up the heat, add the tomatoes, chickpeas, and water, and cook for 5 minutes.",
        "Lower the heat, pile the spinach on top, cover, and cook for about 10 minutes.",
        "Stir in the lemon and chili. Serve with rice or quinoa."
      ],
      "ar": [
        "سخّن الزيت واطبخ البصل والثوم والكرفس والجزر نحو 15 دقيقة حتى تطرى وتتحمّر قليلًا.",
        "ارفع النار وأضف الطماطم والحمص والماء، واطبخها 5 دقائق.",
        "خفّف النار وضع السبانخ فوقها، ثم غطِّها واطبخها نحو 10 دقائق.",
        "أضف الليمون والشطة وقلّب. قدّمه مع الأرز أو الكينوا."
      ]
    },
    "uses": [
      {
        "id": "vegetable-oil",
        "grams": 15
      },
      {
        "id": "onion",
        "grams": 150
      },
      {
        "id": "garlic",
        "grams": 5
      },
      {
        "id": "celery",
        "grams": 40
      },
      {
        "id": "carrot",
        "grams": 80
      },
      {
        "id": "tomatoes-canned",
        "grams": 400
      },
      {
        "id": "chickpeas-canned",
        "grams": 380
      },
      {
        "id": "spinach",
        "grams": 300,
        "count": 2
      },
      {
        "id": "lemon",
        "grams": 10
      }
    ]
  },
  {
    "id": "red-beans-rice",
    "meal": [
      "lunch",
      "dinner"
    ],
    "time": 45,
    "servings": 4,
    "tags": [
      "protein"
    ],
    "name": {
      "en": "Red beans and rice",
      "ar": "فاصوليا حمراء مع الأرز"
    },
    "hero": {
      "en": "Rice",
      "ar": "أرز"
    },
    "description": {
      "en": "Kidney beans simmered with pepper, onion, tomato, and cumin over rice, topped with avocado and coriander.",
      "ar": "فاصوليا حمراء مطبوخة مع الفلفل والبصل والطماطم والكمون فوق الأرز، مع الأفوكادو والكزبرة."
    },
    "protein": 17.5,
    "calories": 479,
    "proteinSource": "usda",
    "source": {
      "title": "Red Beans and Rice",
      "by": "USDA Center for Nutrition Policy and Promotion",
      "url": "https://myplate.food/recipes/red-beans-and-rice-0",
      "credit": {
        "en": "Adapted for Saudi kitchens by Yara. Original recipe by USDA Center for Nutrition Policy and Promotion, published by the U.S. Department of Agriculture on MyPlate Kitchen (public domain), from the edition preserved by MyPlate.food.",
        "ar": "كيّفتها يارا للمطبخ السعودي. الوصفة الأصلية من USDA Center for Nutrition Policy and Promotion، ونشرتها وزارة الزراعة الأمريكية على MyPlate Kitchen (ملكية عامة)، عن النسخة المحفوظة في MyPlate.food."
      }
    },
    "ingredients": {
      "en": [
        "1 cup rice (brown, or basmati for a faster cook)",
        "2 tsp vegetable oil",
        "2 garlic cloves, minced",
        "1 small onion, chopped",
        "1 bell pepper, chopped",
        "1 tomato, chopped",
        "¼ tsp salt and a pinch of cumin",
        "2 cans red kidney beans (about 400 g each), drained and rinsed",
        "1½ cups water",
        "1 avocado and 2 tbsp chopped coriander"
      ],
      "ar": [
        "كوب أرز (بني، أو بسمتي لطبخ أسرع)",
        "ملعقتان صغيرتان زيت نباتي",
        "فصا ثوم مفرومان",
        "بصلة صغيرة مفرومة",
        "حبة فلفل رومي مقطعة",
        "حبة طماطم مقطعة",
        "ربع ملعقة صغيرة ملح ورشة كمون",
        "علبتا فاصوليا حمراء (نحو 400 جم لكل علبة) مصفّاة ومغسولة",
        "كوب ونصف ماء",
        "حبة أفوكادو وملعقتان كبيرتان كزبرة مفرومة"
      ]
    },
    "steps": {
      "en": [
        "Cook the rice: about 20 minutes for basmati, 45 for brown.",
        "Meanwhile, heat the oil and cook the garlic, onion, and pepper with 2 tbsp water until golden, about 10 minutes.",
        "Add the tomato, salt, cumin, beans, and water and simmer until the beans are very soft, 20 to 30 minutes.",
        "Serve the beans over the rice, topped with avocado and coriander. Keeps 3 days in the fridge."
      ],
      "ar": [
        "اطبخ الأرز: نحو 20 دقيقة للبسمتي، و45 للبني.",
        "في الأثناء، سخّن الزيت واطبخ الثوم والبصل والفلفل مع ملعقتين كبيرتين من الماء حتى تصفرّ، نحو 10 دقائق.",
        "أضف الطماطم والملح والكمون والفاصوليا والماء، واتركها على نار هادئة حتى تطرى الفاصوليا جيدًا، 20 إلى 30 دقيقة.",
        "قدّم الفاصوليا فوق الأرز مع الأفوكادو والكزبرة. تبقى 3 أيام في الثلاجة."
      ]
    },
    "uses": [
      {
        "id": "rice-basmati",
        "grams": 185
      },
      {
        "id": "vegetable-oil",
        "grams": 10
      },
      {
        "id": "garlic",
        "grams": 10
      },
      {
        "id": "onion",
        "grams": 100
      },
      {
        "id": "bell-pepper",
        "grams": 150
      },
      {
        "id": "tomato",
        "grams": 120
      },
      {
        "id": "cumin",
        "grams": 0.5
      },
      {
        "id": "kidney-beans-canned",
        "grams": 800
      },
      {
        "id": "avocado",
        "grams": 150
      },
      {
        "id": "coriander",
        "grams": 15,
        "count": 1
      }
    ],
    "swaps": {
      "en": "Brown rice is the original; basmati is what most Saudi kitchens have, and it cooks in half the time.",
      "ar": "الأرز البني هو الأصل، والبسمتي هو الموجود في أغلب المطابخ السعودية ويُطبخ في نصف الوقت."
    }
  }
];
