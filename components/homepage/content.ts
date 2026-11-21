type Bilingual = readonly [en: string, ar: string];

type Card = {
  image: string;
  title: Bilingual;
  description: Bilingual;
};

export const highlights = [
  {
    image: "banquet",
    title: ["Plated banquets", "ولائم بتقديم فردي"],
    description: ["Fine china, crystal glassware, and silver cloches.", "أطباق خزفية وكؤوس كريستال وأغطية تقديم فضية."],
  },
  {
    image: "feast",
    title: ["Feasts and live cooking", "ولائم ومحطات طهي حيّة"],
    description: ["Copper serving dishes, seasonal mezze, and live cooking.", "أوانٍ نحاسية ومقبلات موسمية وطهي أمام الضيوف."],
  },
] satisfies Card[];

export const ceremonies = [
  {
    image: "wedding",
    eventType: "wedding",
    label: ["Wedding & reception", "الزفاف والاستقبال"],
    title: ["Wedding and reception", "الزفاف وحفل الاستقبال"],
    description: ["A statement kosha, a floral aisle, and a reception planned around your guests.", "كوشة مميزة وممر مزيّن بالزهور واستقبال مُنسّق لضيوفكم."],
  },
  {
    image: "katb",
    eventType: "katb-el-ketab",
    label: ["Intimate ceremony", "مراسم عائلية"],
    title: ["Katb al-kitab", "كتب الكتاب"],
    description: ["Ceremony lounges with calligraphy, soft lighting, and space for family.", "جلسات للمراسم مع لوحات بالخط العربي وإضاءة هادئة ومساحة للعائلة."],
  },
  {
    image: "anniversary",
    eventType: "anniversary",
    label: ["Anniversary soirée", "احتفال بالذكرى"],
    title: ["Anniversary dinner", "الذكرى والسهرة"],
    description: ["Sculptural centerpieces, garden lighting, and an evening around the table.", "قطع مركزية لافتة وإضاءة للحديقة وسهرة حول المائدة."],
  },
  {
    image: "gala",
    eventType: "private-dinner",
    label: ["Private dinner", "عشاء خاص"],
    title: ["Private dinner or gala", "العشاء الخاص والحفلات الرسمية"],
    description: ["Candlelit tables, layered linens, and a setting designed for dinner.", "موائد على ضوء الشموع ومفارش متناسقة وأجواء مصمّمة للعشاء."],
  },
] satisfies (Card & { label: Bilingual; eventType: string })[];

export const venues = [
  {
    image: "courtyard",
    title: ["Historic courtyard", "فناء تراثي"],
    description: ["Arched colonnades, warm uplighting, and a central fountain.", "أروقة مقوّسة وإضاءة دافئة ونافورة في الوسط."],
  },
  {
    image: "glasshouse",
    title: ["Botanical glasshouse", "حديقة زجاجية"],
    description: ["Filtered daylight and greenery suspended above the aisle.", "ضوء طبيعي ونباتات متدلّية فوق الممر."],
  },
  {
    image: "pavilion",
    title: ["Desert or coastal pavilion", "خيمة في الصحراء أو على الساحل"],
    description: ["Flowing fabric canopies and warm pools of light outdoors.", "مظلّات قماشية منسدلة وإضاءة دافئة في الهواء الطلق."],
  },
  {
    image: "ballroom",
    title: ["Hotel ballroom", "قاعة فندق"],
    description: ["Ceiling installations, layered drapery, and a custom stage.", "تجهيزات للسقف وأقمشة منسدلة ومسرح مصمّم للمناسبة."],
  },
] satisfies Card[];

export const dining = [
  {
    image: "canapes",
    title: ["Canapés and mocktails", "مقبلات ومشروبات الاستقبال"],
    description: ["Small bites served on trays as guests gather, with botanical mocktails.", "لقيمات تُقدّم على صوانٍ أثناء استقبال الضيوف مع مشروبات عشبية."],
    tags: [["Hors d’œuvres", "مقبلات"], ["Standing reception", "استقبال وقوفًا"]],
  },
  {
    image: "buffet",
    title: ["Buffet and live cooking", "بوفيه ومحطات طهي حيّة"],
    description: ["Copper serving dishes, roast meats, flatbreads, and regional mezze.", "أوانٍ نحاسية ولحوم مشوية وخبز طازج ومقبلات عربية."],
    tags: [["Middle Eastern", "مطبخ شرقي"], ["Live chef stations", "طهي مباشر"]],
  },
  {
    image: "cloche",
    title: ["Plated multi-course dinner", "وليمة رسمية متعددة الأطباق"],
    description: ["Individual courses served at the table beneath silver cloches.", "أطباق فردية تُقدّم على المائدة تحت أغطية فضية."],
    tags: [["Cloche service", "تقديم بأغطية فضية"], ["Multi-course", "أطباق متعددة"]],
  },
] satisfies (Card & { tags: Bilingual[] })[];

export const studioSteps = [
  {
    title: ["Event and guest count", "المناسبة وعدد الضيوف"],
    example: ["Katb al-kitab · 90 guests", "كتب كتاب · ٩٠ ضيفًا"],
    description: ["Choose the event date, venue, and expected guest count.", "حدّدوا موعد المناسبة ومكانها وعدد الضيوف المتوقع."],
  },
  {
    title: ["Moodboard and palette", "الأجواء والألوان"],
    example: ["Terracotta and olive", "تيراكوتا دافئة وزيتوني"],
    description: ["Choose a moodboard and palette, or have WANAS put the decor together.", "اختاروا لوحة إلهام وألوانًا، أو اتركوا تنسيق الديكور لفريق وناس."],
  },
  {
    title: ["Catering", "الطعام والضيافة"],
    example: ["Optional catering", "ضيافة اختيارية"],
    description: ["Add food service when you want catering for your celebration.", "أضيفوا خدمة الطعام إذا رغبتم في ضيافة لمناسبتكم."],
  },
  {
    title: ["Review and request a quote", "مراجعة وطلب عرض سعر"],
    example: ["Your event brief", "ملخّص مناسبتكم"],
    description: ["Review the details and send them to WANAS for a quote.", "راجعوا التفاصيل وأرسلوها إلى وناس لطلب عرض سعر."],
  },
] satisfies { title: Bilingual; example: Bilingual; description: Bilingual }[];

export const principles = [
  {
    title: ["Seating and sightlines", "دقّة توزيع المساحة"],
    description: ["We plan focal points, seating, and circulation together so guests can see the ceremony and move through the room comfortably.", "نخطّط لنقاط التركيز والمقاعد ومسارات الحركة كي يشاهد الضيوف المراسم ويتنقّلوا بسهولة."],
  },
  {
    title: ["Fabrics and flowers", "خامات ملموسة"],
    description: ["Linen, terracotta, and seasonal flowers give each setting its own texture and palette.", "تمنح أقمشة الكتّان والتيراكوتا والزهور الموسمية كل مساحة ملمسها وألوانها."],
  },
  {
    title: ["Quotes before booking", "عروض أسعار واضحة"],
    description: ["Review your event details with WANAS and receive a quote before deciding whether to book.", "راجعوا تفاصيل المناسبة مع وناس واستلموا عرض السعر قبل اتخاذ قرار الحجز."],
  },
] satisfies { title: Bilingual; description: Bilingual }[];
