/**
 * מחשבון החזר מס רכישה לזוכים במכרזי רמ"י - אשף רב-שלבי (React island יחיד באתר).
 * כל המחרוזות מלקוחות המפרט כלשונן. הערכים המחושבים לעולם אינם מוצגים:
 * הם חיים ב-CalcOutcome.internal ונשלחים בליד בלבד (§14).
 */
import { useEffect, useRef, useState } from 'react';
import {
  settlements,
  evaluate,
  isReliefMarked,
  parseMoney,
  isValidIsraeliPhone,
  isValidEmail,
  PLOT_NOT_FOUND,
  RELIEF_OPTIONS,
  type CalcOutcome,
  type ReliefOption,
  type WizardInput,
  type YesNoUnsure,
} from './logic';
import {
  sendLead,
  sendLeadOnExit,
  sendCallbackRequest,
  sendFeedback,
  uploadAssessmentFile,
  uploadConfigured,
  validateAssessmentFile,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_MB,
  type LeadContext,
} from './leads';
import site from '../../data/site-details.json';
import './calculator.css';

/**
 * אם השליחה נכשלה - הפונה חייב דרך אחרת להגיע אלינו, ולא רק הודעת שגיאה.
 * filled() הוא אותו שומר שבו משתמש שאר האתר: שדה שנותר PLACEHOLDER אינו מוצג,
 * אחרת נציג קישור חיוג שבור בדיוק ברגע שבו הפונה כבר נכשל פעם אחת.
 */
const filled = (v: string | undefined | null): v is string =>
  Boolean(v && !v.includes('PLACEHOLDER'));

const phoneHref = filled(site.phone) ? `tel:${site.phone.replace(/[^\d+]/g, '')}` : null;
const whatsappHref = filled(site.whatsappNumber)
  ? `https://wa.me/${site.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
      'שלום, ביצעתי בדיקה במחשבון החזר מס הרכישה ואשמח שעו״ד ייצור איתי קשר.',
    )}`
  : null;

type Screen = 'intro' | 1 | 2 | 3 | 4 | 5 | 'loading' | 'result';

const STEP_TITLES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'נתחיל בכמה פרטים',
  2: 'פרטי המכרז והמגרש',
  3: 'פרטי מס הרכישה',
  4: 'הקלות או הטבות במס',
  5: 'עלות רכיב הקרקע',
};

const STEP_SHORT: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'פרטים',
  2: 'מכרז ומגרש',
  3: 'מס הרכישה',
  4: 'הקלות במס',
  5: 'רכיב הקרקע',
};

/** §17 - הבהרות משפטיות בתחתית המחשבון */
const DISCLAIMERS = [
  'המחשבון מבצע בדיקה ראשונית בלבד על בסיס הנתונים שהוזנו על ידי המשתמש ועל בסיס נתונים שנלקחו מחוברות מכרזי רשות מקרקעי ישראל.',
  'הבדיקה אינה מהווה ייעוץ משפטי, ייעוץ מס, חוות דעת משפטית או התחייבות לקבלת החזר מס.',
  'תוצאת המחשבון אינה מחליפה בדיקה פרטנית של שומת מס הרכישה, מסמכי העסקה, מועדי העסקה, נתוני המכרז, הוראות הדין והנסיבות האישיות של המשתמש.',
  'ייתכנו הבדלים בין נתוני חוברת המכרז לבין הנתונים שנלקחו בחשבון במסגרת הדיווח והשומה בפועל.',
  'הזכאות לתיקון שומה או להחזר מס כפופה לבדיקת המסמכים, להוראות הדין, למועדים הקבועים בחוק ולהחלטת רשות המסים.',
  'אין בתוצאת המחשבון משום הבטחה, התחייבות או מצג שלפיו המשתמש זכאי להחזר.',
  '© עו״ד מתן אביר לב. כל הזכויות שמורות.',
];

/** §11.1 - מסך חובה לפני תחילת המחשבון */
const CONSENT_QUESTION =
  'אני מאשר/ת כי עורך דין העוסק במיסוי מקרקעין יעבור על תשובותיי ויהיה רשאי ליצור עמי קשר במקרה שבו תתקבל תוצאה המצביעה על אפשרות להחזר מס.';
const CONSENT_REFUSED = 'לצורך ביצוע הבדיקה נדרש אישור להעברת הנתונים וליצירת קשר.';

/** §11.2 - הודעת פיילוט */
const PILOT_NOTICE = 'התחלנו בפיילוט עם ארבעה מכרזים ונשמח לשמוע את דעתכם.';

/** §11.7 - מסך טעינה לפני התוצאה */
const LOADING_STEPS = [
  'בודקים את נתוני המכרז…',
  'מחשבים את רכיבי העסקה…',
  'משווים לשומת מס הרכישה…',
];
const LOADING_STEP_MS = 900;

const CONFIRMATION_TEXT = 'הפרטים התקבלו בהצלחה. נציג משרדנו ייצור איתך קשר לצורך בדיקה נוספת.';

/**
 * כמה זמן הליד האוטומטי ממתין לפני שהוא יוצא לדרך.
 *
 * זהו חלון ההזדמנות שבו לחיצה על "אני רוצה שעו״ד ייצור איתי קשר" עוד יכולה לתפוס
 * את מקומו, כך שמתן יקבל מייל אחד ולא שניים. הכפתור יושב מיד מתחת לתוצאה, ומי
 * שלוחץ עליו לוחץ תוך שניות ספורות - 90 שניות הן מרווח נדיב.
 *
 * ארוך מדי = מתן ממתין ללא צורך לליד של מי שלא ילחץ לעולם.
 * קצר מדי  = לחיצה מאוחרת תגיע אחרי שהליד הרגיל כבר יצא, ואז יישלחו שני מיילים.
 */
const LEAD_GRACE_MS = 90_000;

/** §1.1 - העלאת שומת מס הרכישה. הניסוח כלשונו מהלקוח. */
const UPLOAD_LABEL = 'העלאת שומת מס הרכישה';
const UPLOAD_HELP = 'ניתן להעלות את שומת מס הרכישה לצורך בדיקה מקצועית ומדויקת יותר.';

/** §1.2 - המשוב יושב במסך האחרון בלבד, אחרי התוצאה. הניסוח כלשונו מהלקוח. */
const FEEDBACK_TITLE = 'נשמח לשמוע מה דעתכם על המחשבון';
const FEEDBACK_INTRO =
  'המחשבון נמצא בשלב פיילוט. נשמח לקבל הערות, הצעות או מידע נוסף שיסייע לנו לשפר את הבדיקה.';
const FEEDBACK_LABEL = 'הערות או משוב';

export default function Calculator() {
  const [screen, setScreen] = useState<Screen>('intro');

  // --- intro / consent gate (§11.1) ---
  const [consent, setConsent] = useState<'כן' | 'לא' | ''>('');

  // --- step 1 ---
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [boughtFromRmi, setBoughtFromRmi] = useState<YesNoUnsure | ''>('');
  const [honeypot, setHoneypot] = useState('');

  // --- step 2 ---
  const [settlementId, setSettlementId] = useState('');
  const [plotNumber, setPlotNumber] = useState('');

  // --- step 3 ---
  const [taxPaidRaw, setTaxPaidRaw] = useState('');
  const [hasAssessment, setHasAssessment] = useState<YesNoUnsure | ''>('');
  const [assessmentFile, setAssessmentFile] = useState<File | null>(null);

  // --- step 4 ---
  const [reliefs, setReliefs] = useState<ReliefOption[]>([]);

  // --- step 5 ---
  const [landCostRaw, setLandCostRaw] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStep, setLoadingStep] = useState(0);

  const [outcome, setOutcome] = useState<CalcOutcome | null>(null);
  const inputRef = useRef<WizardInput | null>(null);
  const callbackSentRef = useRef(false);
  const [callback, setCallback] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  /**
   * מתן מקבל מייל אחד לכל פונה - לא שניים.
   *
   * הליד האוטומטי אינו נשלח ברגע שהתוצאה מוצגת, אלא מוחזק בהמתנה קצרה. אם הפונה
   * לוחץ "אני רוצה שעו״ד ייצור איתי קשר", הלחיצה *מבטלת* את הליד הממתין ותופסת
   * את מקומו - מייל אחד, עם הסטטוס הנכון. אם הפונה אינו לוחץ, הליד הרגיל יוצא
   * בתום ההמתנה, או מוקדם מכך אם הוא עוזב את הדף.
   *
   * leadSentRef הוא השומר היחיד: ברגע שיצא מייל ליד כלשהו, אף מסלול אחר לא ישלח
   * מייל שני.
   */
  const pendingLeadRef = useRef<LeadContext | null>(null);
  const leadSentRef = useRef(false);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- feedback, collected on the result screen only (§1.2) ---
  const [feedback, setFeedback] = useState('');
  const [feedbackState, setFeedbackState] = useState<'idle' | 'sending' | 'sent' | 'failed'>(
    'idle',
  );

  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  function cancelGraceTimer() {
    if (graceTimerRef.current !== null) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }

  /** שולח את הליד הממתין - פעם אחת בלבד, לא משנה מי קרא. */
  function flushPendingLead(onExit: boolean) {
    if (leadSentRef.current) return;
    const ctx = pendingLeadRef.current;
    if (!ctx) return;

    leadSentRef.current = true;
    pendingLeadRef.current = null;
    cancelGraceTimer();

    if (onExit) sendLeadOnExit(ctx);
    else void sendLead(ctx);
  }

  /**
   * הפונה עוזב את הדף בלי ללחוץ - הליד הממתין חייב לצאת עכשיו, אחרת הוא אבד.
   *
   * event.persisted מבדיל בין השניים: true אומר שהדף נכנס ל-bfcache, כלומר
   * המשתמש רק העביר אפליקציה/לשונית ועוד עשוי לחזור וללחוץ - ואז אסור לשלוח,
   * אחרת נקבל בדיוק את המייל הכפול שניסינו למנוע. false אומר שהדף באמת נסגר.
   */
  useEffect(() => {
    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return;
      flushPendingLead(true);
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      cancelGraceTimer();
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
    if (screen !== 'intro') {
      rootRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }, [screen]);

  const settlement = settlements.find((s) => s.id === settlementId);
  const plot = settlement?.plots.find((p) => p.plotNumber === plotNumber) ?? null;
  const reliefMarked = isReliefMarked(reliefs);

  function setError(key: string, msg: string | null) {
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  }

  function validateStep(step: 1 | 2 | 3 | 4 | 5): boolean {
    const next: Record<string, string> = {};
    if (step === 1) {
      if (fullName.trim().length < 2) next.fullName = 'יש להזין שם מלא';
      if (!isValidIsraeliPhone(phone)) next.phone = 'יש להזין מספר טלפון ישראלי תקין';
      if (!isValidEmail(email)) next.email = 'יש להזין כתובת דוא״ל תקינה';
      if (!boughtFromRmi) next.boughtFromRmi = 'יש לבחור תשובה';
    }
    if (step === 2) {
      if (!settlementId) next.settlementId = 'יש לבחור יישוב';
      if (!plotNumber) next.plotNumber = 'יש לבחור מספר מגרש';
    }
    if (step === 3) {
      const tax = parseMoney(taxPaidRaw);
      if (tax === null || tax <= 0) next.taxPaid = 'יש להזין סכום בש״ח, בספרות בלבד';
      if (!hasAssessment) next.hasAssessment = 'יש לבחור תשובה';
    }
    if (step === 4) {
      if (reliefs.length === 0) next.reliefs = 'יש לבחור לפחות אפשרות אחת';
    }
    if (step === 5) {
      const land = parseMoney(landCostRaw);
      if (land === null) next.landCost = 'יש להזין סכום בש״ח (אפשר לרשום 0), בספרות בלבד';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function toggleRelief(option: ReliefOption) {
    setReliefs((prev) => {
      // "לא" ו"לא יודע" סותרות בחירה בהקלה ספציפית
      if (option === 'לא' || option === 'לא יודע') {
        return prev.includes(option) ? [] : [option];
      }
      const cleaned = prev.filter((r) => r !== 'לא' && r !== 'לא יודע');
      return cleaned.includes(option)
        ? cleaned.filter((r) => r !== option)
        : [...cleaned, option];
    });
    setError('reliefs', null);
  }

  /**
   * §1.1 - העלאת השומה היא אופציונלית ולעולם אינה חוסמת את המשך המחשבון:
   * קובץ פסול נדחה כאן עם הודעה, והמשתמש יכול פשוט להמשיך בלעדיו.
   */
  function onFileChange(file: File | null) {
    if (!file) {
      setAssessmentFile(null);
      setError('file', null);
      return;
    }
    const problem = validateAssessmentFile(file);
    if (problem) {
      setAssessmentFile(null);
      setError('file', problem);
      return;
    }
    setAssessmentFile(file);
    setError('file', null);
  }

  /** §11.7 - מסך הטעינה רץ במקביל להעלאת הקובץ ולחישוב, ואז נחשפת התוצאה. */
  async function showResult() {
    if (!validateStep(5)) return;

    setLoadingStep(0);
    setScreen('loading');

    const minimumWait = new Promise<void>((resolve) => {
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        if (i >= LOADING_STEPS.length) {
          clearInterval(timer);
          resolve();
        } else {
          setLoadingStep(i);
        }
      }, LOADING_STEP_MS);
    });

    const uploadPromise: Promise<string | null> =
      assessmentFile && uploadConfigured ? uploadAssessmentFile(assessmentFile) : Promise.resolve(null);

    const [fileUrl] = await Promise.all([uploadPromise, minimumWait]);

    const input: WizardInput = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      boughtFromRmi: boughtFromRmi as YesNoUnsure,
      settlementId,
      plotNumber,
      actualTaxPaid: parseMoney(taxPaidRaw) ?? NaN,
      hasAssessment: hasAssessment as YesNoUnsure,
      assessmentFileUrl: fileUrl,
      assessmentFileName: assessmentFile?.name ?? null,
      reliefs,
      userLandCost: parseMoney(landCostRaw) ?? 0,
      // המשוב נאסף במסך התוצאה ונשלח בנפרד (§1.2), ולכן הליד יוצא בלעדיו
      feedback: '',
    };
    inputRef.current = input;

    const result = evaluate(input);
    setOutcome(result);
    setScreen('result');

    // §16 - כל בדיקה שהושלמה נשלחת כליד, כולל "לא נמצאה חריגה משמעותית".
    // הפעלת מלכודת הספאם מסמנת את הליד אך אינה מבטלת אותו (ראו leads.ts).
    const note =
      assessmentFile && !fileUrl
        ? `לפונה יש קובץ שומה (${assessmentFile.name}) אך הוא לא נשמר - העלאת הקבצים אינה מוגדרת או נכשלה. יש לבקש את הקובץ מהפונה.`
        : undefined;

    // הליד מוחזק, לא נשלח - כדי שלחיצה על "שעו״ד יחזור אליי" תוכל לתפוס את מקומו
    // ומתן יקבל מייל אחד במקום שניים. אם לא תהיה לחיצה, הוא ייצא מעצמו.
    pendingLeadRef.current = {
      input,
      outcome: result,
      note,
      suspectedBot: honeypot !== '',
    };
    cancelGraceTimer();
    graceTimerRef.current = setTimeout(() => flushPendingLead(false), LEAD_GRACE_MS);
  }

  /** §1.2 - המשוב נשלח כהודעה נפרדת, אחרי שהליד המלא כבר יצא. */
  async function submitFeedback() {
    if (!inputRef.current || !outcome) return;
    if (!feedback.trim() || feedbackState === 'sending') return;

    setFeedbackState('sending');
    const ok = await sendFeedback({ input: inputRef.current, outcome }, feedback);
    setFeedbackState(ok ? 'sent' : 'failed');
  }

  /**
   * לחיצה על "אני רוצה שעו״ד ייצור איתי קשר" - הדרישה המפורשת של הלקוח:
   * הלחיצה חייבת לשלוח את הליד, ובדיוק מייל אחד.
   *
   * כל יציאה מוקדמת ששתקה כאן הוסרה. קודם לכן, אם מלכודת הספאם הופעלה או שחסר
   * מידע, הפונקציה קפצה ל-setCallback('sent') - כלומר הציגה לפונה "הפרטים
   * התקבלו בהצלחה" בזמן שדבר לא נשלח, וזו בדיוק התקלה שדווחה. עכשיו:
   *   - מלכודת ספאם → הליד נשלח ומסומן, לא נזרק;
   *   - חסר קלט/תוצאה → מדווח על כישלון, לא על הצלחה מדומה;
   *   - הלחיצה מבטלת את הליד הממתין ותופסת את מקומו → מייל אחד, לא שניים;
   *   - אם השליחה נכשלה, הליד הממתין מוחזר להמתנה - כדי שכישלון לא יבלע אותו.
   */
  async function requestCallback(note: string) {
    if (callbackSentRef.current) {
      setCallback('sent');
      return;
    }
    const input = inputRef.current;
    if (!input || !outcome) {
      setCallback('failed');
      return;
    }

    // הלחיצה גוברת על הליד הממתין: מבטלים את השליחה האוטומטית ותופסים את מקומה.
    const held = pendingLeadRef.current;
    cancelGraceTimer();
    pendingLeadRef.current = null;
    const leadAlreadyOut = leadSentRef.current;
    leadSentRef.current = true;

    setCallback('sending');
    const ok = await sendCallbackRequest(
      { input, outcome, suspectedBot: honeypot !== '' },
      leadAlreadyOut
        ? `${note}. שימו לב: הליד הרגיל של הפונה כבר נשלח קודם לכן - זו אותה פנייה, לא פנייה חדשה.`
        : note,
    );

    if (!ok) {
      // השליחה נכשלה. הליד הממתין חוזר להמתנה כדי שלפחות הוא ייצא ביציאה מהדף -
      // עדיף ליד רגיל מאשר שום ליד. הפונה יכול גם ללחוץ שוב.
      pendingLeadRef.current = held;
      leadSentRef.current = leadAlreadyOut;
    }

    callbackSentRef.current = ok;
    setCallback(ok ? 'sent' : 'failed');
  }

  /* ============================ UI helpers ============================ */

  const Disclaimers = (
    <aside className="calc-disclaimers" aria-label="הבהרות משפטיות">
      <ul>
        {DISCLAIMERS.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </aside>
  );

  function NavButtons({
    onBack,
    onNext,
    nextLabel = 'המשך',
  }: {
    onBack: () => void;
    onNext: () => void;
    nextLabel?: string;
  }) {
    return (
      <div className="calc-nav">
        <button type="button" className="btn btn--secondary" onClick={onBack}>
          חזרה
        </button>
        <button type="button" className="btn btn--primary" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    );
  }

  function Stepper({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
    return (
      <nav aria-label="שלבי הבדיקה">
        <ol className="calc-stepper">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <li
              key={n}
              aria-current={n === current ? 'step' : undefined}
              className={n < current ? 'done' : n === current ? 'current' : ''}
            >
              <span className="step-dot" aria-hidden="true">
                {n < current ? '✓' : n}
              </span>
              <span className="step-label">{STEP_SHORT[n]}</span>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  function fieldError(key: string, id: string) {
    if (!errors[key]) return null;
    return (
      <span className="error-text" id={id} role="alert">
        {errors[key]}
      </span>
    );
  }

  /* ============================ screens ============================ */

  // ---------- intro + consent gate (§10.1, §11.1, §11.2) ----------
  if (screen === 'intro') {
    return (
      <div className="calc-root" ref={rootRef}>
        <div className="card calc-card calc-intro">
          <h1 tabIndex={-1} ref={headingRef}>
            מילואימניקים וזוכי מכרזים - בשבילכם ולמענכם יצרנו מחשבון שעשוי לסייע באיתור כספים
            שנגבו שלא לצורך
          </h1>
          <p className="sub">
            נסו את המחשבון שלנו ובדקו האם קיים פוטנציאל ראשוני להחזר מס.
          </p>

          <p className="calc-pilot" role="note">
            {PILOT_NOTICE}
          </p>

          <fieldset
            className="field calc-gate"
            aria-describedby={errors.consent ? 'calc-consent-err' : undefined}
          >
            <legend>{CONSENT_QUESTION}</legend>
            <div className="radio-row">
              {(['כן', 'לא'] as const).map((opt) => (
                <label key={opt} className="radio-pill">
                  <input
                    type="radio"
                    name="consent"
                    value={opt}
                    checked={consent === opt}
                    onChange={() => {
                      setConsent(opt);
                      setError('consent', null);
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
            {consent === 'לא' && (
              <p className="calc-gate-blocked" role="alert">
                {CONSENT_REFUSED}
              </p>
            )}
            {fieldError('consent', 'calc-consent-err')}
          </fieldset>

          <button
            type="button"
            className="btn btn--primary"
            disabled={consent !== 'כן'}
            onClick={() => {
              if (consent !== 'כן') {
                setError('consent', CONSENT_REFUSED);
                return;
              }
              setScreen(1);
            }}
          >
            לבדיקה לחצו כאן
          </button>
        </div>
        {Disclaimers}
      </div>
    );
  }

  // ---------- loading (§11.7) ----------
  if (screen === 'loading') {
    return (
      <div className="calc-root" ref={rootRef}>
        <div className="card calc-card calc-loading">
          <h1 tabIndex={-1} ref={headingRef}>
            רק רגע, בודקים את הנתונים
          </h1>
          <div
            className="calc-progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={LOADING_STEPS.length}
            aria-valuenow={loadingStep + 1}
            aria-label="התקדמות הבדיקה"
          >
            <span
              className="calc-progress-bar"
              style={{ inlineSize: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
            />
          </div>
          <p className="sub calc-loading-msg" aria-live="polite">
            {LOADING_STEPS[loadingStep]}
          </p>
        </div>
        {Disclaimers}
      </div>
    );
  }

  // ---------- result (§14) ----------
  if (screen === 'result' && outcome) {
    const { kind, reliefUsedTrigger } = outcome;
    return (
      <div className="calc-root" ref={rootRef}>
        <div className="card calc-card calc-result" data-kind={kind}>
          {kind === 'overpayment' && (
            <>
              <h1 tabIndex={-1} ref={headingRef}>
                אופס… נראה ששילמת יותר ממה שהיית אמור לשלם
              </h1>
              <p className="sub">זוהתה חריגה של מעל ל־1,500 ₪</p>
              {callback !== 'sent' ? (
                <button
                  type="button"
                  className={`btn btn--primary${callback === 'sending' ? ' is-loading' : ''}`}
                  onClick={() =>
                    requestCallback('המשתמש ביקש חזרה טלפונית לבדיקה נוספת ולהחזרת המס')
                  }
                  disabled={callback === 'sending'}
                  aria-busy={callback === 'sending'}
                >
                  אני רוצה שעו״ד מיסוי מקרקעין יחזור אליי לבדיקה נוספת ללא עלות ולהחזרת המס
                </button>
              ) : null}
            </>
          )}

          {kind === 'ok' && (
            <>
              <h1 tabIndex={-1} ref={headingRef}>
                ככל הנראה הדיווח בוצע בצורה תקינה
              </h1>
              <p>לפי הנתונים שהוזנו, לא זוהתה בשלב זה חריגה משמעותית בתשלום מס הרכישה.</p>
              <p>
                הבדיקה מבוססת על הנתונים שהוזנו ועל נתוני חוברת המכרז בלבד ואינה מחליפה בדיקה
                מקצועית של השומה.
              </p>
              {callback !== 'sent' ? (
                <button
                  type="button"
                  className={`btn btn--secondary${callback === 'sending' ? ' is-loading' : ''}`}
                  onClick={() =>
                    requestCallback(
                      'המשתמש ביקש בדיקה משפטית אף שלא נמצאה חריגה משמעותית (עדיפות נמוכה)',
                    )
                  }
                  disabled={callback === 'sending'}
                  aria-busy={callback === 'sending'}
                >
                  אני עדיין מעוניין בבדיקה משפטית
                </button>
              ) : null}
            </>
          )}

          {kind === 'manual' && (
            <>
              <h1 tabIndex={-1} ref={headingRef}>
                נדרשת בדיקה פרטנית של השומה
              </h1>
              <p>
                {reliefUsedTrigger
                  ? 'מאחר שסומן שימוש בהקלה או בהטבה במסגרת שומת מס הרכישה, לא ניתן להסתמך על חישוב אוטומטי בלבד. משרדנו ממליץ להעביר את השומה לבדיקה פרטנית.'
                  : 'לא ניתן להגיע למסקנה מהימנה באמצעות החישוב האוטומטי בלבד. משרדנו ממליץ להעביר את השומה לבדיקה פרטנית.'}
              </p>
              {callback !== 'sent' ? (
                <button
                  type="button"
                  className={`btn btn--primary${callback === 'sending' ? ' is-loading' : ''}`}
                  onClick={() => requestCallback('המשתמש ביקש חזרה טלפונית לבדיקה פרטנית')}
                  disabled={callback === 'sending'}
                  aria-busy={callback === 'sending'}
                >
                  אני רוצה שעו״ד מיסוי מקרקעין יחזור אליי לבדיקה נוספת ללא עלות
                </button>
              ) : null}
            </>
          )}

          <p aria-live="polite" className={callback === 'sent' ? 'calc-confirm' : 'visually-hidden'}>
            {callback === 'sent' ? CONFIRMATION_TEXT : ''}
          </p>
          {/* הכפתור נשאר על המסך כל עוד לא הצלחנו, כך שהלחיצה החוזרת אפשרית -
              ולצידה דרך אנושית להשלים את הפנייה גם אם השליחה ממשיכה להיכשל. */}
          {callback === 'failed' && (
            <div role="alert" className="calc-callback-failed">
              <p className="error-text">
                השליחה נכשלה. אפשר ללחוץ שוב על הכפתור, או לפנות למשרדנו ישירות:
              </p>
              <p className="calc-callback-links">
                {phoneHref && (
                  <a href={phoneHref} dir="ltr">
                    {site.phone}
                  </a>
                )}
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    וואטסאפ
                  </a>
                )}
              </p>
            </div>
          )}
        </div>

        {/* §1.2 - המשוב יושב כאן בלבד: בחלונית האחרונה, אחרי הצגת התוצאה. */}
        <section className="card calc-card calc-feedback" aria-labelledby="calc-feedback-title">
          <h2 id="calc-feedback-title">{FEEDBACK_TITLE}</h2>
          <p>{FEEDBACK_INTRO}</p>

          {feedbackState === 'sent' ? (
            <p className="calc-confirm" role="status">
              תודה! המשוב התקבל במשרדנו.
            </p>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submitFeedback();
              }}
            >
              <div className="field">
                <label htmlFor="calc-feedback-input">{FEEDBACK_LABEL}</label>
                <textarea
                  id="calc-feedback-input"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className={`btn btn--secondary${feedbackState === 'sending' ? ' is-loading' : ''}`}
                disabled={!feedback.trim() || feedbackState === 'sending'}
                aria-busy={feedbackState === 'sending'}
              >
                שליחת המשוב
              </button>
              {feedbackState === 'failed' && (
                <p role="alert" className="error-text">
                  שליחת המשוב נכשלה. אפשר לנסות שוב.
                </p>
              )}
            </form>
          )}
        </section>

        {Disclaimers}
      </div>
    );
  }

  const step = screen as 1 | 2 | 3 | 4 | 5;

  return (
    <div className="calc-root" ref={rootRef}>
      <Stepper current={step} />
      <form
        className="card calc-card"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 5) {
            void showResult();
          } else if (validateStep(step)) {
            setScreen((step + 1) as Screen);
          }
        }}
      >
        <h1 tabIndex={-1} ref={headingRef}>
          {STEP_TITLES[step]}
        </h1>

        {step === 1 && (
          <>
            <p className="calc-pilot" role="note">
              {PILOT_NOTICE}
            </p>

            {/*
              מלכודת ספאם - מוסתרת ממשתמשים אמיתיים.

              השם כאן חשוב: קודם לכן השדה נקרא "company", וזהו שם שהמילוי האוטומטי
              של Chrome מזהה כשדה ארגון וממלא - גם כש-autocomplete="off" - במיוחד
              בטופס שיש בו שם, טלפון ודוא"ל. פונה אמיתי שהשתמש במילוי אוטומטי סומן
              כבוט, והליד שלו נזרק בשקט. שם חסר משמעות אינו תואם לאף היוריסטיקה.
            */}
            <input
              type="text"
              id="calc-ref-code"
              name="calc_reference_code"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="calc-hp"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="field">
              <label htmlFor="calc-name">שם מלא</label>
              <input
                id="calc-name"
                type="text"
                value={fullName}
                autoComplete="name"
                required
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'calc-name-err' : undefined}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError('fullName', null);
                }}
              />
              {fieldError('fullName', 'calc-name-err')}
            </div>
            <div className="field">
              <label htmlFor="calc-phone">מספר טלפון</label>
              <input
                id="calc-phone"
                type="tel"
                dir="ltr"
                value={phone}
                autoComplete="tel"
                required
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'calc-phone-err' : undefined}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('phone', null);
                }}
              />
              {fieldError('phone', 'calc-phone-err')}
            </div>
            <div className="field">
              <label htmlFor="calc-email">כתובת דוא״ל</label>
              <input
                id="calc-email"
                type="email"
                dir="ltr"
                value={email}
                autoComplete="email"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'calc-email-err' : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('email', null);
                }}
              />
              {fieldError('email', 'calc-email-err')}
            </div>
            <fieldset
              className="field"
              aria-describedby={errors.boughtFromRmi ? 'calc-rmi-err' : undefined}
            >
              <legend>האם רכשת את המגרש במסגרת זכייה או הקצאה של רשות מקרקעי ישראל?</legend>
              <div className="radio-row">
                {(['כן', 'לא', 'לא בטוח'] as const).map((opt) => (
                  <label key={opt} className="radio-pill">
                    <input
                      type="radio"
                      name="boughtFromRmi"
                      value={opt}
                      checked={boughtFromRmi === opt}
                      onChange={() => {
                        setBoughtFromRmi(opt);
                        setError('boughtFromRmi', null);
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {fieldError('boughtFromRmi', 'calc-rmi-err')}
            </fieldset>
            <div className="calc-nav">
              <button type="button" className="btn btn--secondary" onClick={() => setScreen('intro')}>
                חזרה
              </button>
              <button type="submit" className="btn btn--primary">
                המשך
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <fieldset
              className="field"
              aria-describedby={errors.settlementId ? 'calc-settlement-err' : undefined}
            >
              <legend>באיזה יישוב נמצא המגרש?</legend>
              <div className="radio-row">
                {settlements.map((s) => (
                  <label key={s.id} className="radio-pill">
                    <input
                      type="radio"
                      name="settlement"
                      value={s.id}
                      checked={settlementId === s.id}
                      onChange={() => {
                        setSettlementId(s.id);
                        setPlotNumber('');
                        setError('settlementId', null);
                      }}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              {fieldError('settlementId', 'calc-settlement-err')}
            </fieldset>

            {settlement && (
              <div className="field">
                <span className="calc-static-label">מספר המכרז</span>
                <p className="calc-static-value">
                  <bdi>{settlement.tenderNumber}</bdi> - {settlement.neighborhood}
                </p>
              </div>
            )}

            {settlement && (
              <div className="field">
                <label htmlFor="calc-plot">מספר המגרש</label>
                <select
                  id="calc-plot"
                  value={plotNumber}
                  required
                  aria-invalid={Boolean(errors.plotNumber)}
                  aria-describedby={errors.plotNumber ? 'calc-plot-err' : undefined}
                  onChange={(e) => {
                    setPlotNumber(e.target.value);
                    setError('plotNumber', null);
                  }}
                >
                  <option value="">בחירת מגרש…</option>
                  {settlement.plots.map((p) => (
                    <option key={p.plotNumber} value={p.plotNumber}>
                      {'מגרש ' + p.plotNumber}
                    </option>
                  ))}
                  <option value={PLOT_NOT_FOUND}>המגרש שלי אינו מופיע ברשימה</option>
                </select>
                {fieldError('plotNumber', 'calc-plot-err')}
              </div>
            )}

            {/* §11.3 - הצגת נתוני המגרש כדי שהמשתמש יוודא שבחר נכון */}
            {plot && (
              <div className="calc-plot-facts" aria-live="polite">
                <p className="calc-static-label">נתוני המגרש שנבחר</p>
                <dl>
                  <div>
                    <dt>שטח המגרש</dt>
                    <dd>{plot.areaSqm !== null ? `${plot.areaSqm} מ״ר` : 'לא זמין'}</dd>
                  </div>
                  <div>
                    <dt>מספר יחידות</dt>
                    <dd>{plot.unitCount !== null ? plot.unitCount : 'לא זמין'}</dd>
                  </div>
                </dl>
                <p className="helper-text">
                  אם הנתונים אינם תואמים למגרש שברשותכם, יש לבדוק שוב את מספר המגרש.
                </p>
              </div>
            )}

            <NavButtons
              onBack={() => setScreen(1)}
              onNext={() => {
                if (validateStep(2)) setScreen(3);
              }}
            />
          </>
        )}

        {step === 3 && (
          <>
            <div className="field">
              <label htmlFor="calc-tax">כמה מס רכישה שילמת בפועל?</label>
              <input
                id="calc-tax"
                type="text"
                inputMode="numeric"
                dir="ltr"
                placeholder="למשל: 45,000"
                value={taxPaidRaw}
                required
                aria-invalid={Boolean(errors.taxPaid)}
                aria-describedby={'calc-tax-help' + (errors.taxPaid ? ' calc-tax-err' : '')}
                onChange={(e) => {
                  setTaxPaidRaw(e.target.value);
                  setError('taxPaid', null);
                }}
              />
              <span className="helper-text" id="calc-tax-help">
                יש להזין את סכום מס הרכישה ששולם בפועל בהתאם לשומה או לאישור התשלום.
              </span>
              {fieldError('taxPaid', 'calc-tax-err')}
            </div>

            <fieldset
              className="field"
              aria-describedby={errors.hasAssessment ? 'calc-assess-err' : undefined}
            >
              <legend>האם יש ברשותך עותק של שומת מס הרכישה?</legend>
              <div className="radio-row">
                {(['כן', 'לא', 'לא בטוח'] as const).map((opt) => (
                  <label key={opt} className="radio-pill">
                    <input
                      type="radio"
                      name="hasAssessment"
                      value={opt}
                      checked={hasAssessment === opt}
                      onChange={() => {
                        setHasAssessment(opt);
                        if (opt !== 'כן') setAssessmentFile(null);
                        setError('hasAssessment', null);
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {fieldError('hasAssessment', 'calc-assess-err')}
            </fieldset>

            {/* §1.1 - "כן" פותח את שדה ההעלאה מיד. אופציונלי; לעולם לא חוסם המשך. */}
            {hasAssessment === 'כן' && (
              <div className="field">
                <label htmlFor="calc-file">{UPLOAD_LABEL}</label>
                <input
                  id="calc-file"
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  aria-invalid={Boolean(errors.file)}
                  aria-describedby={'calc-file-help' + (errors.file ? ' calc-file-err' : '')}
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                />
                <span className="helper-text" id="calc-file-help">
                  {UPLOAD_HELP} ניתן להעלות קובץ מסוג PDF, JPG, JPEG או PNG, עד {MAX_FILE_MB}MB.
                  ההעלאה אינה חובה - אפשר להמשיך גם בלעדיה.
                </span>
                {assessmentFile && (
                  <p className="calc-file-picked" aria-live="polite">
                    נבחר הקובץ: <bdi>{assessmentFile.name}</bdi>
                  </p>
                )}
                {!uploadConfigured && (
                  <p className="helper-text" role="note">
                    שירות שמירת הקבצים טרם הוגדר באתר. אפשר להמשיך כרגיל - נבקש את הקובץ בשיחה.
                  </p>
                )}
                {fieldError('file', 'calc-file-err')}
              </div>
            )}

            <NavButtons
              onBack={() => setScreen(2)}
              onNext={() => {
                if (validateStep(3)) setScreen(4);
              }}
            />
          </>
        )}

        {step === 4 && (
          <>
            {/* §11.5 - השאלה נשאלת על שימוש בפועל בהקלה, לא על זכאות */}
            <fieldset className="field" aria-describedby={errors.reliefs ? 'calc-reliefs-err' : undefined}>
              <legend>האם השתמשת באחת מההקלות הבאות במסגרת שומת מס הרכישה?</legend>
              <div className="radio-row">
                {RELIEF_OPTIONS.map((opt) => (
                  <label key={opt} className="radio-pill">
                    <input
                      type="checkbox"
                      name="reliefs"
                      value={opt}
                      checked={reliefs.includes(opt)}
                      onChange={() => toggleRelief(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {reliefMarked && (
                <p className="helper-text">
                  מאחר שסומנה הקלה, הפנייה תועבר לבדיקה פרטנית של עו״ד מיסוי מקרקעין ולא תוצג
                  תוצאה אוטומטית.
                </p>
              )}
              {fieldError('reliefs', 'calc-reliefs-err')}
            </fieldset>

            <NavButtons
              onBack={() => setScreen(3)}
              onNext={() => {
                if (validateStep(4)) setScreen(5);
              }}
            />
          </>
        )}

        {step === 5 && (
          <>
            {/* §11.6 - עלות רכיב הקרקע, כולל מע"מ */}
            <div className="field">
              <label htmlFor="calc-land">כמה עלה רכיב הקרקע ללא הוצאות הפיתוח, כולל מע״מ?</label>
              <input
                id="calc-land"
                type="text"
                inputMode="numeric"
                dir="ltr"
                placeholder="למשל: 250,000"
                value={landCostRaw}
                required
                aria-invalid={Boolean(errors.landCost)}
                aria-describedby={'calc-land-help' + (errors.landCost ? ' calc-land-err' : '')}
                onChange={(e) => {
                  setLandCostRaw(e.target.value);
                  setError('landCost', null);
                }}
              />
              <span className="helper-text" id="calc-land-help">
                אם מדובר במגרש דו־משפחתי, יש להזין את העלות של החלק שנרכש על ידך בלבד. אם הסכום
                אינו ידוע, ניתן לרשום 0 - הפנייה תועבר לבדיקה פרטנית.
              </span>
              {fieldError('landCost', 'calc-land-err')}
            </div>

            {/* §1.2 - המשוב הועבר לחלונית האחרונה (מסך התוצאה) ואינו נאסף כאן. */}

            <NavButtons
              onBack={() => setScreen(4)}
              onNext={() => void showResult()}
              nextLabel="הצגת התוצאה"
            />
          </>
        )}
      </form>
      {Disclaimers}
    </div>
  );
}
