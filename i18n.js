/*
 * Yara — every word on the site, in English and Arabic.
 *
 * Edit the text freely, but keep the keys (the names before the colons)
 * identical in both languages. Words in {curly brackets} are filled in by
 * the site, so leave them as they are.
 *
 * Arabic counts change form with the number (منتج واحد، منتجان، 3 منتجات، 11 منتجًا),
 * so countable phrases list one version per plural form.
 */
window.YARA_I18N = {
  en: {
    languageName: "English",
    switchLanguage: "Switch to Arabic",
    meta: {
      title: "Yara | Plant-based in Saudi Arabia",
      description: "Real Saudi supermarket prices, the most protein for your riyal, local recipes, and an AI assistant that understands Saudi life."
    },
    skip: "Skip to content",
    brandName: "Yara",
    brandTagline: "Plant-based in Saudi Arabia",
    nav: {
      label: "Main",
      protein: "Protein per riyal",
      recipes: "Recipes",
      basket: "Basket",
      how: "How it works",
      week: "Your week",
      faq: "FAQ"
    },
    askYara: "Ask Yara",
    reportPrice: "Seen a different price? Tell us",

    hero: {
      title: "Plant-based eating in Saudi Arabia, minus the guesswork.",
      lede: "Real prices from Saudi supermarkets, the most protein for your riyal, local recipes, and an assistant who understands kabsa invitations as well as grocery lists.",
      ctaChat: "Ask Yara what to cook",
      ctaProtein: "See protein per riyal",
      note: "Every price is dated, so you know how fresh it is.",
      cardTitle: "Try asking Yara",
      cardLabel: "Example questions for Yara",
      questions: {
        kabsa: "I'm invited to a family kabsa. How do I handle it politely?",
        budget: "I have 40 SAR for the week. What should I buy?",
        protein: "Where do I get the most protein for my riyal?",
        iftar: "What's an easy plant-based dish for iftar?"
      },
      cardFooter: "Answers in Arabic or English, based on prices we checked ourselves."
    },

    stats: {
      label: "Yara in numbers",
      products: "products tracked",
      stores: "supermarkets compared",
      recipes: "recipes",
      checked: "latest price check"
    },

    protein: {
      title: "Most protein for your riyal",
      intro: "Grams of protein you get for every 1 SAR, based on the best-value pack we found for each product. Higher is better.",
      unit: "g protein per SAR",
      bestAt: "Best value at {store}",
      pack: "{size} for {price}",
      checked: "Checked {date}",
      checkedStale: "Checked {date}, may have changed",
      outOfStock: "Out of stock at last check",
      empty: "We're re-checking prices for this ranking. It updates as soon as they're in.",
      error: "The price list didn't load. Refresh the page to try again.",
      note: "Prices change often and differ between branches, so check the shelf too.",
      area: "Prices collected in {area}."
    },

    recipes: {
      title: "Recipes for your actual week",
      intro: "Saudi-inspired meals with ingredients you can find, afford, and cook again. Every card shows protein and cost per serving.",
      searchLabel: "Search recipes",
      searchPlaceholder: "Search recipes or ingredients",
      filtersLabel: "Filter recipes by meal",
      meals: { all: "All", breakfast: "Breakfast", main: "Lunch & dinner", snack: "Snacks" },
      mealNames: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
      sortLabel: "Sort by",
      sort: { value: "Most protein per riyal", protein: "Most protein", cost: "Lowest cost", time: "Quickest" },
      minutes: { one: "{count} min", other: "{count} min" },
      serves: { one: "Serves {count}", other: "Serves {count}" },
      proteinChip: "{value} g protein",
      proteinChipEstimate: "≈ {value} g protein",
      costChip: "≈ {price} a serving",
      usdaBadge: "USDA recipe, adapted",
      calories: "{value} kcal",
      perServing: "Per serving",
      proteinUsda: "Protein and calories come from the original recipe's USDA nutrition panel. Our changes may shift them slightly.",
      proteinEstimate: "Protein is estimated from the ingredients, using typical values.",
      proteinFilling: "The nutrition figures are for the filling, without the bread.",
      costNote: "Cost uses the best price per kg across our stores, checked {date}. Salt, water, and small extras aren't counted.",
      costUnavailable: "The cost appears once prices have loaded.",
      swapsTitle: "What we changed",
      sourceTitle: "Source",
      sourceLink: "See the original recipe",
      yaraOriginal: "A Yara recipe.",
      view: "View recipe",
      viewFor: "View recipe: {name}",
      empty: "No recipes match that. Try another ingredient or meal.",
      ingredients: "Ingredients",
      method: "Method",
      close: "Close recipe",
      print: "Print recipe guide"
    },

    basket: {
      title: "Build your basket",
      intro: "Pick what you need. We compare stores by price per kg and add up the best option for each item.",
      listTitle: "What do you need?",
      listLabel: "Products",
      total: "Your basket",
      budget: "Your budget",
      items: { one: "{count} item", other: "{count} items" },
      status: "{items} at the best prices we found.",
      statusEmpty: "Pick products to see your total.",
      left: "{amount} left in your budget.",
      over: "{amount} over your budget.",
      lowestAt: "Best price at {store}",
      perUnit: "{price} per {unit}",
      stale: "Older price ({date})",
      checkedOne: "Prices checked {date}.",
      checkedRange: "Prices checked between {from} and {to}.",
      ask: "Ask Yara about this basket",
      copyText: "My basket: {items}. Total {total}, budget {budget}. What can I cook with this?",
      empty: "We're re-checking prices. The basket comes back as soon as they're in.",
      error: "The price list didn't load. Refresh the page to try again."
    },

    week: {
      title: "A plant-based week, priced",
      intro: "Seven days where every meal is one of our recipes. Protein comes from the recipes themselves, and cost from today's best prices.",
      avgProtein: "protein a day, on average",
      range: "{min} to {max} g across the week",
      avgCost: "a day, on average",
      total: "for the whole week",
      day: "Day {n}",
      dayProtein: "{value} g protein",
      dayCost: "≈ {price}",
      leftover: "leftovers",
      note: "Costs are per serving at the best price per kg. You'll buy whole packs, and most last well beyond the week. Swap any meal for another with similar protein."
    },

    know: {
      title: "Two things worth knowing",
      shelfTitle: "Check the label",
      shelfIntro: "Most of what's here is plant-based by nature. These vary by brand, so read the ingredients:",
      shelf: [
        "Bread and tortillas: milk or milk powder.",
        "Pasta: egg, especially fresh pasta.",
        "Peanut butter and spreads: honey or whey.",
        "Stock cubes and spice mixes: chicken fat or chicken flavor, common in kabsa seasonings.",
        "Sweets and jellies: gelatin."
      ],
      nutrientsTitle: "Nutrients to plan for",
      nutrients: [
        "Vitamin B12 isn't reliably found in plant foods. Get it from fortified plant milk or cereal, or a supplement.",
        "Vitamin D deficiency is common in Saudi Arabia, plant-based or not. Ask your doctor about a test.",
        "Iron from beans and lentils is absorbed better with vitamin C, so the lemon in Saudi cooking helps.",
        "Calcium: tahini, almonds, and calcium-fortified plant milk. Omega-3: chia seeds and walnuts."
      ],
      disclaimer: "General information, not medical advice."
    },

    faq: {
      title: "Questions people ask",
      items: [
        {
          q: "Is every recipe here vegan?",
          a: "Yes. No meat, fish, dairy, eggs, honey, or gelatin, and stock only when it's vegetable stock. Packaged items like bread vary by brand, so check the label."
        },
        {
          q: "How much protein does the week give?",
          a: "Around 50 g a day, from lentils, beans, chickpeas, tahini, peanut butter, and grains. That meets the common guideline of 0.8 g per kg of body weight for many adults. If you're heavier or training hard, add a serving of beans or nuts."
        },
        {
          q: "Where do the recipes come from?",
          a: "Ten are Yara's own. Five are adapted from the U.S. Department of Agriculture's MyPlate Kitchen, a public-domain library, using the edition preserved by MyPlate.food. Each one credits its original author."
        },
        {
          q: "How current are the prices?",
          a: "Every price shows the date it was checked. Prices with a product link update automatically every night, and the rest are checked by hand. Anything older than two months is marked."
        },
        {
          q: "Why do some costs look so low?",
          a: "We cost the amount a recipe uses, not the whole pack. A 5 kg bag of rice costs more up front, but one serving uses well under a riyal of it."
        }
      ]
    },

    sources: {
      title: "Sources and credits",
      items: [
        "Recipes marked \"USDA recipe, adapted\": from the U.S. Department of Agriculture's MyPlate Kitchen (public domain), via MyPlate.food.",
        "Prices: the LuLu, Carrefour, and Panda websites, with the date each price was checked.",
        "Protein: USDA nutrition panels for adapted recipes, and typical nutrition values for everything else, to be confirmed against labels.",
        "Week plan format inspired by MyPlate.food's meal plans. Inspiration for Yara herself: The Saudi Vegan."
      ]
    },

    how: {
      title: "Your questions, grounded answers",
      intro: "Yara answers from data we collected and checked ourselves, so her advice fits real Saudi shelves and real Saudi life.",
      steps: [
        {
          title: "Tell Yara what you need",
          text: "A budget, a protein goal, a social situation, or just \"I'm hungry.\""
        },
        {
          title: "She checks the options",
          text: "Yara looks through our product list, ranked by protein per riyal, with exact prices and stores."
        },
        {
          title: "You get a real plan",
          text: "Meals with names, recipes you can make tonight, and prices you can check."
        },
        {
          title: "Social situations, handled",
          text: "Kabsa gatherings, Ramadan iftar, university cafeterias: Yara knows Saudi life and helps you through it."
        }
      ]
    },

    dedication: {
      title: "Named after the real Yara",
      p1: "This project was inspired by Yara, the creator behind The Saudi Vegan. Her recipes, her honesty about the challenges of plant-based living in Saudi Arabia, and her joy for food shaped every scenario, every social tip, and every meal idea in this project. She was doing by hand what we're trying to help everyone do instantly.",
      p2: "Yara the assistant carries her name because she carries her spirit: warm, practical, grounded in Saudi reality, and always in your corner.",
      link: "Visit The Saudi Vegan"
    },

    footer: {
      tagline: "Built to make plant-based eating in Saudi Arabia feel local, affordable, and doable.",
      pricesNote: "Prices are a snapshot and change often. Check in store before you buy.",
      github: "Code on GitHub"
    },

    chat: {
      kicker: "Your kitchen companion",
      title: "Ask Yara",
      close: "Close chat",
      frameTitle: "Chat with Yara",
      offlineTitle: "Yara is getting an upgrade",
      offlineText: "The new version of our assistant is on its way. Meanwhile, explore the protein ranking, recipes, and basket planner.",
      offlineCta: "See protein per riyal",
      copied: "Copied. Paste it into the chat to ask Yara."
    },

    print: {
      title: "Yara recipe guide",
      from: "From {site}"
    },

    common: {
      loading: "Loading prices…",
      newTab: "opens in a new tab"
    },

    currency: "SAR {amount}",
    currencySymbol: "SAR",
    sizeFormat: "{size} {unit}",
    units: { g: "g", kg: "kg", ml: "ml", L: "L", pcs: "pc" },
    categories: {
      legumes: "Beans & lentils",
      grains: "Grains & pasta",
      soy: "Soy",
      nuts_seeds: "Nuts, seeds & tahini",
      dairy_free: "Plant milks",
      bread: "Bread",
      produce: "Fruit, vegetables & herbs",
      other: "Pantry"
    },
    stores: {
      panda: "Panda",
      lulu: "LuLu",
      carrefour: "Carrefour",
      tamimi: "Tamimi",
      othaim: "Othaim",
      danube: "Danube",
      nesto: "Nesto",
      farm: "Farm"
    }
  },

  ar: {
    languageName: "العربية",
    switchLanguage: "التبديل إلى الإنجليزية",
    meta: {
      title: "يارا | الأكل النباتي في السعودية",
      description: "أسعار حقيقية من أسواق السعودية، وأكثر بروتين مقابل كل ريال، ووصفات محلية، ومساعدة ذكية تفهم تفاصيل الحياة في السعودية."
    },
    skip: "انتقل إلى المحتوى",
    brandName: "يارا",
    brandTagline: "الأكل النباتي في السعودية",
    nav: {
      label: "القائمة الرئيسية",
      protein: "البروتين مقابل الريال",
      recipes: "الوصفات",
      basket: "السلة",
      how: "كيف تعمل",
      week: "أسبوعك",
      faq: "أسئلة شائعة"
    },
    askYara: "اسأل يارا",
    reportPrice: "رأيت سعرًا مختلفًا؟ أخبرنا",

    hero: {
      title: "الأكل النباتي في السعودية، بلا حيرة.",
      lede: "أسعار حقيقية من أسواق السعودية، وأكثر بروتين مقابل كل ريال، ووصفات محلية، ومساعدة تفهم عزايم الكبسة كما تفهم قوائم التسوق.",
      ctaChat: "اسأل يارا: ماذا أطبخ؟",
      ctaProtein: "شاهد البروتين مقابل الريال",
      note: "كل الأسعار مؤرخة، لتعرف مدى حداثتها.",
      cardTitle: "جرّب أن تسأل يارا",
      cardLabel: "أسئلة مقترحة ليارا",
      questions: {
        kabsa: "عندي عزيمة كبسة عند الأهل، كيف أتصرف بلباقة؟",
        budget: "معي 40 ريالًا للأسبوع، ماذا أشتري؟",
        protein: "أين أحصل على أكثر بروتين مقابل كل ريال؟",
        iftar: "ما طبق نباتي سهل للإفطار في رمضان؟"
      },
      cardFooter: "إجابات بالعربية أو الإنجليزية، مبنية على أسعار راجعناها بأنفسنا."
    },

    stats: {
      label: "يارا بالأرقام",
      products: "منتجات نتابع أسعارها",
      stores: "متاجر نقارن بينها",
      recipes: "وصفات",
      checked: "آخر مراجعة للأسعار"
    },

    protein: {
      title: "أكثر بروتين مقابل ريالك",
      intro: "كم غرامًا من البروتين تحصل عليه مقابل كل ريال، بحسب أفضل عبوة من حيث القيمة وجدناها لكل منتج. كلما زاد الرقم كان أفضل.",
      unit: "جم بروتين لكل ريال",
      bestAt: "أفضل قيمة في {store}",
      pack: "{size} بسعر {price}",
      checked: "رُوجع في {date}",
      checkedStale: "رُوجع في {date}، وقد يكون تغيّر",
      outOfStock: "غير متوفر عند آخر مراجعة",
      empty: "نعيد مراجعة الأسعار لهذا الترتيب، وسيتحدّث فور إضافتها.",
      error: "لم تُحمَّل قائمة الأسعار. حدّث الصفحة وحاول مرة أخرى.",
      note: "الأسعار تتغير باستمرار وتختلف بين الفروع، فتأكد منها على الرف أيضًا.",
      area: "جُمعت الأسعار في {area}."
    },

    recipes: {
      title: "وصفات لأيامك العادية",
      intro: "وجبات مستوحاة من المطبخ السعودي، بمكونات تجدها وتقدر على ثمنها وتطبخها مرة بعد مرة. كل بطاقة تعرض البروتين والتكلفة لكل حصة.",
      searchLabel: "ابحث في الوصفات",
      searchPlaceholder: "ابحث عن وصفة أو مكوّن",
      filtersLabel: "تصفية الوصفات حسب الوجبة",
      meals: { all: "الكل", breakfast: "الفطور", main: "الغداء والعشاء", snack: "وجبات خفيفة" },
      mealNames: { breakfast: "فطور", lunch: "غداء", dinner: "عشاء", snack: "وجبة خفيفة" },
      sortLabel: "الترتيب حسب",
      sort: { value: "الأكثر بروتينًا مقابل الريال", protein: "الأكثر بروتينًا", cost: "الأقل تكلفة", time: "الأسرع" },
      minutes: {
        zero: "{count} دقيقة",
        one: "دقيقة واحدة",
        two: "دقيقتان",
        few: "{count} دقائق",
        many: "{count} دقيقة",
        other: "{count} دقيقة"
      },
      serves: {
        zero: "لـ{count} شخص",
        one: "لشخص واحد",
        two: "لشخصين",
        few: "لـ{count} أشخاص",
        many: "لـ{count} شخصًا",
        other: "لـ{count} شخص"
      },
      proteinChip: "{value} جم بروتين",
      proteinChipEstimate: "≈ {value} جم بروتين",
      costChip: "≈ {price} للحصة",
      usdaBadge: "وصفة من USDA، معدّلة",
      calories: "{value} سعرة",
      perServing: "لكل حصة",
      proteinUsda: "البروتين والسعرات من لوحة التغذية الأصلية للوصفة لدى وزارة الزراعة الأمريكية، وقد تغيّرها تعديلاتنا قليلًا.",
      proteinEstimate: "البروتين مقدّر من المكونات بقيم تقريبية.",
      proteinFilling: "القيم الغذائية للحشوة، دون الخبز.",
      costNote: "التكلفة بأفضل سعر للكيلو في متاجرنا، رُوجعت في {date}. الملح والماء والإضافات الصغيرة غير محسوبة.",
      costUnavailable: "تظهر التكلفة بعد تحميل الأسعار.",
      swapsTitle: "ما الذي غيّرناه",
      sourceTitle: "المصدر",
      sourceLink: "اطّلع على الوصفة الأصلية",
      yaraOriginal: "وصفة من يارا.",
      view: "عرض الوصفة",
      viewFor: "عرض الوصفة: {name}",
      empty: "لا توجد وصفات مطابقة. جرّب مكوّنًا أو وجبة أخرى.",
      ingredients: "المكونات",
      method: "طريقة التحضير",
      close: "إغلاق الوصفة",
      print: "اطبع دليل الوصفات"
    },

    basket: {
      title: "جهّز سلتك",
      intro: "اختر ما تحتاجه، ونقارن المتاجر بسعر الكيلو ونجمع لك أفضل خيار لكل منتج.",
      listTitle: "ماذا تحتاج؟",
      listLabel: "المنتجات",
      total: "سلتك",
      budget: "ميزانيتك",
      items: {
        zero: "لا منتجات",
        one: "منتج واحد",
        two: "منتجان",
        few: "{count} منتجات",
        many: "{count} منتجًا",
        other: "{count} منتج"
      },
      status: "{items} بأفضل الأسعار التي وجدناها.",
      statusEmpty: "اختر منتجات لترى المجموع.",
      left: "يتبقى {amount} من ميزانيتك.",
      over: "تجاوزت ميزانيتك بمقدار {amount}.",
      lowestAt: "أفضل سعر في {store}",
      perUnit: "{price} لكل {unit}",
      stale: "سعر قديم ({date})",
      checkedOne: "رُوجعت الأسعار في {date}.",
      checkedRange: "رُوجعت الأسعار بين {from} و{to}.",
      ask: "اسأل يارا عن هذه السلة",
      copyText: "سلتي: {items}. المجموع {total} والميزانية {budget}. ماذا يمكنني أن أطبخ بها؟",
      empty: "نعيد مراجعة الأسعار، وستعود السلة فور إضافتها.",
      error: "لم تُحمَّل قائمة الأسعار. حدّث الصفحة وحاول مرة أخرى."
    },

    week: {
      title: "أسبوع نباتي بأسعاره",
      intro: "سبعة أيام كل وجبة فيها من وصفاتنا. البروتين من الوصفات نفسها، والتكلفة من أفضل أسعار اليوم.",
      avgProtein: "بروتين يوميًا في المتوسط",
      range: "بين {min} و{max} جم خلال الأسبوع",
      avgCost: "يوميًا في المتوسط",
      total: "للأسبوع كاملًا",
      day: "اليوم {n}",
      dayProtein: "{value} جم بروتين",
      dayCost: "≈ {price}",
      leftover: "بقايا",
      note: "التكلفة لكل حصة بأفضل سعر للكيلو. ستشتري العبوات كاملة، ومعظمها يكفي لأكثر من أسبوع. بدّل أي وجبة بأخرى قريبة منها في البروتين."
    },

    know: {
      title: "أمران يستحقان الانتباه",
      shelfTitle: "اقرأ المكونات",
      shelfIntro: "معظم ما هنا نباتي بطبيعته. أما هذه فتختلف من علامة تجارية لأخرى، فاقرأ مكوناتها:",
      shelf: [
        "الخبز والتورتيلا: حليب أو حليب بودرة.",
        "المعكرونة: بيض، خاصة الطازجة.",
        "زبدة الفول السوداني والمنتجات القابلة للدهن: عسل أو مصل حليب.",
        "مكعبات المرق وخلطات البهارات: دهن دجاج أو نكهة دجاج، وهي شائعة في بهارات الكبسة.",
        "الحلويات والجيلي: جيلاتين."
      ],
      nutrientsTitle: "عناصر غذائية تحتاج تخطيطًا",
      nutrients: [
        "فيتامين ب12 لا يتوفر بشكل موثوق في الأطعمة النباتية؛ احصل عليه من حليب نباتي أو حبوب إفطار مدعّمة، أو من مكمّل.",
        "نقص فيتامين د شائع في السعودية، نباتيًا كنت أم لا؛ اسأل طبيبك عن الفحص.",
        "يُمتص الحديد من البقوليات والعدس بشكل أفضل مع فيتامين ج، ولهذا يفيد الليمون في المطبخ السعودي.",
        "الكالسيوم: الطحينة واللوز والحليب النباتي المدعّم بالكالسيوم. أوميغا 3: بذور الشيا والجوز."
      ],
      disclaimer: "معلومات عامة، وليست نصيحة طبية."
    },

    faq: {
      title: "أسئلة شائعة",
      items: [
        {
          q: "هل كل الوصفات هنا نباتية؟",
          a: "نعم. لا لحوم ولا أسماك ولا ألبان ولا بيض ولا عسل ولا جيلاتين، والمرق نباتي فقط. أما المنتجات المعلبة مثل الخبز فتختلف بين العلامات التجارية، فاقرأ مكوناتها."
        },
        {
          q: "كم بروتينًا يعطيني الأسبوع؟",
          a: "نحو 50 جرامًا يوميًا، من العدس والفاصوليا والحمص والطحينة وزبدة الفول السوداني والحبوب. وهذا يحقق التوصية الشائعة البالغة 0.8 جرام لكل كيلوجرام من وزن الجسم لكثير من البالغين. وإن كان وزنك أكبر أو كنت تتمرن بجدية، فأضف حصة من البقوليات أو المكسرات."
        },
        {
          q: "من أين جاءت الوصفات؟",
          a: "عشر منها من يارا، وخمس معدّلة عن مكتبة MyPlate Kitchen التابعة لوزارة الزراعة الأمريكية، وهي ملكية عامة، عن النسخة المحفوظة في MyPlate.food. وكل وصفة تذكر صاحبها الأصلي."
        },
        {
          q: "ما مدى حداثة الأسعار؟",
          a: "كل سعر مذكور معه تاريخ مراجعته. الأسعار التي لها رابط منتج تتحدّث تلقائيًا كل ليلة، والبقية نراجعها يدويًا. وأي سعر أقدم من شهرين يظهر بعلامة."
        },
        {
          q: "لماذا تبدو بعض التكاليف منخفضة جدًا؟",
          a: "نحسب الكمية التي تستخدمها الوصفة، لا العبوة كاملة. كيس الأرز بوزن 5 كجم أغلى عند الشراء، لكن الحصة الواحدة تستهلك منه أقل من ريال."
        }
      ]
    },

    sources: {
      title: "المصادر والإشادات",
      items: [
        "الوصفات المعلّمة بـ«وصفة من USDA، معدّلة»: من مكتبة MyPlate Kitchen التابعة لوزارة الزراعة الأمريكية (ملكية عامة)، عن طريق MyPlate.food.",
        "الأسعار: مواقع لولو وكارفور وبنده، مع تاريخ مراجعة كل سعر.",
        "البروتين: لوحات التغذية من وزارة الزراعة الأمريكية للوصفات المعدّلة، وقيم غذائية تقريبية لما سواها، نؤكدها من الملصقات.",
        "شكل الخطة الأسبوعية مستوحى من خطط الوجبات في MyPlate.food، والإلهام ليارا نفسها من The Saudi Vegan."
      ]
    },

    how: {
      title: "أسئلتك، وإجابات مبنية على بيانات",
      intro: "تجيب يارا من بيانات جمعناها وراجعناها بأنفسنا، فتأتي نصائحها مناسبة لرفوف أسواقنا وحياتنا اليومية في السعودية.",
      steps: [
        {
          title: "أخبر يارا بما تحتاجه",
          text: "ميزانية، أو هدف للبروتين، أو موقف اجتماعي، أو ببساطة: «أبغى آكل شي»."
        },
        {
          title: "تبحث لك في الخيارات",
          text: "تراجع يارا قائمة منتجاتنا المرتبة حسب البروتين مقابل الريال، بأسعار ومتاجر محددة."
        },
        {
          title: "تحصل على خطة واقعية",
          text: "وجبات بأسمائها، ووصفات يمكنك طبخها الليلة، وأسعار يمكنك التحقق منها."
        },
        {
          title: "المواقف الاجتماعية؟ محلولة",
          text: "عزايم الكبسة، وإفطار رمضان، ومطاعم الجامعة: يارا تعرف تفاصيل الحياة في السعودية وتساعدك فيها."
        }
      ]
    },

    dedication: {
      title: "سُمّيت على اسم يارا الحقيقية",
      p1: "استُلهم هذا المشروع من يارا، صانعة المحتوى خلف The Saudi Vegan. وصفاتها، وصراحتها في الحديث عن تحديات الحياة النباتية في السعودية، وحبها للأكل، شكّلت كل موقف وكل نصيحة اجتماعية وكل فكرة وجبة في هذا المشروع. كانت تفعل بجهدها ما نحاول أن نتيحه للجميع في لحظة.",
      p2: "وتحمل المساعدة يارا اسمها لأنها تحمل روحها: دافئة، وعملية، وقريبة من واقعنا في السعودية، ودائمًا في صفّك.",
      link: "زُر The Saudi Vegan"
    },

    footer: {
      tagline: "صُمّم ليكون الأكل النباتي في السعودية أقرب وأوفر وأسهل.",
      pricesNote: "الأسعار لقطة من وقت مراجعتها وتتغير كثيرًا، فتأكد منها في المتجر قبل الشراء.",
      github: "الكود على GitHub"
    },

    chat: {
      kicker: "رفيقتك في المطبخ",
      title: "اسأل يارا",
      close: "إغلاق المحادثة",
      frameTitle: "محادثة مع يارا",
      offlineTitle: "يارا تستعد بنسخة جديدة",
      offlineText: "النسخة الجديدة من مساعدتنا في الطريق. وحتى ذلك الحين، تصفّح ترتيب البروتين والوصفات ومخطط السلة.",
      offlineCta: "شاهد البروتين مقابل الريال",
      copied: "نسخنا النص، الصقه في المحادثة لتسأل يارا."
    },

    print: {
      title: "دليل وصفات يارا",
      from: "من {site}"
    },

    common: {
      loading: "جارٍ تحميل الأسعار…",
      newTab: "يفتح في نافذة جديدة"
    },

    currency: "{amount} ر.س",
    currencySymbol: "ر.س",
    sizeFormat: "{size} {unit}",
    units: { g: "جم", kg: "كجم", ml: "مل", L: "لتر", pcs: "حبة" },
    categories: {
      legumes: "البقوليات",
      grains: "الحبوب والمعكرونة",
      soy: "الصويا",
      nuts_seeds: "المكسرات والبذور والطحينة",
      dairy_free: "الحليب النباتي",
      bread: "الخبز",
      produce: "الخضار والفواكه والأعشاب",
      other: "مؤونة المطبخ"
    },
    stores: {
      panda: "بنده",
      lulu: "لولو",
      carrefour: "كارفور",
      tamimi: "التميمي",
      othaim: "العثيم",
      danube: "الدانوب",
      nesto: "نستو",
      farm: "المزرعة"
    }
  }
};
