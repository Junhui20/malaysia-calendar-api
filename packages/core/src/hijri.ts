/**
 * Basic Hijri date utilities.
 *
 * Note: Hijri dates for Islamic holidays are approximate until confirmed
 * by JAKIM rukyah (moon sighting). This module provides reference mapping
 * only — actual dates should come from the gazette/JAKIM confirmation.
 */

export interface HijriMonth {
  readonly number: number;
  readonly nameMs: string;
  readonly nameEn: string;
  readonly nameAr: string;
}

export const HIJRI_MONTHS: readonly HijriMonth[] = [
  { number: 1, nameMs: "Muharam", nameEn: "Muharram", nameAr: "محرّم" },
  { number: 2, nameMs: "Safar", nameEn: "Safar", nameAr: "صفر" },
  { number: 3, nameMs: "Rabiulawal", nameEn: "Rabi al-Awwal", nameAr: "ربيع الأوّل" },
  { number: 4, nameMs: "Rabiulakhir", nameEn: "Rabi al-Thani", nameAr: "ربيع الثاني" },
  { number: 5, nameMs: "Jamadilawal", nameEn: "Jumada al-Ula", nameAr: "جمادى الأولى" },
  { number: 6, nameMs: "Jamadilakhir", nameEn: "Jumada al-Thani", nameAr: "جمادى الثانية" },
  { number: 7, nameMs: "Rejab", nameEn: "Rajab", nameAr: "رجب" },
  { number: 8, nameMs: "Syaaban", nameEn: "Sha'ban", nameAr: "شعبان" },
  { number: 9, nameMs: "Ramadan", nameEn: "Ramadan", nameAr: "رمضان" },
  { number: 10, nameMs: "Syawal", nameEn: "Shawwal", nameAr: "شوّال" },
  { number: 11, nameMs: "Zulkaedah", nameEn: "Dhu al-Qi'dah", nameAr: "ذو القعدة" },
  { number: 12, nameMs: "Zulhijjah", nameEn: "Dhu al-Hijjah", nameAr: "ذو الحجّة" },
] as const;

/**
 * Parse a hijri date string like "1 Syawal 1447" → { day, month, year }
 */
export function parseHijriDate(
  hijriStr: string
): { day: number; month: HijriMonth; year: number } | null {
  const match = hijriStr.match(/^(\d+)\s+(.+?)\s+(\d+)$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthName = match[2].toLowerCase();
  const year = parseInt(match[3], 10);

  const month = HIJRI_MONTHS.find(
    (m) =>
      m.nameMs.toLowerCase() === monthName ||
      m.nameEn.toLowerCase() === monthName
  );

  if (!month) return null;

  return { day, month, year };
}

/**
 * Format a hijri date for display: "1 Syawal 1447"
 */
export function formatHijriDate(day: number, monthNumber: number, year: number): string {
  const month = HIJRI_MONTHS.find((m) => m.number === monthNumber);
  if (!month) return `${day} ? ${year}`;
  return `${day} ${month.nameMs} ${year}`;
}

/**
 * Key Islamic holidays and their Hijri dates (fixed in the Islamic calendar).
 * Gregorian dates shift ~11 days earlier each year.
 */
export const ISLAMIC_HOLIDAY_DATES: readonly {
  readonly nameMs: string;
  readonly nameEn: string;
  readonly hijriMonth: number;
  readonly hijriDay: number;
}[] = [
  { nameMs: "Awal Muharam", nameEn: "Islamic New Year", hijriMonth: 1, hijriDay: 1 },
  { nameMs: "Maulidur Rasul", nameEn: "Prophet Muhammad's Birthday", hijriMonth: 3, hijriDay: 12 },
  { nameMs: "Israk dan Mikraj", nameEn: "Isra' Mi'raj", hijriMonth: 7, hijriDay: 27 },
  { nameMs: "Nuzul Al-Quran", nameEn: "Revelation of the Quran", hijriMonth: 9, hijriDay: 17 },
  { nameMs: "Hari Raya Aidilfitri", nameEn: "Eid al-Fitr", hijriMonth: 10, hijriDay: 1 },
  { nameMs: "Hari Raya Haji", nameEn: "Eid al-Adha", hijriMonth: 12, hijriDay: 10 },
  { nameMs: "Hari Arafah", nameEn: "Day of Arafah", hijriMonth: 12, hijriDay: 9 },
];
