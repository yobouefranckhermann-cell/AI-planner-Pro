export const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const MONTH_SHORT_FR = [
  'JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN',
  'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'
];

export const DAY_NAMES_FR = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
];

export function getTodayDateString(): string {
  // Return YYYY-MM-DD
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatFullFrenchDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayName = DAY_NAMES_FR[d.getDay()];
  const monthName = MONTH_NAMES_FR[d.getMonth()].toLowerCase();
  return `${dayName} ${day} ${monthName} ${year}`;
}

export function formatMonthYearFrench(year: number, monthZeroBased: number): string {
  return `${MONTH_NAMES_FR[monthZeroBased]} ${year}`;
}

// Get the current week range (Lundi au Dimanche) containing the target date
export function getWeekRangeForDate(dateStr: string): { start: string; end: string; days: string[] } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  
  // Day of week in JS is 0 (Sunday) to 6 (Saturday).
  // We want Lundi (1) to Dimanche (0/7).
  const dayOfWeek = d.getDay();
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + distanceToMonday);
  
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${dd}`);
  }
  
  return {
    start: days[0],
    end: days[6],
    days
  };
}

// Parses string date input like "30/05/2026", "hier", "avant-hier", "samedi 10 juin"
export function parseSearchDate(query: string): string | null {
  const cleaned = query.trim().toLowerCase();
  const today = new Date();

  if (cleaned === 'aujourd\'hui' || cleaned === 'aujourdhui') {
    return getTodayDateString();
  }
  
  if (cleaned === 'hier') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  if (cleaned === 'avant-hier' || cleaned === 'avant hier') {
    const avHier = new Date(today);
    avHier.setDate(today.getDate() - 2);
    return avHier.toISOString().split('T')[0];
  }

  // Regex check for DD/MM/YYYY
  const dmYRegex = /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/;
  const match = cleaned.match(dmYRegex);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}
