/**
 * משלוח לידים מהמחשבון: דוא"ל (Web3Forms - תמיד), שיקוף לגיליון (אופציונלי),
 * והעלאת קובץ שומה (Cloudinary - אופציונלי). הנתונים הפנימיים של החישוב
 * מופיעים אך ורק כאן - לעולם לא בממשק המשתמש.
 *
 * שמות השדות בגוף המייל תואמים אחד לאחד את הרשימה שהלקוח מסר (§1.3),
 * ומופיעים באותו סדר. Web3Forms מרנדר כל מפתח כתווית בגוף המייל, ולכן
 * שינוי שם מפתח כאן = שינוי התווית שמתן רואה בתיבה.
 */
import { isReliefMarked, type CalcOutcome, type WizardInput } from './logic';

const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY || '';
const SHEETS_URL = import.meta.env.PUBLIC_SHEETS_WEBHOOK_URL || '';
const CLOUDINARY_CLOUD = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_PRESET = import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

export const uploadConfigured = Boolean(CLOUDINARY_CLOUD && CLOUDINARY_PRESET);
export const leadsConfigured = Boolean(WEB3FORMS_KEY);

/** נושא המייל הנשלח אוטומטית על כל בדיקה שהושלמה */
export const LEAD_SUBJECT = 'ליד חדש - מחשבון החזר מס רכישה למכרזי רמ״י';
/**
 * נושא נפרד ובולט לבקשה מפורשת של הפונה שעו״ד ייצור איתו קשר.
 * זהו הליד ה"חם" ביותר, והוא חייב להיבדל מהליד האוטומטי - אחרת Gmail משרשר את
 * שני המיילים לשיחה אחת והבקשה נבלעת בתוך ההודעה הקודמת.
 */
export const CALLBACK_SUBJECT = 'בקשת יצירת קשר מפונה - מחשבון החזר מס רכישה למכרזי רמ״י';
/** נושא נפרד למשוב, כדי שלא ייראה כליד כפול בתיבה */
export const FEEDBACK_SUBJECT = 'משוב על המחשבון - מחשבון החזר מס רכישה למכרזי רמ״י';

const FROM_NAME = 'מחשבון החזר מס רכישה - אתר עו"ד מתן אביר לב';

/** סוגי הקבצים המותרים להעלאת שומה (§1.1) */
export const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
export const MAX_FILE_MB = 10;

/** בדיקת קובץ לפני העלאה. מחזיר הודעת שגיאה, או null אם הקובץ תקין. */
export function validateAssessmentFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return 'ניתן להעלות קובץ מסוג PDF, JPG, JPEG או PNG בלבד.';
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `הקובץ גדול מדי. הגודל המרבי הוא ${MAX_FILE_MB}MB.`;
  }
  return null;
}

/** העלאת קובץ שומה. מחזיר קישור, או null אם ההעלאה נכשלה/לא הוגדרה. */
export async function uploadAssessmentFile(file: File): Promise<string | null> {
  if (!uploadConfigured) return null;
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
      { method: 'POST', body: form },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.secure_url === 'string' ? data.secure_url : null;
  } catch {
    return null;
  }
}

function ils(n: number | null): string {
  if (n === null) return 'לא זמין';
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 2 }).format(n) + ' ₪';
}

function yesNo(v: boolean | null): string {
  if (v === null) return 'לא ידוע';
  return v ? 'כן' : 'לא';
}

function stamp(): string {
  return new Date().toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export interface LeadContext {
  input: WizardInput;
  outcome: CalcOutcome;
  /** הערה חופשית על ההקשר, למשל "המשתמש ביקש חזרה טלפונית" */
  note?: string;
  /**
   * מלכודת הספאם הופעלה. הליד עדיין נשלח - הוא רק מסומן.
   *
   * בעבר פנייה כזו נזרקה בשקט, וזה היה באג: המחשבון הוא אשף בן חמישה שלבים
   * ב-React ללא טופס HTML שניתן להזרקה, כך שבוט כמעט אינו יכול להגיע לכאן,
   * בעוד שהשדה החבוי כן נתפס למילוי אוטומטי של הדפדפן. כלומר כמעט כל הפעלה
   * של המלכודת כאן היא חיובית-שגויה - ולקוח אמיתי שאבד יקר בהרבה מספאם בתיבה.
   */
  suspectedBot?: boolean;
}

/** שדות הליד המלאים, בסדר ובשמות שהלקוח ביקש (§1.3). */
function buildLeadFields({ input, outcome, note, suspectedBot }: LeadContext): Record<string, string> {
  const i = outcome.internal;
  const reliefMarked = isReliefMarked(input.reliefs);

  return {
    // הסטטוס פותח את גוף המייל, כדי שיהיה קריא כבר בתצוגה המקדימה של התיבה
    'סטטוס הליד': outcome.status,

    ...(suspectedBot
      ? { '⚠ סינון אוטומטי': 'מלכודת הספאם הופעלה. ייתכן שזו פנייה אוטומטית - ואולי מילוי אוטומטי של הדפדפן.' }
      : {}),

    'שם מלא': input.fullName,
    'מספר טלפון': input.phone,
    'כתובת דוא"ל': input.email,

    'יישוב': i.settlementName ?? 'לא נבחר',
    'מספר מכרז': i.tenderNumber ?? 'לא זמין',
    'מספר מגרש': i.plotNumber ?? 'לא נבחר',
    'שטח המגרש': i.areaSqm !== null ? `${i.areaSqm} מ"ר` : 'לא זמין',
    'מספר יחידות': i.unitCount !== null ? String(i.unitCount) : 'לא ידוע',
    'האם מדובר במגרש דו־משפחתי': yesNo(i.isDuplex),

    'עלות הקרקע שהמשתמש הזין': i.landCostEntered !== null ? ils(i.landCostEntered) : 'הוזן 0',
    'עלות הפיתוח מתוך נתוני המכרז': ils(i.developmentCostFull),
    'עלות הפיתוח לאחר התאמה למספר היחידות': ils(i.adjustedDevelopmentCost),
    'אחוז הפיתוח המשוקלל':
      i.developmentPercentage !== null
        ? (i.developmentPercentage * 100).toFixed(2) + '%'
        : 'לא זמין',

    'סכום מס הרכישה ששולם בפועל': ils(i.actualTaxPaid),
    'סכום מס הרכישה שחושב במערכת': ils(i.estimatedPurchaseTax),
    'גובה ההפרש': ils(i.difference),
    'האם נמצאה חריגה של מעל 1,500 ש"ח': yesNo(i.difference === null ? null : i.overThreshold),

    'האם נעשה שימוש בהקלה במס': reliefMarked ? 'כן' : 'לא',
    'סוג ההקלה': reliefMarked ? input.reliefs.join(', ') : 'ללא',

    'האם הועלתה שומה': input.assessmentFileUrl ? 'כן' : 'לא',
    'קישור ישיר לקובץ השומה': input.assessmentFileUrl ?? 'לא הועלה',

    'הערות או משוב': input.feedback.trim() || 'טרם נמסר (המשוב נאסף במסך התוצאה)',
    'תאריך ושעת מילוי': stamp(),

    // הקשר תפעולי - לא נדרש ברשימת הלקוח, אך חוסך בירור ידני
    'סיבות לניתוב לבדיקה ידנית':
      outcome.manualReasons.length > 0 ? outcome.manualReasons.join(' | ') : 'אין',
    'הערת מערכת': note ?? 'ללא',
  };
}

function leadBody(subject: string, fields: Record<string, string>): string {
  return JSON.stringify({
    access_key: WEB3FORMS_KEY,
    subject,
    from_name: FROM_NAME,
    botcheck: '',
    ...fields,
  });
}

async function postOnce(subject: string, fields: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: leadBody(subject, fields),
    });
    const data = await res.json().catch(() => null);
    return res.ok && Boolean(data?.success);
  } catch {
    return false;
  }
}

/**
 * שליחה שנשארת בחיים גם כשהדף נסגר.
 *
 * משמשת רק ביציאה מהדף: fetch רגיל מבוטל ברגע שהדפדפן עוזב, ו-keepalive הוא
 * הדגל שמורה לו להשלים את הבקשה ברקע בכל זאת. אין כאן ניסיונות חוזרים ואין
 * המתנה לתשובה - הדף כבר לא יהיה כאן כדי לקרוא אותה.
 */
function postOnExit(subject: string, fields: Record<string, string>): void {
  if (!WEB3FORMS_KEY) return;
  try {
    void fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: leadBody(subject, fields),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* אין למי לדווח - הדף נסגר */
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * שליחה עם ניסיונות חוזרים. הפונה כבר מסר שם, טלפון ודוא"ל וסיים אשף בן חמישה
 * שלבים - הפסד הליד בגלל רשת סלולרית שנפלה לרגע הוא הכישלון היקר ביותר כאן,
 * ולכן שווה להמתין עוד כמה שניות לפני שמכריזים על כישלון.
 */
async function postToWeb3Forms(
  subject: string,
  fields: Record<string, string>,
  attempts = 3,
): Promise<boolean> {
  if (!WEB3FORMS_KEY) return false;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (await postOnce(subject, fields)) return true;
    if (attempt < attempts) await wait(attempt * 800);
  }
  return false;
}

type SheetRecordKind = 'ליד' | 'בקשת יצירת קשר' | 'משוב';

/** שיקוף לגיליון Google Sheets - אם הוגדר; נכשל/לא הוגדר → מדלגים בשקט. */
function mirrorToSheet(ctx: LeadContext, kind: SheetRecordKind): void {
  if (!SHEETS_URL) return;
  const i = ctx.outcome.internal;
  const params = new URLSearchParams({
    'סוג רשומה': kind,
    'שם': ctx.input.fullName,
    'טלפון': ctx.input.phone,
    'דוא"ל': ctx.input.email,
    'יישוב': i.settlementName ?? '',
    'מספר מכרז': i.tenderNumber ?? '',
    'מספר מגרש': i.plotNumber ?? '',
    'שטח': i.areaSqm != null ? String(i.areaSqm) : '',
    'יחידות': i.unitCount != null ? String(i.unitCount) : '',
    'קרקע (הוזן)': i.landCostEntered != null ? String(i.landCostEntered) : '',
    'מס ששולם': String(i.actualTaxPaid),
    'מס מחושב': i.estimatedPurchaseTax != null ? i.estimatedPurchaseTax.toFixed(2) : '',
    'הפרש': i.difference != null ? i.difference.toFixed(2) : '',
    'סטטוס': ctx.outcome.status,
    'הקלות': isReliefMarked(ctx.input.reliefs) ? ctx.input.reliefs.join(', ') : 'ללא',
    'קובץ שומה': ctx.input.assessmentFileUrl ?? '',
    'משוב': ctx.input.feedback ?? '',
    'תאריך יצירת ליד': new Date().toISOString(),
  });
  // Apps Script אינו מחזיר כותרות CORS - שליחת fire-and-forget במצב no-cors
  fetch(SHEETS_URL, { method: 'POST', mode: 'no-cors', body: params }).catch(() => {});
}

/** שליחת ליד מלא. מחזיר האם הדוא"ל נשלח בהצלחה. */
export async function sendLead(ctx: LeadContext): Promise<boolean> {
  const ok = await postToWeb3Forms(LEAD_SUBJECT, buildLeadFields(ctx));
  if (ok) mirrorToSheet(ctx, 'ליד');
  return ok;
}

/**
 * אותו ליד בדיוק, אך נשלח תוך כדי סגירת הדף (ראו postOnExit).
 * fire-and-forget: אי אפשר לחכות לתשובה מדף שכבר איננו.
 */
export function sendLeadOnExit(ctx: LeadContext): void {
  postOnExit(LEAD_SUBJECT, buildLeadFields(ctx));
  mirrorToSheet(ctx, 'ליד');
}

/**
 * הפונה לחץ "אני רוצה שעו״ד ייצור איתי קשר" - הליד החם ביותר במחשבון.
 *
 * זהו ליד *במקום* הליד הרגיל, לא בנוסף אליו: המחשבון מחזיק את הליד האוטומטי
 * בהמתנה קצרה בדיוק כדי שהלחיצה הזו תוכל לתפוס את מקומו (ראו LEAD_GRACE_MS
 * ב-Calculator.tsx). התוצאה היא מייל אחד לכל פונה - עם הסטטוס הנכון.
 */
export async function sendCallbackRequest(ctx: LeadContext, note: string): Promise<boolean> {
  const fields = buildLeadFields({ ...ctx, note });
  const ok = await postToWeb3Forms(CALLBACK_SUBJECT, {
    'סוג הפנייה': 'הפונה ביקש במפורש שעו״ד מיסוי מקרקעין ייצור איתו קשר',
    ...fields,
  });
  if (ok) mirrorToSheet({ ...ctx, note }, 'בקשת יצירת קשר');
  return ok;
}

/**
 * §1.2 - המשוב נאסף אחרי שהתוצאה כבר הוצגה, כלומר אחרי שהליד כבר יצא.
 * לכן הוא נשלח כהודעה נפרדת ומסומנת, ולא כליד שני: מתן מקבל בתיבה
 * "ליד חדש..." ואחריו, אם המשתמש הגיב, "משוב על המחשבון..." עם אותם פרטי זיהוי.
 */
export async function sendFeedback(ctx: LeadContext, feedback: string): Promise<boolean> {
  const trimmed = feedback.trim();
  if (!trimmed) return false;

  const withFeedback: LeadContext = {
    ...ctx,
    input: { ...ctx.input, feedback: trimmed },
  };

  const ok = await postToWeb3Forms(FEEDBACK_SUBJECT, {
    'סוג הפנייה': 'משוב על המחשבון (הליד המלא נשלח בנפרד)',
    'שם מלא': ctx.input.fullName,
    'מספר טלפון': ctx.input.phone,
    'כתובת דוא"ל': ctx.input.email,
    'סטטוס הליד': ctx.outcome.status,
    'יישוב': ctx.outcome.internal.settlementName ?? 'לא נבחר',
    'מספר מגרש': ctx.outcome.internal.plotNumber ?? 'לא נבחר',
    'הערות או משוב': trimmed,
    'תאריך ושעת המשוב': stamp(),
  });

  if (ok) mirrorToSheet(withFeedback, 'משוב');
  return ok;
}
