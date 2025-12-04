const SAFE_FALLBACK = 'Sin fecha';

const parseDate = (isoDate: string | Date | undefined | null): Date | null => {
  if (!isoDate) return null;
  
  // Si ya es Date, retornarlo
  if (isoDate instanceof Date) {
    return Number.isNaN(isoDate.getTime()) ? null : isoDate;
  }
  
  // Si es string, parsearlo
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (isoDate: string | Date | undefined | null, locale: string = 'es-AR'): string => {
  const date = parseDate(isoDate);
  if (!date) return SAFE_FALLBACK;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (isoDate: string | Date | undefined | null, locale: string = 'es-AR'): string => {
  const date = parseDate(isoDate);
  if (!date) return SAFE_FALLBACK;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};