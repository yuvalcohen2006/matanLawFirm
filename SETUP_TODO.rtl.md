# SETUP_TODO — צ'קליסט עלייה לאוויר

פעולות ידניות שרק בעל האתר יכול לבצע, לפי סדר מומלץ.

## 1. פרטי המשרד

- [ ] מלאו את **`src/data/site-details.json`** — כל שדה מוסבר ב-`src/data/site-details.README.md`. שדות שערכם מתחיל ב-`PLACEHOLDER` חייבים מילוי (טלפון, דוא״ל, כתובת, וואטסאפ, דומיין). שדות אופציונליים (רשתות חברתיות, GA, פיקסל) אפשר להשאיר ריקים — הם פשוט לא יוצגו.

## 2. משלוח לידים (חובה)

- [ ] פתחו חשבון חינמי ב-[web3forms.com](https://web3forms.com) **עם הכתובת `Matan@abirlev.com`** (הלידים נשלחים לכתובת שאליה שויך המפתח).
- [ ] העתיקו את ה-Access Key לקובץ `.env` בשורש הפרויקט (העתיקו את `.env.example` ל-`.env`): `WEB3FORMS_ACCESS_KEY=...` — ובפריסה ב-Cloudflare Pages הגדירו אותו כ-Environment Variable באותו שם.
- [ ] בנו ופרסו, מלאו את המחשבון עד תוצאה ולחצו על כפתור החזרה — ודאו שליד הגיע ל-`Matan@abirlev.com` עם כל השדות בעברית.
- [ ] שלחו גם את טופס יצירת הקשר בעמוד הבית — ודאו שהגיע ושההפניה לעמוד התודה עובדת.

## 3. אופציונלי: שיקוף לידים ל-Google Sheets

- [ ] צרו גיליון חדש עם שורת כותרות: `שם | טלפון | דוא"ל | יישוב | מספר מכרז | מספר מגרש | מס ששולם | מס מחושב | הפרש | סטטוס | הקלות | קובץ שומה | תאריך יצירת ליד`.
- [ ] ב-Extensions ‏→ Apps Script הדביקו:

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const p = e.parameter;
  sheet.appendRow([
    p['שם'], p['טלפון'], p['דוא"ל'], p['יישוב'], p['מספר מכרז'], p['מספר מגרש'],
    p['מס ששולם'], p['מס מחושב'], p['הפרש'], p['סטטוס'], p['הקלות'],
    p['קובץ שומה'], p['תאריך יצירת ליד'],
  ]);
  return ContentService.createTextOutput('ok');
}
```

- [ ] Deploy ‏→ New deployment ‏→ Web app ‏→ Execute as: Me ‏→ Who has access: **Anyone**. העתיקו את כתובת ה-Web App ל-`SHEETS_WEBHOOK_URL` ב-`.env` ובמשתני הסביבה של הפריסה. אם המשתנה ריק — המערכת מדלגת בשקט והדוא״ל ממשיך לעבוד.

## 4. אופציונלי: העלאת קובץ שומת המס במחשבון

Web3Forms בחינם אינו תומך בצירוף קבצים, לכן ההעלאה ממומשת דרך Cloudinary (חינמי) והקישור לקובץ נכלל בליד:

- [ ] פתחו חשבון חינמי ב-[cloudinary.com](https://cloudinary.com), ובהגדרות ‏→ Upload צרו **Unsigned upload preset**.
- [ ] מלאו ב-`.env` ובמשתני הסביבה: `CLOUDINARY_CLOUD_NAME=...` ו-`CLOUDINARY_UPLOAD_PRESET=...`.
- [ ] אם לא תגדירו — שדה ההעלאה פשוט לא יוצג, והליד יציין שלפונה יש עותק של השומה.

## 5. אימות נתוני המכרזים (קריטי)

- [ ] עברו על **`EXTRACTION_REPORT.md`** מול ארבע חוברות המכרז שב-`assets/` — לכל מגרש מצוין עמוד המקור.
- [ ] שימו לב לדגל היחיד: **רמת ישי מגרש 112** — סתירה פנימית בחוברת לגבי מספר יחידות הדיור (נספח ב' אומר 2; ההזמנה, שער החוברת ונספח ב'1 אומרים 1). עד לאימות מול רמ״י, המחשבון מפנה את המגרש הזה אוטומטית ל"נדרשת בדיקה פרטנית". לאחר אימות עדכנו את `unitCount`, `landCostPerUnit`, `needsManualFill: false` ב-`src/data/plots.json`.

## 6. נכסים גרפיים

- [x] בוצע — הלוגו האמיתי נמצא ב-`public/logo.png` ומחובר דרך `logoPath` ב-site-details.
- [x] בוצע — תמונת הפורטרט נמצאת ב-`public/images/matan.webp` ומחוברת דרך `portraitPath` ב-site-details.

## 7. דומיין ופריסה — Cloudflare Pages (חינמי, ללא הגבלת תעבורה)

- [ ] רכשו/חברו דומיין (למשל דרך Cloudflare Registrar) ועדכנו את `domain` ב-site-details.
- [ ] העלו את הפרויקט ל-GitHub (ללא `.env`!).
- [ ] ב-[dash.cloudflare.com](https://dash.cloudflare.com) ‏→ Workers & Pages ‏→ Create ‏→ Pages ‏→ חברו את הרפוזיטורי עם ההגדרות:
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Environment variables: `WEB3FORMS_ACCESS_KEY` (+ האופציונליים אם הוגדרו)
- [ ] לאחר הפריסה: Custom domains ‏→ הוסיפו את הדומיין.
- חלופה (fallback): **Netlify** — אותן הגדרות בדיוק (build: `npm run build`, publish: `dist`); בחינם יש מגבלת 100GB תעבורה לחודש.

## 8. אישור עו״ד לפני פרסום

- [ ] חפשו בקוד את הסימון `<!-- REVIEW BY LAWYER -->` (מדיניות פרטיות, תקנון, הצהרת נגישות) ואשרו כל קטע.
- [ ] קראו את שבע ההבהרות בתחתית המחשבון ואת כל מסכי המחשבון — הנוסח חייב להתאים לדרישות כללי לשכת עורכי הדין.
- [ ] ודאו שתאריכי "עדכון אחרון" בעמודים המשפטיים נכונים ליום הפרסום.

## 9. הוספת מכרזים עתידיים

עורכים את `src/data/plots.json`: מוסיפים אובייקט יישוב חדש למערך `settlements` (המבנה מתועד ב-`src/data/plots.schema.md`), עם המגרשים, המחירים ואחוז הביצוע המשוקלל. תפריטי המחשבון מתעדכנים אוטומטית — אין צורך לגעת בקוד.
