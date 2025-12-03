import {
  format,
  formatDistanceToNow,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  parseISO
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const BOGOTA_TZ = 'America/Bogota';

/**
 * Parsea una fecha correctamente, manejando el problema de timezone.
 * Para strings de solo fecha (YYYY-MM-DD), los trata como fecha local de Bogotá.
 * Para strings con timestamp o Date objects, los convierte a Bogotá.
 */
export const parseDateForBogota = (date: Date | string): Date => {
  if (date instanceof Date) {
    return toZonedTime(date, BOGOTA_TZ);
  }

  // Si es un string de solo fecha (YYYY-MM-DD), parsearlo como local
  // Esto evita el problema de que "2025-12-03" se convierta en "2025-12-02 19:00" en Bogotá
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Agregar T12:00:00 para evitar problemas de timezone (mediodía es seguro)
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Para timestamps completos, convertir a Bogotá
  const dateObj = parseISO(date);
  return toZonedTime(dateObj, BOGOTA_TZ);
};

export const formatDateToBogota = (date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm') => {
  const zonedDate = parseDateForBogota(date);
  return format(zonedDate, formatStr, { locale: es });
};

export const formatDistanceToBogota = (date: Date | string) => {
  const zonedDate = parseDateForBogota(date);
  return formatDistanceToNow(zonedDate, { addSuffix: true, locale: es });
};

export const getCurrentWeekRange = () => {
  const now = toZonedTime(new Date(), BOGOTA_TZ);
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
  const end = endOfWeek(now, { weekStartsOn: 1 }); // Domingo
  
  return {
    start: fromZonedTime(start, BOGOTA_TZ),
    end: fromZonedTime(end, BOGOTA_TZ)
  };
};

export const getPreviousWeekRange = () => {
  const now = toZonedTime(new Date(), BOGOTA_TZ);
  const previousWeek = subWeeks(now, 1);
  const start = startOfWeek(previousWeek, { weekStartsOn: 1 });
  const end = endOfWeek(previousWeek, { weekStartsOn: 1 });
  
  return {
    start: fromZonedTime(start, BOGOTA_TZ),
    end: fromZonedTime(end, BOGOTA_TZ)
  };
};

export const getWeekRange = (weeksOffset: number = 0) => {
  const now = toZonedTime(new Date(), BOGOTA_TZ);
  const targetWeek = weeksOffset === 0 ? now : addWeeks(now, weeksOffset);
  const start = startOfWeek(targetWeek, { weekStartsOn: 1 });
  const end = endOfWeek(targetWeek, { weekStartsOn: 1 });
  
  return {
    start: fromZonedTime(start, BOGOTA_TZ),
    end: fromZonedTime(end, BOGOTA_TZ)
  };
};

export const getCurrentMonthRange = () => {
  const now = toZonedTime(new Date(), BOGOTA_TZ);
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  
  return {
    start: fromZonedTime(start, BOGOTA_TZ),
    end: fromZonedTime(end, BOGOTA_TZ)
  };
};

export const getPreviousMonthRange = () => {
  const now = toZonedTime(new Date(), BOGOTA_TZ);
  const previousMonth = subMonths(now, 1);
  const start = startOfMonth(previousMonth);
  const end = endOfMonth(previousMonth);
  
  return {
    start: fromZonedTime(start, BOGOTA_TZ),
    end: fromZonedTime(end, BOGOTA_TZ)
  };
};

export const getMonthRange = (monthsOffset: number = 0) => {
  const now = toZonedTime(new Date(), BOGOTA_TZ);
  const targetMonth = monthsOffset === 0 ? now : addMonths(now, monthsOffset);
  const start = startOfMonth(targetMonth);
  const end = endOfMonth(targetMonth);
  
  return {
    start: fromZonedTime(start, BOGOTA_TZ),
    end: fromZonedTime(end, BOGOTA_TZ)
  };
};

export const formatWeekLabel = (start: Date, end: Date) => {
  return `${formatDateToBogota(start, 'dd MMM')} - ${formatDateToBogota(end, 'dd MMM yyyy')}`;
};

export const formatMonthLabel = (date: Date) => {
  return formatDateToBogota(date, 'MMMM yyyy');
};