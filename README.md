# shaiomedia.com

עמוד נחיתה בעברית לעסקי שירות בארצות הברית: בנייה ושיפוצים, גגות, ארובות ומנעולנות.
Astro 7 + Tailwind 4, סטטי לגמרי, מיועד ל-Cloudflare Pages.

**תצוגה חיה:** https://shayexd.github.io/shaiomedia/

> זו תצוגת ביניים לקבלת חוות דעת. היא מסומנת `noindex` כדי שלא תתחרה בדומיין האמיתי.

## הרצה

```bash
npm install
npm run dev        # פיתוח
npm run build      # בילד ל-dist/
npm run preview    # תצוגה מקדימה של הבילד
```

## מבנה

| נתיב | מה זה |
|---|---|
| `src/data/site.ts` | כל התוכן. עורכים כאן, לא בקומפוננטות |
| `src/styles/global.css` | טוקנים: צבעים מהלוגו, עקומות תנועה, כפתורים |
| `src/components/` | סקשנים של העמוד |
| `src/lib/asset.ts` | עוטף נתיבי נכסים כדי שיעבדו גם בשורש וגם בתת-נתיב |
| `functions/api/lead.ts` | Cloudflare Function שמקבלת את טופס הלידים |
| `public/images/sites/` | צילומי עמוד מלא שנגללים בתוך מסגרות הדפדפן והטלפון |
| `public/images/tiles/` | חתיכות מהאתרים לרקע ההירו בדסקטופ |
| `public/images/phones/` | מסכי טלפון לרצועה הנעה במובייל |

## עיצוב

הפאלטה חולצה מקובץ הלוגו עצמו: נייבי `#1C1D46`, ויולט `#6F64EA`.
פונט Rubik. שינוי הטוקנים ב-`global.css` משנה את כל האתר.

## סביבות

הבילד נשלט במשתני סביבה, כך שאותו קוד משרת את שני היעדים:

| משתנה | ברירת מחדל | לתצוגת Pages |
|---|---|---|
| `SITE_URL` | `https://shaiomedia.com` | `https://shayexd.github.io` |
| `BASE_PATH` | `/` | `/shaiomedia/` |
| `PUBLIC_PREVIEW` | – | `1` (מוסיף noindex) |

## מה עוד פתוח

- דלתות גראז׳: עוד לא נוסף לגלריה, ממתין ל-URL
- מספרי תוצאות פרטניים לכל פרויקט
- המלצות לקוחות
