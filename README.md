# shaiomedia.com

עמוד נחיתה בעברית לעסקי שירות בארצות הברית: בנייה ושיפוצים, גגות, ארובות ומנעולנות.
Astro 7 + Tailwind 4, סטטי לגמרי, מיועד ל-Cloudflare Pages.

**עשר פאלטות להשוואה:** https://shayexd.github.io/shaiomedia/

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

עשר פאלטות מועמדות. כולן בנויות על אותו רעיון: **לכל תחום צבע משלו**.
הצבע הוא טקסונומיה ולא קישוט — הפילטרים, תוויות הכרטיסים והסימונים
כולם שואבים מ-`--v` שנקבע לפי התחום.

| # | שם | קישור חי | דיו | מוביל |
|---|---|---|---|---|
| 01 | יער | [forest](https://shayexd.github.io/shaiomedia/forest/) | `#0F1F19` | `#1E7A55` |
| 02 | זית ואדמה | [olive](https://shayexd.github.io/shaiomedia/olive/) | `#1D1C15` | `#6E7F3C` |
| 03 | יין | [wine](https://shayexd.github.io/shaiomedia/wine/) | `#1A1114` | `#8E2740` |
| 04 | אדום עז | [crimson](https://shayexd.github.io/shaiomedia/crimson/) | `#161413` | `#D12E32` |
| 05 | נייבי קלאסי | [navy](https://shayexd.github.io/shaiomedia/navy/) | `#0D1A2B` | `#1B4F8A` |
| 06 | פלדה כחולה | [steel](https://shayexd.github.io/shaiomedia/steel/) | `#14191E` | `#35708C` |
| 07 | טורקיז ופחם | [teal](https://shayexd.github.io/shaiomedia/teal/) | `#10201F` | `#10756E` |
| 08 | חמרה | [clay](https://shayexd.github.io/shaiomedia/clay/) | `#1E1714` | `#B4552D` |
| 09 | גרפיט | [graphite](https://shayexd.github.io/shaiomedia/graphite/) | `#141414` | `#3F3F3F` |
| 10 | שחור ולבן חד | [onyx](https://shayexd.github.io/shaiomedia/onyx/) | `#0A0A0A` | `#0A0A0A` |

`palettes.py` הוא המפרט היחיד. ממנו נגזרים קבצי ה-CSS, הלוגואים, הפאביקונים
ותמונות השיתוף. `./build-variants.sh` בונה את כולן ומעלה אותן זו לצד זו.
כדי לקבע אחת: להעתיק את `palette-<id>.css` ל-`palette.css` ואת קבצי
`public/variants/<id>/` ל-`public/`.

הלוגו נצבע מחדש לאותם שני צבעים. המקור בנייבי/סגול נשמר ב-`public/logo-original.png`
כדי שאפשר יהיה לשנות פאלטה שוב בלי לאבד אותו.

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
