import type { IconType } from "react-icons";
import { LuCookingPot, LuMartini, LuUtensils } from "react-icons/lu";

type Bilingual = readonly [en: string, ar: string];

export type GallerySlide = {
  image: string;
  title: Bilingual;
  description?: Bilingual;
};

type Card = GallerySlide & { description: Bilingual };

export const settings = [
  { image: "reception-concept", title: ["A courtyard reception", "استقبال في الفناء"] },
  { image: "kosha-hero", title: ["The ceremony setting", "تنسيق الكوشة والمراسم"] },
  { image: "feast", title: ["Dinner under the lights", "عشاء في الهواء الطلق"] },
] satisfies GallerySlide[];

export const ceremonies = [
  {
    image: "wedding",
    eventType: "wedding",
    title: ["Wedding and reception", "الزفاف وحفل الاستقبال"],
    description: ["Decor for the kosha, the aisle, and the reception.", "تنسيق الكوشة والممر وحفل الاستقبال."],
  },
  {
    image: "katb",
    eventType: "katb-el-ketab",
    title: ["Katb al-kitab", "كتب الكتاب"],
    description: ["Ceremony lounges with calligraphy, soft lighting, and space for family.", "جلسات للمراسم مع لوحات بالخط العربي وإضاءة هادئة ومساحة للعائلة."],
  },
  {
    image: "anniversary",
    eventType: "anniversary",
    title: ["Anniversary dinner", "الذكرى والسهرة"],
    description: ["Centerpieces and outdoor lighting for a garden dinner.", "زينة للطاولات وإضاءة لعشاء في الحديقة."],
  },
  {
    image: "gala",
    eventType: "private-dinner",
    title: ["Private dinner or gala", "العشاء الخاص والحفلات الرسمية"],
    description: ["Candlelit tables with layered linens.", "موائد على ضوء الشموع ومفارش متناسقة."],
  },
] satisfies (Card & { eventType: string })[];

export const venues = [
  {
    image: "courtyard",
    title: ["Historic courtyard", "فناء تراثي"],
    description: ["Arched colonnades, warm uplighting, and a central fountain.", "أروقة مقوّسة وإضاءة دافئة ونافورة في الوسط."],
  },
  {
    image: "glasshouse-concept",
    title: ["Botanical glasshouse", "حديقة زجاجية"],
    description: ["Filtered daylight and greenery suspended above the aisle.", "ضوء طبيعي ونباتات متدلّية فوق الممر."],
  },
  {
    image: "pavilion",
    title: ["Desert or coastal pavilion", "خيمة في الصحراء أو على الساحل"],
    description: ["Fabric canopies and warm outdoor lighting.", "مظلّات قماشية منسدلة وإضاءة دافئة في الهواء الطلق."],
  },
  {
    image: "ballroom",
    title: ["Hotel ballroom", "قاعة فندق"],
    description: ["Ceiling installations, layered drapery, and a custom stage.", "تجهيزات للسقف وأقمشة منسدلة ومسرح مصمّم للمناسبة."],
  },
] satisfies Card[];

export const dining = [
  {
    icon: LuMartini,
    title: ["Canapés and mocktails", "مقبلات ومشروبات الاستقبال"],
    description: ["Small bites served on trays as guests gather, with botanical mocktails.", "لقيمات تُقدّم على صوانٍ أثناء استقبال الضيوف مع مشروبات عشبية."],
  },
  {
    icon: LuCookingPot,
    title: ["Buffet and live cooking", "بوفيه ومحطات طهي حيّة"],
    description: ["Copper serving dishes, roast meats, flatbreads, and regional mezze.", "أوانٍ نحاسية ولحوم مشوية وخبز طازج ومقبلات عربية."],
  },
  {
    icon: LuUtensils,
    title: ["Plated multi-course dinner", "وليمة رسمية متعددة الأطباق"],
    description: ["Individual courses served at the table beneath silver cloches.", "أطباق فردية تُقدّم على المائدة تحت أغطية فضية."],
  },
] satisfies { icon: IconType; title: Bilingual; description: Bilingual }[];

export const studioSteps = [
  {
    title: ["Event and guest count", "المناسبة وعدد الضيوف"],
    description: ["Choose the event date, venue, and expected guest count.", "حدّدوا موعد المناسبة ومكانها وعدد الضيوف المتوقع."],
  },
  {
    title: ["Moodboard and palette", "الأجواء والألوان"],
    description: ["Choose a moodboard and palette, or have WANAS put the decor together.", "اختاروا لوحة إلهام وألوانًا، أو اتركوا تنسيق الديكور لفريق وناس."],
  },
  {
    title: ["Catering", "الطعام والضيافة"],
    description: ["Choose a serving style or ask WANAS to recommend one.", "اختاروا طريقة التقديم أو اطلبوا من وناس اقتراح الأنسب."],
  },
  {
    title: ["Review and request a quote", "مراجعة وطلب عرض سعر"],
    description: ["Review the details and send them to WANAS for a quote.", "راجعوا التفاصيل وأرسلوها إلى وناس لطلب عرض سعر."],
  },
] satisfies { title: Bilingual; description: Bilingual }[];
