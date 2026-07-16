/**
 * הליבה החישובית של מחשבון החזר מס הרכישה.
 * מודול טהור (ללא UI) - כל הערכים המחושבים כאן פנימיים בלבד:
 * הם משמשים לבחירת מסך התוצאה ולליד הנשלח בדוא"ל, ולעולם אינם מוצגים למשתמש.
 *
 * §12 - אין במאגר עלות רכיב קרקע. עלות הקרקע משתנה בין רוכשים (הצעה, הנחות, הקצאה),
 * ולכן היא מגיעה אך ורק מהסכום שהמשתמש מזין. הוזן 0 → התיק עובר לבדיקה ידנית.
 */
import plotsData from '../../data/plots.json';

export interface PlotRecord {
  plotNumber: string;
  areaSqm: number | null;
  unitCount: number | null;
  isDuplex: boolean | null;
  developmentCostFullPlot: number | null;
  needsManualFill: boolean;
  notes: string | null;
}

export interface SettlementRecord {
  id: string;
  name: string;
  tenderNumber: string;
  neighborhood: string;
  developmentCompletionRate: number;
  plots: PlotRecord[];
}

export const settlements: SettlementRecord[] = (plotsData as any).settlements.map((s: any) => ({
  id: s.id,
  name: s.name,
  tenderNumber: s.tenderNumber,
  neighborhood: s.neighborhood,
  developmentCompletionRate: s.developmentCompletionRate,
  plots: s.plots.map((p: any) => ({
    plotNumber: p.plotNumber,
    areaSqm: p.areaSqm,
    unitCount: p.unitCount,
    isDuplex: p.isDuplex ?? null,
    developmentCostFullPlot: p.developmentCostFullPlot,
    needsManualFill: Boolean(p.needsManualFill),
    notes: p.notes ?? null,
  })),
}));

export const PURCHASE_TAX_RATE: number = (plotsData as any).purchaseTaxRate ?? 0.06;
export const OVERPAYMENT_THRESHOLD: number = (plotsData as any).overpaymentThresholdILS ?? 1500;

/**
 * §3 - כמה מותר לסכום הפיתוח שהמשתמש שילם לסטות מהנתון שבחוברת המכרז לפני
 * שהתיק מסומן לבדיקה פרטנית.
 *
 * הסטייה צפויה ואינה מעידה על טעות: הוצאות הפיתוח בחוברת צמודות למדד
 * (ראו devCostIndexBase), ולכן מי ששילם במועד אחר שילם סכום אחר. הסף מפריד בין
 * פער סביר כזה לבין פער שמעיד שהנתון או המגרש אינם מה שחשבנו - ואז אין טעם
 * להריץ חישוב אוטומטי על בסיס שגוי.
 */
export const DEVELOPMENT_TOLERANCE: number =
  (plotsData as any).developmentToleranceILS ?? 12000;

export type YesNoUnsure = 'כן' | 'לא' | 'לא בטוח';

/** §11.5 - השאלה נשאלת כעת על שימוש בפועל בהקלה במסגרת השומה, לא על זכאות תיאורטית. */
export const RELIEF_OPTIONS = [
  'לא',
  'נכה',
  'עיוור',
  'עולה חדש',
  'נפגע פעולת איבה',
  'בן משפחה של חייל שנספה במערכה',
  'הקלה אחרת',
  'לא יודע',
] as const;
export type ReliefOption = (typeof RELIEF_OPTIONS)[number];

/** "לא" היא התשובה היחידה שמאפשרת מסלול חישוב אוטומטי. גם "לא יודע" מנתב לבדיקה ידנית. */
export function isReliefMarked(reliefs: ReliefOption[]): boolean {
  return reliefs.some((r) => r !== 'לא');
}

export interface WizardInput {
  fullName: string;
  phone: string;
  email: string;
  boughtFromRmi: YesNoUnsure;
  settlementId: string;
  /** מספר מגרש, או הערך המיוחד PLOT_NOT_FOUND */
  plotNumber: string;
  actualTaxPaid: number;
  hasAssessment: YesNoUnsure;
  assessmentFileUrl: string | null;
  assessmentFileName: string | null;
  reliefs: ReliefOption[];
  /** §11.6 - עלות רכיב הקרקע ללא הוצאות פיתוח, כולל מע"מ. 0 = בדיקה ידנית. */
  userLandCost: number;
  /** §3 - הסכום ששולם בפועל עבור הוצאות הפיתוח. מוצלב מול נתוני חוברת המכרז. */
  userDevelopmentCost: number;
  /** §11.2 - משוב חופשי על הפיילוט */
  feedback: string;
}

export const PLOT_NOT_FOUND = '__not_in_list__';

export type ResultKind = 'overpayment' | 'ok' | 'manual';

export type LeadStatus =
  | 'פוטנציאל להחזר'
  | 'לא נמצאה חריגה משמעותית'
  | 'נדרשת בדיקה ידנית';

export interface CalcOutcome {
  kind: ResultKind;
  status: LeadStatus;
  /** true כשהניתוב הידני נגרם מהקלה שנוצלה בשומה (טקסט תוצאה ייעודי) */
  reliefUsedTrigger: boolean;
  manualReasons: string[];
  // ---- ערכים פנימיים (לליד בלבד, לעולם לא ל-UI) ----
  internal: {
    settlementName: string | null;
    tenderNumber: string | null;
    plotNumber: string | null;
    areaSqm: number | null;
    unitCount: number | null;
    isDuplex: boolean | null;
    landCostEntered: number | null;
    developmentCostFull: number | null;
    adjustedDevelopmentCost: number | null;
    /** §3 - הסכום שהמשתמש דיווח ששילם עבור הפיתוח */
    developmentCostEntered: number | null;
    /** §3 - המרחק בין הסכום שהוזן לבין חלקו של המשתמש בפיתוח לפי החוברת */
    developmentDeviation: number | null;
    /** §3 - null כשאין די נתונים להצלבה */
    developmentWithinTolerance: boolean | null;
    developmentPercentage: number | null;
    relevantDevelopmentComponent: number | null;
    estimatedTaxableValue: number | null;
    estimatedPurchaseTax: number | null;
    actualTaxPaid: number;
    difference: number | null;
    overThreshold: boolean;
  };
}

export function findSettlement(id: string): SettlementRecord | undefined {
  return settlements.find((s) => s.id === id);
}

/**
 * חלקו של רוכש יחיד בהוצאות הפיתוח לפי חוברת המכרז.
 *
 * החוברת מדפיסה את עלות הפיתוח למגרש *כולו*; במגרש דו־משפחתי הרוכש שילם על
 * מחציתו. זהו הסכום שמולו מוצלב מה שהמשתמש דיווח ששילם - ולא הסכום שלאחר הכפלה
 * באחוז הביצוע המשוקלל: אחוז הביצוע קובע כמה מהפיתוח נכנס לשווי לצורכי מס, לא
 * כמה הרוכש שילם לרמ"י בפועל.
 */
function adjustedDevelopmentFor(plot: PlotRecord | null): number | null {
  if (!plot) return null;
  const { developmentCostFullPlot: full, unitCount } = plot;
  if (full === null || unitCount === null || unitCount <= 0) return null;
  return full / unitCount;
}

/** §3 - תוצאת ההצלבה בין סכום הפיתוח שהוזן לבין נתוני חוברת המכרז. */
export type DevelopmentCheck = 'within' | 'over' | 'unknown';

/**
 * §3 - ההצלבה כפי שהממשק מציג אותה בזמן ההקלדה.
 *
 * מחזירה סיווג בלבד, לעולם לא מספר: הצגת הפער תחשוף את עלות הפיתוח שבחוברת,
 * וכל הערכים המחושבים אמורים להישאר פנימיים (§14).
 */
export function checkDevelopmentPayment(
  settlementId: string,
  plotNumber: string,
  entered: number | null,
): DevelopmentCheck {
  if (entered === null || !Number.isFinite(entered) || entered < 0) return 'unknown';
  const settlement = findSettlement(settlementId) ?? null;
  const plot =
    settlement && plotNumber !== PLOT_NOT_FOUND
      ? (settlement.plots.find((p) => p.plotNumber === plotNumber) ?? null)
      : null;
  if (plot?.needsManualFill) return 'unknown';

  const adjusted = adjustedDevelopmentFor(plot);
  if (adjusted === null) return 'unknown';
  return Math.abs(entered - adjusted) <= DEVELOPMENT_TOLERANCE ? 'within' : 'over';
}

/**
 * §13 - הנוסחה המעודכנת:
 *   עלות פיתוח מותאמת = עלות הפיתוח מהחוברת ÷ מספר היחידות (2 יח״ד → מחצית; 1 יח״ד → מלוא הסכום)
 *   רכיב הפיתוח הרלוונטי = עלות הפיתוח המותאמת × אחוז הפיתוח המשוקלל
 *   שווי משוער לצורכי מס    = עלות הקרקע שהוזנה + רכיב הפיתוח הרלוונטי
 *   מס רכישה משוער         = שווי משוער × 6%
 * תנאי הבדיקה הידנית קודמים לכל חישוב.
 */
export function evaluate(input: WizardInput): CalcOutcome {
  const settlement = findSettlement(input.settlementId) ?? null;
  const plot =
    settlement && input.plotNumber !== PLOT_NOT_FOUND
      ? (settlement.plots.find((p) => p.plotNumber === input.plotNumber) ?? null)
      : null;

  const manualReasons: string[] = [];
  const reliefMarked = isReliefMarked(input.reliefs);

  if (input.boughtFromRmi !== 'כן') {
    manualReasons.push('המשתמש השיב "' + input.boughtFromRmi + '" לשאלה האם המגרש נרכש מרמ"י');
  }
  // §11.5 / §13 - הקלה בשומה שוללת חישוב אוטומטי בשיעור 6%
  if (reliefMarked) {
    manualReasons.push('סומן שימוש בהקלה במסגרת שומת מס הרכישה (' + input.reliefs.join(', ') + ')');
  }
  if (!settlement) {
    manualReasons.push('היישוב שנבחר לא נמצא במאגר');
  }
  if (settlement && input.plotNumber === PLOT_NOT_FOUND) {
    manualReasons.push('המגרש אינו מופיע ברשימת המגרשים של המכרז');
  } else if (settlement && !plot) {
    manualReasons.push('המגרש שנבחר לא נמצא במאגר');
  }
  if (plot?.needsManualFill) {
    manualReasons.push('נתוני המגרש בחוברת סותרים או חסרים' + (plot.notes ? ': ' + plot.notes : ''));
  }

  const unitCount = plot?.unitCount ?? null;
  const isDuplex = plot?.isDuplex ?? null;
  const areaSqm = plot?.areaSqm ?? null;
  const devFull = plot?.developmentCostFullPlot ?? null;
  const rate = settlement?.developmentCompletionRate ?? null;

  // §11.6 / §12 - עלות הקרקע מגיעה מהמשתמש בלבד. אין נתון חלופי במאגר.
  const landEntered = input.userLandCost > 0 ? input.userLandCost : null;
  if (landEntered === null) {
    manualReasons.push('המשתמש הזין 0 בעלות רכיב הקרקע - אין נתון קרקע לחישוב');
  }

  if (plot && devFull === null) {
    manualReasons.push('הוצאות הפיתוח למגרש חסרות במאגר');
  }
  if (plot && unitCount === null && !plot.needsManualFill) {
    manualReasons.push('מספר יחידות הדיור במגרש חסר במאגר');
  }
  if (!(input.actualTaxPaid > 0) || !Number.isFinite(input.actualTaxPaid)) {
    manualReasons.push('סכום מס הרכישה שהוזן אינו תקין');
  }

  /**
   * §3 - הצלבת סכום הפיתוח שהמשתמש שילם מול חלקו לפי חוברת המכרז.
   *
   * ההצלבה מחושבת כאן, לפני שער החישוב, כי פער גדול הוא עצמו עילה לבדיקה
   * פרטנית: הוא אומר שהנתון שבידינו אינו מתאר את העסקה הזו, וחישוב אוטומטי
   * שיירוץ מעליו ייתן תשובה בטוחה ושגויה.
   */
  const adjusted = adjustedDevelopmentFor(plot);
  const devEntered =
    Number.isFinite(input.userDevelopmentCost) && input.userDevelopmentCost >= 0
      ? input.userDevelopmentCost
      : null;
  const devDeviation =
    adjusted !== null && devEntered !== null ? Math.abs(devEntered - adjusted) : null;
  const devWithinTolerance = devDeviation === null ? null : devDeviation <= DEVELOPMENT_TOLERANCE;

  if (devEntered === null) {
    manualReasons.push('לא הוזן סכום תקין עבור הוצאות הפיתוח');
  }
  if (devWithinTolerance === false) {
    manualReasons.push(
      'סכום הפיתוח שהמשתמש הזין חורג ביותר מ-' +
        DEVELOPMENT_TOLERANCE.toLocaleString('he-IL') +
        ' ש"ח מחלקו בהוצאות הפיתוח לפי חוברת המכרז - נדרשת בדיקה פרטנית',
    );
  }

  const canCompute =
    manualReasons.length === 0 &&
    plot !== null &&
    adjusted !== null &&
    landEntered !== null &&
    rate !== null;

  let relevantDev: number | null = null;
  let taxable: number | null = null;
  let estimatedTax: number | null = null;
  let difference: number | null = null;

  if (canCompute) {
    relevantDev = adjusted! * rate!;
    taxable = landEntered! + relevantDev;
    estimatedTax = taxable * PURCHASE_TAX_RATE;
    difference = input.actualTaxPaid - estimatedTax;
    if (!Number.isFinite(difference)) {
      manualReasons.push('החישוב הניב תוצאה שאינה מהימנה');
      difference = null;
    }
  }

  let kind: ResultKind;
  let status: LeadStatus;
  if (manualReasons.length > 0 || difference === null) {
    kind = 'manual';
    status = 'נדרשת בדיקה ידנית';
  } else if (difference > OVERPAYMENT_THRESHOLD) {
    kind = 'overpayment';
    status = 'פוטנציאל להחזר';
  } else {
    kind = 'ok';
    status = 'לא נמצאה חריגה משמעותית';
  }

  return {
    kind,
    status,
    reliefUsedTrigger: reliefMarked,
    manualReasons,
    internal: {
      settlementName: settlement?.name ?? null,
      tenderNumber: settlement?.tenderNumber ?? null,
      plotNumber:
        plot?.plotNumber ??
        (input.plotNumber === PLOT_NOT_FOUND ? 'לא נמצא ברשימה' : input.plotNumber || null),
      areaSqm,
      unitCount,
      isDuplex,
      landCostEntered: landEntered,
      developmentCostFull: devFull,
      adjustedDevelopmentCost: adjusted,
      developmentCostEntered: devEntered,
      developmentDeviation: devDeviation,
      developmentWithinTolerance: devWithinTolerance,
      developmentPercentage: rate,
      relevantDevelopmentComponent: relevantDev,
      estimatedTaxableValue: taxable,
      estimatedPurchaseTax: estimatedTax,
      actualTaxPaid: input.actualTaxPaid,
      difference,
      overThreshold: difference !== null && difference > OVERPAYMENT_THRESHOLD,
    },
  };
}

/** המרה של קלט כספי חופשי (עם פסיקים/רווחים/₪) למספר; null אם לא תקין */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[₪,\s]/g, '');
  if (cleaned === '') return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** בדיקת טלפון ישראלי (נייד/קווי, כולל קידומת בינלאומית) */
export function isValidIsraeliPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (/^0\d{8,9}$/.test(digits)) return true;
  if (/^972\d{8,9}$/.test(digits)) return true;
  return false;
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
}
