/**
 * Bilingual chrome (header, footer, accessibility widget, contact form).
 *
 * Scope, decided with the client: the marketing pages exist in both languages.
 * The calculator stays Hebrew-only - its audience is Israeli reservists who won
 * an RMI tender, so an English wizard would have no users - and the legal pages
 * (privacy / terms / accessibility) stay Hebrew, because the Israeli
 * accessibility statement is required in Hebrew and the other two are
 * lawyer-reviewed documents that must not be machine-translated.
 *
 * Pages that have no counterpart in the other language point their language
 * switch at that language's home page. Each page passes its own `altHref`, so
 * there is no path-rewriting guesswork anywhere.
 */
export type Lang = 'he' | 'en';

export const isRtl = (lang: Lang): boolean => lang === 'he';
export const dirOf = (lang: Lang): 'rtl' | 'ltr' => (lang === 'he' ? 'rtl' : 'ltr');

export const ui = {
  he: {
    langName: 'עברית',
    otherLangName: 'English',
    switchLabel: 'החלפת שפת האתר',

    skipToContent: 'דילוג לתוכן המרכזי',
    logoAlt: 'עו״ד מתן אביר לב - משרד עורכי דין',
    homeAria: 'עו״ד מתן אביר לב - לעמוד הבית',

    navMain: 'ניווט ראשי',
    navHome: 'ראשי',
    navAbout: 'אודות',
    navAreas: 'תחומי פעילות',
    navInvestors: 'FOREIGN INVESTORS',
    navContact: 'יצירת קשר',
    navCalculator: 'בדיקת החזר מס',

    openMenu: 'פתיחת תפריט',
    closeMenu: 'סגירת התפריט',

    // footer
    footerBlurb:
      'ליווי משפטי בעסקאות נדל״ן, מקרקעין ומיסוי מקרקעין - בטיפול אישי, בזמינות מלאה ובשקיפות לאורך כל הדרך.',
    footerHours: 'שעות פעילות:',
    footerLinks: 'קישורים',
    footerReach: 'דברו איתנו',
    footerCallback: 'נחזור אליכם',
    footerEmailPlaceholder: 'כתובת הדוא״ל שלכם',
    footerSend: 'שליחה',
    footerNote: 'נשלח לכם מענה ראשוני. אין דיוור פרסומי.',
    footerSending: 'שולח…',
    footerOk: 'קיבלנו - נחזור אליכם בהקדם.',
    footerError: 'השליחה נכשלה. נסו שוב או פנו אלינו בטלפון.',
    footerFormOff:
      'טופס הפנייה יופעל עם השלמת הגדרת האתר. בינתיים נשמח לשמוע מכם בטלפון או בוואטסאפ.',
    footerRights:
      '© עו״ד מתן אביר לב. כל הזכויות שמורות. המידע באתר הוא מידע כללי ואינו מהווה ייעוץ משפטי.',
    whatsapp: 'שיחה בוואטסאפ',
    navigateHere: 'ניווט למשרד',
    mapTitle: 'מפת המשרד',

    privacy: 'מדיניות פרטיות',
    accessibility: 'הצהרת נגישות',
    terms: 'תקנון',

    // accessibility widget
    a11yOpen: 'פתיחת תפריט נגישות',
    a11yTitle: 'תפריט נגישות',
    a11yClose: 'סגירת תפריט הנגישות',
    a11yTextSize: 'גודל טקסט',
    a11ySmaller: 'הקטנת גודל הטקסט',
    a11yLarger: 'הגדלת גודל הטקסט',
    a11yContrast: 'ניגודיות גבוהה',
    a11yLinks: 'הדגשת קישורים',
    a11yMotion: 'עצירת אנימציות',
    a11yReadable: 'גופן קריא',
    a11yReset: 'איפוס הגדרות',
    a11yTrouble: 'נתקלתם בקושי?',
    a11yStatement: 'הצהרת הנגישות',
  },

  en: {
    langName: 'English',
    otherLangName: 'עברית',
    switchLabel: 'Change site language',

    skipToContent: 'Skip to main content',
    logoAlt: 'Adv. Matan Abir Lev - Law Offices',
    homeAria: 'Adv. Matan Abir Lev - back to the home page',

    navMain: 'Main navigation',
    navHome: 'Home',
    navAbout: 'About',
    navAreas: 'Practice Areas',
    navInvestors: 'FOREIGN INVESTORS',
    navContact: 'Contact Us',
    navCalculator: 'Contact Us',

    openMenu: 'Open menu',
    closeMenu: 'Close menu',

    footerBlurb:
      'Legal representation in real estate, property and real estate taxation - personal, responsive and transparent from start to finish.',
    footerHours: 'Office hours:',
    footerLinks: 'Links',
    footerReach: 'Get in touch',
    footerCallback: "We'll call you back",
    footerEmailPlaceholder: 'Your email address',
    footerSend: 'Send',
    footerNote: "We'll send an initial reply. No marketing mail.",
    footerSending: 'Sending…',
    footerOk: "Received - we'll be in touch shortly.",
    footerError: 'Sending failed. Please try again or call us.',
    footerFormOff:
      'The enquiry form will go live once site setup is complete. In the meantime, reach us by phone or WhatsApp.',
    footerRights:
      '© Adv. Matan Abir Lev. All rights reserved. The content of this site is general information and does not constitute legal advice.',
    whatsapp: 'Message us on WhatsApp',
    navigateHere: 'Get directions',
    mapTitle: 'Office location',

    privacy: 'Privacy Policy',
    accessibility: 'Accessibility Statement',
    terms: 'Terms of Use',

    a11yOpen: 'Open accessibility menu',
    a11yTitle: 'Accessibility',
    a11yClose: 'Close accessibility menu',
    a11yTextSize: 'Text size',
    a11ySmaller: 'Decrease text size',
    a11yLarger: 'Increase text size',
    a11yContrast: 'High contrast',
    a11yLinks: 'Highlight links',
    a11yMotion: 'Stop animations',
    a11yReadable: 'Readable font',
    a11yReset: 'Reset settings',
    a11yTrouble: 'Having trouble?',
    a11yStatement: 'Accessibility statement',
  },
} as const;

export const t = (lang: Lang) => ui[lang];

/** Where the language switch points from each page. */
export const HE_HOME = '/';
export const EN_HOME = '/en/';
export const INVESTORS_PAGE = '/en/foreign-investors';
