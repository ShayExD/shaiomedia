# social

מנוע גרפיקות לפוסטים בעברית, בנוי על מערכת העיצוב של `service.shaiomedia.com`.
אותה פלטה, אותו Rubik, אותם צילומי מסך של הלקוחות. פוסט ועמוד נחיתה נראים כמו מותג אחד.

## שימוש

```bash
cd social

# רינדור כל הפוסטים בתיקיית posts/
node render.mjs render

# רינדור פוסט אחד
node render.mjs render posts/01-compare.json

# צילום אתר חי בתור "לפני" (זה מה שמאפשר את הפנייה הקרה)
node render.mjs capture https://example-locksmith.com example-locksmith
```

פלט: `out/<id>-<size>.png` ב-2x, מוכן להעלאה.

אם playwright לא נמצא: `npm i playwright` מתוך `social/`.

## תבניות

| template | למה משמש |
|---|---|
| `beforeAfter` | שני מסכים זה מול זה. האתר שלו היום מול אתר שבנית. הכי ממיר |
| `showcase` | אתר אחד גדול עם צ'יפים של מה נבנה. פוסט קטלוג |
| `stat` | מספר אחד ענק. הוכחה |
| `lesson` | טעות השבוע. טקסט נושא הכל |
| `offer` | מסלול ה-300 וה-3,000. תגובה ישירה |

## שדות

```jsonc
{
  "id": "01-compare",
  "template": "beforeAfter",
  "vertical": "roofing",        // construction | roofing | chimney | locksmith | garage
  "theme": "dark",              // dark (ברירת מחדל) | light
  "city": "אורנג׳ קאונטי",
  "headline": "...",
  "sub": "...",
  "before": "@wcoasthome",      // @slug → public/images/sites/<slug>-mobile.webp
  "after":  "@pwcroofing",      //        או social/assets/<slug>.png מ-capture
  "sizes": ["feed", "story"]    // feed 1080x1350 | square 1080x1080 | story 1080x1920 | og 1200x630
}
```

`vertical` קובע את צבע ההדגשה: כחול לבנייה, ירוק לגגות, ענבר לארובות, אדום למנעולנות, סגול לדלתות גראז'.

## שני כללים

1. **טקסט עברי לא נוצר במודל תמונה.** לא Gemini, לא FLUX, לא אף אחד.
   כל אות כאן היא DOM אמיתי ב-Rubik. זו כל הסיבה שהמנוע הזה קיים.
2. **ב-`stat` נכנסים רק מספרים שאפשר לגבות.** מספר שהומצא בפוסט הוא
   הדבר היחיד שיכול להרוס לך את המוניטין בקהילה הזאת.

## פרומפט לקופי

```
כתוב פוסט לאינסטגרם ולפייסבוק בעברית.

קהל: בעלי עסקי שירות ישראלים שחיים בארצות הברית. קבלנים, גגנים,
מנעולנים, מנקי ארובות, דלתות גראז'. גילאי 30 עד 55, מגלגלים בין
חצי מיליון לשלושה מיליון דולר בשנה, מביאים עבודות מהפה לאוזן
ומקניית לידים, וחושדים במשווקים.

עמוד תוכן: [לפני ואחרי / פירוק / מספרים / טעות / זהות / הצעה]
נושא: [הנושא]

כללי כתיבה:
- עברית מדוברת, כמו הודעת וואטסאפ לחבר, לא כמו שיווק
- מותר לערבב מונחים באנגלית כמו שישראלים בארה"ב מדברים:
  ליד, קול, ג'וב, קסטומר, גוגל ביזנס
- שורה ראשונה עוצרת גלילה. אמירה או מספר, לא שאלה רטורית
- 4 עד 7 שורות קצרות עם רווח בין שורה לשורה
- בלי אימוג'ים, בלי מקפים ארוכים, בלי "פתרונות" ו"חוויה"
- בלי הבטחות שאי אפשר לגבות
- קריאה לפעולה אחת בסוף, ספציפית

תן 3 ואריאציות קופי, ו-3 אפשרויות כותרת לגרפיקה (עד 6 מילים).
```

## פרומפטים ל-Gemini

Gemini משמש כאן לתמונות של אנשים ולרקעים בלבד, אף פעם לא לטקסט.

**שיפור תמונה של בעל העסק**

```
Enhance this photo of a business owner for use on a professional service
company website.

Keep the person's face, expression, clothing and identity exactly as they
are. Do not alter facial features.

Improve only: lighting to soft natural daylight, remove background clutter
and replace with a clean neutral or job-site context, correct color balance,
sharpen slightly.

Photorealistic, no stylization. Should look like a real photo taken by a
professional photographer.
```

**רקע לגרפיקה**

```
Wide background image for a marketing graphic. [roofing / locksmith /
chimney / remodeling] work in progress in a Southern California residential
neighborhood. Real workers, real tools, natural late-afternoon light.
Photorealistic, documentary style, shallow depth of field. Leave the upper
third visually calm for a text overlay.

No text, no words, no letters, no logos anywhere in the image.
```

השורה האחרונה חובה. בלעדיה המודל ידחוף אותיות מומצאות לתמונה.
