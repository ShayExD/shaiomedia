# העלאה ל-service.shaiomedia.com

## מה שחשוב לדעת לפני

ה-DNS של `shaiomedia.com` **לא יושב בקלאודפלייר** אלא ב-servers24
(`mega.servers24.cloud`, `tron.servers24.cloud`). בדקתי.

לכן **לא נוגעים ב-nameservers.** אם נעביר את כל הדומיין לקלאודפלייר זה
ישפיע גם על אתר הוורדפרס החי. במקום זה מוסיפים רשומת CNAME אחת לתת-הדומיין,
וזה כל מה שנדרש. קלאודפלייר תומכת בזה גם כשהזון עצמו לא אצלה.

---

## שלב 1 — התחברות

```bash
cd ~/shaiomedia
npx wrangler login
```

נפתח דפדפן. זה השלב היחיד שאני לא יכול לעשות במקומך.

## שלב 2 — יצירה והעלאה ראשונה

```bash
npm run deploy
```

הפעם הראשונה תשאל אם ליצור פרויקט בשם `shaiomedia-service`. תאשר.
בסוף תקבל כתובת `https://shaiomedia-service.pages.dev`.

## שלב 3 — משתני סביבה

בדשבורד: **Workers & Pages → shaiomedia-service → Settings → Variables and Secrets**

| שם | ערך | חובה |
|---|---|---|
| `LEAD_TO` | `contact@shaiomedia.com` | כן |
| `LEAD_FROM` | `site@shaiomedia.com` | כן |
| `ALLOWED_ORIGIN` | `https://service.shaiomedia.com` | כן |
| `RESEND_API_KEY` | מפתח Resend | לא |
| `CRM_WEBHOOK_URL` | ה-endpoint של ה-CRM | לא |
| `CRM_WEBHOOK_TOKEN` | טוקן ל-CRM | לא |
| `TURNSTILE_SECRET` | ראה בהמשך | לא |

או משורת הפקודה:

```bash
npx wrangler pages secret put LEAD_TO --project-name=shaiomedia-service
```

**`LEAD_FROM` חייב להיות בדומיין שבבעלותך** עם SPF/DKIM תקינים, אחרת המייל
ייחסם. אם אין לך את זה מוכן, פתח חשבון Resend, אמת את הדומיין, ושים
`RESEND_API_KEY`. זה הכי אמין.

## שלב 4 — הדומיין

בדשבורד: **shaiomedia-service → Custom domains → Set up a domain**
הזן `service.shaiomedia.com`.

קלאודפלייר תיתן לך רשומת CNAME. **בפאנל ה-DNS של servers24** הוסף:

```
Type:   CNAME
Name:   service
Value:  shaiomedia-service.pages.dev
TTL:    3600
```

תוך כמה דקות עד שעה התעודה תונפק אוטומטית והאתר יעלה ב-HTTPS.

## שלב 5 — בדיקה

```bash
curl -sI https://service.shaiomedia.com | head -12
curl -s https://service.shaiomedia.com/robots.txt
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'content-type: application/json' -H 'origin: https://service.shaiomedia.com' \
  -d '{"name":"בדיקה","email":"you@example.com","phone":"0501234567","service":"גגות"}' \
  https://service.shaiomedia.com/api/lead
```

התשובה האחרונה צריכה להיות `200`, ומייל אמור להגיע.

## שלב 6 — Search Console

הוסף `https://service.shaiomedia.com` כ-**property נפרד**. תת-דומיין הוא אתר
נפרד מבחינת גוגל. הגש את `https://service.shaiomedia.com/sitemap-index.xml`.

---

## Turnstile (מומלץ, לא חובה)

הטופס מוגן היום ב-honeypot ובחסימת origin. זה עוצר בוטים כלליים אבל לא
מישהו שמכוון אליך ספציפית. Turnstile של קלאודפלייר חינמי ובלתי נראה:

1. דשבורד → **Turnstile** → Add site → `service.shaiomedia.com`
2. את ה-**Secret Key** שים כמשתנה `TURNSTILE_SECRET` ב-Pages
3. את ה-**Site Key** שים כמשתנה בנייה `PUBLIC_TURNSTILE_KEY`
4. `npm run deploy`

הקוד כבר תומך בשני הצדדים, וה-CSP מתרחב אוטומטית לכלול את הדומיין של
קלאודפלייר רק כשהמפתח קיים.

## הגבלת קצב (מומלץ)

Pages Functions לא שומרות מצב, אז הגבלת קצב אמיתית נעשית ברמת הרשת:
**דשבורד → Security → WAF → Rate limiting rules**

```
אם  URI Path שווה ל /api/lead
אז  חסום ל-10 דקות
מעל 5 בקשות ב-10 דקות מאותו IP
```

זה מגן על תיבת המייל ועל המכסה ב-Resend.


---

## מצב המייל (עודכן 01.09.2026)

**עובד**, אבל בהגדרה זמנית:

| משתנה | ערך נוכחי | למה |
|---|---|---|
| `RESEND_API_KEY` | מוגדר | הטוקן מוגבל לשליחה בלבד, וזו הגדרה נכונה |
| `LEAD_FROM` | `onboarding@resend.dev` | אין עדיין דומיין מאומת ב-Resend |
| `LEAD_TO` | `info@shaiomedia.com` | שולח הבדיקה של Resend מורשה לשלוח רק לבעל החשבון |

### כדי לעבור ל-contact@shaiomedia.com

צריך דומיין מאומת אחד. **תאמת תת-דומיין, לא את הדומיין הראשי.**

הסיבה: ל-`shaiomedia.com` יש דואר חי (`MX mail.shaiomedia.com`) ו-SPF
`v=spf1 a mx ~all`. אימות הדומיין הראשי דורש נגיעה ב-SPF של דומיין שמטפל
בדואר האמיתי שלך. תת-דומיין מבודד לחלוטין ואפס סיכון לדואר הקיים.

1. **resend.com/domains → Add Domain →** `service.shaiomedia.com`
2. Resend ייתן שלוש רשומות. תוסיף אותן בפאנל של servers24
3. לחץ **Verify**
4. אז מריצים:

```bash
cd ~/shaiomedia
set -a && . ./.cfenv && set +a
W=./node_modules/.bin/wrangler
printf "noreply@service.shaiomedia.com" | $W pages secret put LEAD_FROM --project-name=shaiomedia-service
printf "contact@shaiomedia.com"          | $W pages secret put LEAD_TO   --project-name=shaiomedia-service
npm run deploy
```

מרגע שדומיין אחד מאומת, אפשר לשלוח לכל כתובת, כולל `contact@shaiomedia.com`.
