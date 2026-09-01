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

## מצב המייל

**מחובר ועובד.** Resend שולח, הדומיין `shaiomedia.com` מאומת.

| משתנה | ערך |
|---|---|
| `RESEND_API_KEY` | מוגדר (טוקן שליחה בלבד) |
| `LEAD_FROM` | `leads@shaiomedia.com` |
| `LEAD_TO` | `contact@shaiomedia.com` |

`reply_to` נקבע אוטומטית לכתובת של הפונה, אז לחיצה על "השב" פותחת מייל אליו.

### נקודה אחת לשיפור מסירה

ה-SPF של הדומיין הוא `v=spf1 a mx ~all` והוא **לא כולל את Resend**.
המיילים כן מגיעים, כי DKIM חתום ותקין ו-DMARC מיושר דרכו, אבל חלק
מהשרתים מסתכלים גם על SPF.

Resend משתמש ב-`send.shaiomedia.com` כנתיב חזרה, ושם ה-SPF שלהם כבר קיים.
זה מספיק לרוב המקרים. אם תראה מיילים נופלים לספאם, שווה להוסיף לרשומת
ה-SPF הראשית את ה-include ש-Resend נותנים בפאנל שלהם. **אל תשנה את ה-SPF
בלי לגבות אותו קודם** — הוא משרת גם את הדואר הרגיל שלך דרך `mail.shaiomedia.com`.
