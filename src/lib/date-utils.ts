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
  subMonths
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const BOGOTA_TZ = 'America/Bogota';

export const formatDateToBogota = (date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(dateObj, BOGOTA_TZ);
  return format(zonedDate, formatStr, { locale: es });
};

export const formatDistanceToBogota = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(dateObj, BOGOTA_TZ);
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