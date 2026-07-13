/**
 * The firm's practice areas - the single source for the header dropdown and the
 * home-page grid, in both languages, so nothing can drift apart.
 *
 * `size` drives the home-page layout: the grid is three columns, a `wide` card
 * spans two of them and a `small` card spans one. The order below is therefore
 * load-bearing - wide, small, small, wide, wide, small, small, wide - which tiles
 * into four clean rows of exactly three columns. Longer labels went on the wide
 * cards, short ones on the squares. Add or remove an area and you must re-check
 * that the sizes still sum to a multiple of three per row.
 *
 * `blurb` is only used in the header dropdown; the cards carry the label alone.
 */
export interface PracticeArea {
  id: string;
  label: string;
  labelEn: string;
  blurb: string;
  blurbEn: string;
  size: 'wide' | 'small';
  image: string;
  /** 24×24 SVG path, drawn from property and construction - no gavels or scales. */
  icon: string;
}

export const practiceAreas: PracticeArea[] = [
  {
    id: 'purchase',
    label: 'רכישה ומכירה של דירות ונכסים',
    labelEn: 'Purchase and Sale of Apartments and Property',
    blurb: 'ליווי רוכשים ומוכרים - מהבדיקה הראשונית ועד רישום הזכויות.',
    blurbEn: 'Guiding buyers and sellers from the first review through to registration of rights.',
    size: 'wide',
    image: '/images/area-purchase.webp',
    icon: 'M4 12 12 5l8 7M6.5 10.5V19h11v-8.5',
  },
  {
    id: 'tax',
    label: 'מיסוי מקרקעין',
    labelEn: 'Real Estate Taxation',
    blurb: 'מס רכישה, מס שבח, פטורים והקלות - תכנון מוקדם שחוסך כסף.',
    blurbEn: 'Purchase tax, capital gains, exemptions and reliefs - planned early, before they cost money.',
    size: 'small',
    image: '/images/area-tax.webp',
    icon: 'M6 18 18 6M8.5 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm10 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  },
  {
    id: 'rmi',
    label: 'רשות מקרקעי ישראל',
    labelEn: 'Israel Land Authority',
    blurb: 'מכרזי רמ״י, חוזי חכירה, היוון והתנהלות מול הרשות.',
    blurbEn: 'ILA tenders, lease agreements, capitalisation and dealings with the Authority.',
    size: 'small',
    image: '/images/area-rmi.webp',
    icon: 'M12 21s6-5.7 6-10a6 6 0 1 0-12 0c0 4.3 6 10 6 10Zm0-8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  },
  {
    id: 'developer',
    label: 'רכישת דירות מקבלנים וליווי מול יזמים',
    labelEn: 'Purchasing from Developers',
    blurb: 'בדיקת הסכמי מכר, ערבויות חוק מכר ולוחות תשלומים מול הקבלן.',
    blurbEn: 'Reviewing sale agreements, statutory guarantees and payment schedules with the developer.',
    size: 'wide',
    image: '/images/area-developer.webp',
    icon: 'M6 19V8h6v11M12 19V4h6v15M8.5 11h1M8.5 14h1M14.5 7h1M14.5 10h1M14.5 13h1',
  },
  {
    id: 'land',
    label: 'עסקאות קרקע, מגרשים ובעלי זכויות',
    labelEn: 'Land, Plot and Rights-Holder Transactions',
    blurb: 'בדיקת זכויות ותב״ע, רישום והסכמי שיתוף בין בעלי הזכויות.',
    blurbEn: 'Reviewing rights and zoning, registration and co-ownership agreements between rights holders.',
    size: 'wide',
    image: '/images/area-land.webp',
    icon: 'M5 5h14v14H5zM5 10h14M10 10v9',
  },
  {
    id: 'renewal',
    label: 'התחדשות עירונית',
    labelEn: 'Urban Renewal',
    blurb: 'פינוי־בינוי ותמ״א 38 - ליווי בעלי דירות, נציגויות ויזמים.',
    blurbEn: 'Evacuate-and-rebuild and TAMA 38 - representing owners, tenant committees and developers.',
    size: 'small',
    image: '/images/area-renewal.webp',
    icon: 'M4 20h16M6.5 20v-9l4-3 4 3v9M16.5 20v-5l2-1.5 2 1.5v5',
  },
  {
    // §2.3 - שירות חדש לבקשת הלקוח
    id: 'foreign',
    label: 'ייצוג וליווי משקיעי חוץ',
    labelEn: 'Foreign Investor Representation',
    blurb:
      'ליווי משפטי ועסקי למשקיעים ולתושבי חוץ ברכישת נכסים ובהשקעות נדל״ן בישראל - מאיתור ההזדמנות ועד השלמת העסקה.',
    blurbEn:
      'Legal and commercial guidance for foreign buyers and investors, from sourcing the opportunity to closing.',
    size: 'small',
    image: '/images/area-foreign.webp',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c-2.5 2.6-4 5.6-4 9s1.5 6.4 4 9c2.5-2.6 4-5.6 4-9s-1.5-6.4-4-9Z',
  },
  {
    // §2.2 - שירות חדש לבקשת הלקוח
    id: 'entrepreneurs',
    label: 'ליווי יזמים בפרויקטי בנייה ויזמות',
    labelEn: 'Developer and Project Representation',
    blurb:
      'ליווי יזמים משלב בחינת ההזדמנות והקרקע, דרך מבנה העסקה והמשא ומתן, ועד לקידום הפרויקט והשלמתו.',
    blurbEn:
      'Representing developers from evaluating the opportunity and the land through to completing the project.',
    size: 'wide',
    image: '/images/area-entrepreneurs.webp',
    icon: 'M4 19h16M7 15.5l3.5-4.5 3 2.5L19 7M19 7h-3.6M19 7v3.6',
  },
];
