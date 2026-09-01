/**
 * Single source of truth for the landing page.
 *
 * Anything marked VERIFY came from the old shaiomedia.com and has not been
 * re-checked. Per-project result numbers are deliberately absent where we do
 * not have them — the descriptors below are things observable on the live
 * sites, so nothing here is invented.
 */

export const site = {
  name: "Shaio Media",
  nameHe: "שיו מדיה",
  url: "https://service.shaiomedia.com",
  phone: "+972542192619",
  phoneDisplay: "054-219-2619",
  email: "contact@shaiomedia.com",
  whatsapp: "https://wa.link/h5ltox",
  description:
    "בונים אתרים ומקדמים אורגנית עסקי שירות בארצות הברית. בנייה ושיפוצים, גגות, ארובות ומנעולנות.",
};

/* ---------- Proof strip ---------- */
export const stats = [
  { value: "100", suffix: "+", label: "אתרים שנבנו" },
  { value: "98", suffix: "%", label: "לקוחות שנשארים" },
];

/* ---------- Verticals, in the order Shay asked for ---------- */
export type Vertical = { id: string; label: string };

export const verticals: Vertical[] = [
  { id: "construction", label: "בנייה ושיפוצים" },
  { id: "roofing",      label: "גגות" },
  { id: "chimney",      label: "ארובות" },
  { id: "locksmith",    label: "מנעולנות" },
];

/* ---------- Hero backdrop: scattered crops from the real client sites.
   Positions are hand-placed to stay clear of the headline column. ---------- */
export const heroTiles = [
  //                                                                                          drift target      loop
  { src: "primework-0",      top: "3%",  side: "start", offset: "-9%", w: "17rem", rot: -7, delay: 0,   wide: false, fx: "18px",  fy: "-26px", dur: 17 },
  { src: "wcoasthome-1",     top: "36%", side: "start", offset: "-4%", w: "13rem", rot: 5,  delay: 1.4, wide: false, fx: "-22px", fy: "20px",  dur: 21 },
  { src: "pwcroofing-2",     top: "66%", side: "start", offset: "-8%", w: "16rem", rot: -4, delay: 2.6, wide: false, fx: "16px",  fy: "24px",  dur: 19 },
  { src: "vita-design-0",    top: "2%",  side: "end",   offset: "-8%", w: "18rem", rot: 6,  delay: 0.7, wide: false, fx: "-19px", fy: "-22px", dur: 23 },
  { src: "247locksmith-1",   top: "38%", side: "end",   offset: "-3%", w: "12rem", rot: -6, delay: 2.0, wide: false, fx: "20px",  fy: "18px",  dur: 16 },
  { src: "wcoasthome-2",     top: "68%", side: "end",   offset: "-9%", w: "15rem", rot: 4,  delay: 3.1, wide: false, fx: "-17px", fy: "-20px", dur: 20 },
  // Inner pair only appears where there is genuinely room beside the headline
  { src: "svchimneysweep-1", top: "14%", side: "start", offset: "7%",  w: "11rem", rot: 8,  delay: 3.4, wide: true,  fx: "-14px", fy: "22px",  dur: 18 },
  { src: "primework-2",      top: "12%", side: "end",   offset: "8%",  w: "10rem", rot: -9, delay: 4.2, wide: true,  fx: "15px",  fy: "-18px", dur: 22 },
];

/** Phone mockups for the mobile strip. A portrait phone reads as "a website"
 *  at small sizes; a cropped landscape tile does not. */
export const phoneStrip = [
  { slug: "primework",      label: "בנייה ושיפוצים" },
  { slug: "pwcroofing",     label: "גגות" },
  { slug: "svchimneysweep", label: "ארובות" },
  { slug: "247locksmith",   label: "מנעולנות" },
  { slug: "wcoasthome",     label: "שיפוצים" },
  { slug: "vita-design",    label: "נגרות" },
];

/* ---------- Where the clients actually are ---------- */
export const cities = [
  "לאס וגאס",
  "לוס אנג׳לס",
  "סיאטל",
  "צפון קרוליינה",
  "פורטלנד",
  "סן חוזה",
];

/* ---------- Showcase projects ---------- */
export type Project = {
  slug: string;
  name: string;
  vertical: string;
  city: string;
  url: string;
  /** What the build had to solve. Site only — no SEO claims live in the gallery. */
  brief: string;
  /** Observable facts about what was actually shipped. */
  built: string[];
  /** Seconds for one full pan of the captured page, scaled so every site
   *  scrolls at roughly the same speed regardless of how tall it is. */
  pan: number;
};

export const projects: Project[] = [
  {
    slug: "primework",
    pan: 45,
    name: "Primework Construction",
    vertical: "construction",
    city: "אזור המפרץ, קליפורניה",
    url: "https://primeworkconstructionca.com/",
    brief: "קבלן שיפוצים שרצה אתר שנראה כמו החברה שהוא באמת, ולא כמו כרטיס ביקור.",
    built: [
      "עמוד נפרד לכל שירות: שיפוץ מלא, מטבחים, אמבטיות, חוץ, תוספות בנייה ותכנון ובנייה",
      "עמודי אזור לפאלו אלטו, מנלו פארק ושאר ערי המפרץ",
      "גלריית פרויקטים עם לפני ואחרי",
      "טופס קבלת הצעה בכל עמוד",
    ],
  },
  {
    slug: "wcoasthome",
    pan: 45,
    name: "West Coast Home",
    vertical: "construction",
    city: "פונטנה, קליפורניה",
    url: "https://wcoasthome.com/",
    brief: "חברת שיפוצים ושדרוגי אנרגיה עם הרבה מאוד שירותים שהיו דחוסים לעמוד אחד.",
    built: [
      "עשרה עמודי שירות: גינון, הרדסקייפ, גג קריר, חלונות, מיזוג, בידוד, צביעה ובריכות",
      "עמוד המלצות ועמוד אודות שנושאים את האמון",
      "מבנה תפריט שמאפשר להגיע לכל שירות בקליק אחד",
    ],
  },
  {
    slug: "vita-design",
    pan: 29,
    name: "Vita Design",
    vertical: "construction",
    city: "סן חוזה, קליפורניה",
    url: "https://vita-design.com/",
    brief: "אולם תצוגה לנגרות יוקרה. כאן העיצוב עצמו הוא איש המכירות.",
    built: [
      "אתר עריכתי שנבנה מאפס בקוד, לא על תבנית",
      "גלריית עבודות גדולה שנושאת את כל המכירה",
      "מסלול קביעת פגישת תכנון מכל עמוד",
      "טיפוגרפיה וקצב שנבנו במיוחד למותג",
    ],
  },
  {
    slug: "pwcroofing",
    pan: 44,
    name: "PWC Roofing",
    vertical: "roofing",
    city: "אורנג׳ קאונטי, קליפורניה",
    url: "https://pwcroofing.com/",
    brief: "גגן עם פריסה בכמה ערים, שצריך שהלקוח יבין תוך שניות שהוא במקום הנכון.",
    built: [
      "עמוד לכל סוג עבודה: תיקון גג, נזילות, נזקי סערה, רעפים, גג שטוח והחלפה",
      "עמודי אזור לפולרטון, סנטה אנה וקוסטה מסה",
      "טלפון ומייל קבועים בכותרת בכל עמוד",
      "אותות אמון: רישיון קבלן, ביטוח וותק",
    ],
  },
  {
    slug: "svchimneysweep",
    pan: 40,
    name: "Silicon Valley Chimney Sweep",
    vertical: "chimney",
    city: "סן חוזה, קליפורניה",
    url: "https://svchimneysweep.com/",
    brief: "עסק משפחתי מוסמך CSIA שרצה שאפשר יהיה לקבוע תור בלי להרים טלפון.",
    built: [
      "תשעה עמודי שירות: ניקוי, תיקון, בדיקה, כובע ארובה, קמין גז, תנור עצים, שיקום, בטנה ומרזבים",
      "הזמנת תור אונליין ישירות מכל עמוד",
      "הסמכה, ביטוח ודירוג כוכבים בראש העמוד",
      "בלוג להסברים ותחזוקה עונתית",
    ],
  },
  {
    slug: "247locksmith",
    pan: 42,
    name: "24/7 Locksmith",
    vertical: "locksmith",
    city: "שארלוט ומת׳יוס, צפון קרוליינה",
    url: "https://247locksmithsnc.com/",
    brief: "מנעולן חירום. ההחלטה של הלקוח נופלת בשלושים שניות, או שהוא עובר לבא בתור.",
    built: [
      "עמודי שירות לרכב, בית, עסק וחירום",
      "מיצוב 24/7 ומחיר מראש בראש העמוד",
      "כפתור חיוג דביק, כי כמעט כל התנועה מגיעה מהנייד",
      "תפריט נגישות מלא",
    ],
  },
];

/* ---------- What a build actually includes (the catalogue) ---------- */
export const includes = [
  {
    n: "01",
    title: "האתר עצמו",
    items: [
      "עיצוב מותאם אישית, לא תבנית שקנינו",
      "עמוד לכל שירות בנפרד, לא רשימה בעמוד אחד",
      "עמוד לכל עיר שאתם מכסים",
      "גלריית עבודות עם לפני ואחרי",
      "עמוד המלצות שמושך ביקורות מגוגל",
      "טפסים, כפתורי חיוג ווואטסאפ בכל מסך",
    ],
  },
  {
    n: "02",
    title: "הקידום האורגני",
    items: [
      "מחקר מילות מפתח לפי מה שמחפשים באזור שלכם",
      "אופטימיזציה טכנית מלאה: מהירות, אינדוקס, סכמה",
      "פרופיל העסק בגוגל ומיקום במפות",
      "תוכן חדש כל חודש",
      "בניית קישורים וציטוטים מקומיים",
      "מעקב דירוגים בגריד לפי אזור",
      "תוצאות אמיתיות בדרך כלל בין 3 ל-6 חודשים",
    ],
  },
  {
    n: "03",
    title: "מה שרץ מאחורי הקלעים",
    items: [
      "מעקב המרות שמראה מאיפה הגיעה כל שיחה",
      "דוח חודשי בעברית שאפשר להבין",
      "אחסון, אבטחה וגיבויים",
      "תיקונים ושינויים שוטפים",
      "הכל רשום על שמכם מהיום הראשון",
    ],
  },
];

/* ---------- Why the US service market is different ---------- */
export const edge = [
  {
    title: "אנחנו מכירים את השוק האמריקאי",
    body: "רוב הלקוחות שלנו יושבים בלאס וגאס, לוס אנג׳לס, סיאטל, פורטלנד, סן חוזה וצפון קרוליינה. אנחנו יודעים איך נראה חיפוש של בעל בית שם, ומה גורם לו להרים טלפון.",
  },
  {
    title: "שני מתכנתים, לא שני משווקים",
    body: "שנינו בוגרי מדעי המחשב. כשצריך לתקן משהו באתר, לחבר מעקב שעובד או לבנות מהר, זה נעשה אצלנו ולא אצל ספק שלישי.",
  },
  {
    title: "נמדדים בשיחות, לא במיקומים",
    body: "מיקום ראשון על ביטוי שאף אחד לא מחפש לא שווה כלום. הדוח החודשי מדבר על כמה פניות נכנסו וכמה הן עלו.",
  },
  {
    title: "הכל שלכם",
    body: "הדומיין, הקוד, החשבונות והנתונים רשומים על שמכם. אם נפרדים, אתם לוקחים הכל ואנחנו מעבירים גישה מלאה.",
  },
];

/* ---------- Process ---------- */
export type Step = { n: string; title: string; body: string; optional?: boolean };

export const process: Step[] = [
  {
    n: "01",
    title: "שיחת אבחון",
    body: "עשרים דקות. מסתכלים על מה שיש היום, על המתחרים שלכם באזור, ואומרים לכם מה היינו עושים ראשון.",
  },
  {
    n: "02",
    title: "תוכנית ומחיר",
    body: "מסמך אחד: מה נבנה, מתי, וכמה זה עולה. בלי עלויות שצצות באמצע.",
  },
  {
    n: "03",
    title: "עיצוב ואישור",
    body: "מעצבים את האתר ומראים לכם. משנים עד שאתם מרוצים. רק אחרי שאתם מאשרים את העיצוב אנחנו מתחילים לבנות.",
  },
  {
    n: "04",
    title: "בנייה והעלאה",
    body: "בונים את האתר לפי העיצוב המאושר, כותבים את התוכן ומחברים מעקב. אתם רואים גרסה חיה לפני שעולים לאוויר.",
  },
  {
    n: "05",
    title: "קידום אורגני שוטף",
    optional: true,
    body: "לא חובה. מי שממשיך מקבל תוכן חדש כל חודש, שיפורים טכניים ובניית קישורים. תוצאות אמיתיות נראות בדרך כלל בין שלושה לשישה חודשים.",
  },
];

/* ---------- FAQ (feeds FAQPage schema) ---------- */
export const faq = [
  {
    q: "כמה זמן עד שרואים תוצאות?",
    a: "האתר עולה תוך שלושה עד חמישה שבועות מרגע שאישרתם את העיצוב. בקידום אורגני, שיפורים טכניים ועמודים חדשים מתחילים להיקלט תוך שבועות, ותוצאות אמיתיות בכמות הפניות נראות בדרך כלל בין שלושה לשישה חודשים. אנחנו נותנים הערכה מציאותית אחרי האבחון, לא לפני.",
  },
  {
    q: "אני כבר עם אתר. צריך לבנות מחדש?",
    a: "לא תמיד. בשיחת האבחון נבדוק אם האתר הקיים ניתן לתיקון או שהוא מגביל אתכם. אם אפשר לקדם את מה שיש, נגיד לכם את זה גם אם זה אומר פרויקט קטן יותר עבורנו.",
  },
  {
    q: "אתם עובדים רק עם עסקים בארצות הברית?",
    a: "רוב הלקוחות שלנו שם, וזה השוק שאנחנו מכירים הכי טוב. אנחנו עובדים גם עם עסקים בישראל, אבל אם אתם עסק שירות בארצות הברית זה בדיוק מה שאנחנו עושים כל יום.",
  },
  {
    q: "מי כותב את התוכן?",
    a: "אנחנו. משתמשים בכלי AI כדי לעבוד מהר יותר על מחקר וטיוטות, אבל כל מה שעולה לאוויר נכתב ונערך על ידי אדם שמבין את התחום.",
  },
  {
    q: "כמה זה עולה?",
    a: "אין מחיר אחיד כי אין היקף אחיד. עסק עם ארבעה שירותים בעיר אחת ועסק עם שנים עשר שירותים בשמונה ערים הם שני פרויקטים שונים. אחרי שיחת אבחון נשלח הצעה עם טווח ברור.",
  },
  {
    q: "חייבים לקחת גם את הקידום השוטף?",
    a: "לא. אפשר לקחת רק בניית אתר ולסיים שם, והאתר נשאר שלכם. הקידום השוטף הוא שלב נפרד שמתחילים רק אם רוצים, ואפשר גם להתחיל אותו חודשים אחרי שהאתר עלה.",
  },
  {
    q: "מה קורה אם נפסיק לעבוד יחד?",
    a: "אתם לוקחים הכל. הדומיין, הקוד, האחסון והחשבונות רשומים על שמכם מהיום הראשון, ואנחנו מעבירים גישה מלאה בלי להחזיק אף אחד כבן ערובה.",
  },
];

export const nav = [
  { label: "עבודות", href: "#work" },
  { label: "מה כלול", href: "#includes" },
  { label: "תהליך", href: "#process" },
  { label: "שאלות", href: "#faq" },
];
