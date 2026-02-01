// utils/calendar.utils.ts
import { DateTime } from 'luxon';
import { CalendarDay, MonthSummary, HourSlot } from '../interfaces/calendar.interface'

export function generateMonthDays(month: number, year: number): CalendarDay[] {
  const firstDay = DateTime.local(year, month, 1);
  const lastDay = firstDay.endOf('month');
  const startDate = firstDay.startOf('week');
  const endDate = lastDay.endOf('week');
  
  const days: CalendarDay[] = [];
  let current = startDate;
  
  while (current <= endDate) {
    days.push({
      date: current.toISODate()!,
      dateObj: current,
      dayNumber: current.day,
      isToday: current.hasSame(DateTime.now(), 'day'),
      isCurrentMonth: current.month === month,
      isWeekend: current.weekday >= 6
    });
    
    current = current.plus({ days: 1 });
  }
  
  return days;
}

export function generateWeekDays(date: DateTime): CalendarDay[] {
  const startOfWeek = date.startOf('week');
  const days: CalendarDay[] = [];
  
  for (let i = 0; i < 7; i++) {
    const current = startOfWeek.plus({ days: i });
    days.push({
      date: current.toISODate()!,
      dateObj: current,
      dayNumber: current.day,
      isToday: current.hasSame(DateTime.now(), 'day'),
      isCurrentMonth: true,
      isWeekend: current.weekday >= 6
    });
  }
  
  return days;
}

export function generateYearMonths(year: number): MonthSummary[] {
  const months: MonthSummary[] = [];
  
  for (let month = 1; month <= 12; month++) {
    const days = generateMonthDays(month, year);
    
    months.push({
      month,
      year,
      name: DateTime.local(year, month).toFormat('LLLL', { locale: 'fr' }),
      days,
      hasAssignments: false
    });
  }
  
  return months;
}

export function generateDayHours(): HourSlot[] {
  const hours: HourSlot[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    hours.push({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`
    });
  }
  
  return hours;
}

export const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];