// calendar-container.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateTime } from 'luxon';
import { CalendarView, CalendarDay, MonthSummary, HourSlot, CalendarAssignment } from '../../interfaces/calendar.interface';
import { 
  generateMonthDays, 
  generateWeekDays, 
  generateYearMonths, 
  generateDayHours,
  WEEKDAY_NAMES 
} from '../../utils/calendar.utils';

export interface CalendarDayClickEvent {
  view: CalendarView;
  currentDateIso: string;
  day: CalendarDay;
}

export interface CalendarHourClickEvent {
  view: CalendarView;
  currentDateIso: string;
  hour: HourSlot;
}

export interface CalendarMonthClickEvent {
  view: CalendarView;
  currentDateIso: string;
  month: MonthSummary;
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
  templateUrl: './calendar.html'
})
export class Calendar implements OnInit {
  @Output() readonly dayClick = new EventEmitter<CalendarDayClickEvent>();
  @Output() readonly hourClick = new EventEmitter<CalendarHourClickEvent>();
  @Output() readonly monthClick = new EventEmitter<CalendarMonthClickEvent>();
  
  readonly VIEWS: CalendarView[] = ['year', 'month', 'week', 'day'];

  // État
  currentView: CalendarView = 'month';
  currentDate = DateTime.now();
  loading = false;
  
  // Données
  monthDays: CalendarDay[] = [];
  weekDays: CalendarDay[] = [];
  yearMonths: MonthSummary[] = [];
  dayHours: HourSlot[] = [];
  
  // Constantes
  readonly WEEKDAY_NAMES = WEEKDAY_NAMES;
  
  // Mock data (à remplacer plus tard)
  private mockAssignments: CalendarAssignment[] = [
    {
      id: '1',
      type: 'cycle',
      cycleName: 'Prise de masse',
      dayNumber: 1,
      totalDays: 5,
      calorieTarget: 3000,
      actualCalories: 2800,
      label: 'High carb',
      color: 'bg-blue-500'
    },
    {
      id: '2',
      type: 'cheat_day',
      label: 'Cheat Day',
      color: 'bg-orange-500'
    },
    {
      id: '3',
      type: 'workout',
      label: 'Upper Body',
      color: 'bg-green-500'
    }
  ];
  
  ngOnInit() {
    this.loadView();
    this.applyMockData();
  }
  
  loadView() {
    this.loading = true;
    
    switch (this.currentView) {
      case 'month':
        this.monthDays = generateMonthDays(this.currentDate.month, this.currentDate.year);
        break;
      case 'week':
        this.weekDays = generateWeekDays(this.currentDate);
        break;
      case 'year':
        this.yearMonths = generateYearMonths(this.currentDate.year);
        break;
      case 'day':
        this.dayHours = generateDayHours();
        break;
    }
    
    this.loading = false;
  }
  
  applyMockData() {
    // Simuler des données
    const today = DateTime.now().toISODate();
    const tomorrow = DateTime.now().plus({ days: 1 }).toISODate();
    const nextWeek = DateTime.now().plus({ days: 7 }).toISODate();
    
    if (this.currentView === 'month') {
      this.monthDays.forEach(day => {
        if (day.date === today) day.assignment = this.mockAssignments[0];
        if (day.date === tomorrow) day.assignment = this.mockAssignments[1];
        if (day.isWeekend && day.isCurrentMonth) day.assignment = this.mockAssignments[1];
      });
    }
    
    if (this.currentView === 'week') {
      this.weekDays.forEach(day => {
        if (day.date === today) day.assignment = this.mockAssignments[0];
        if (day.isWeekend) day.assignment = this.mockAssignments[1];
      });
    }
    
    if (this.currentView === 'day') {
      this.dayHours[8].assignment = this.mockAssignments[2]; // 8h workout
      this.dayHours[12].assignment = this.mockAssignments[0]; // 12h meal
    }
  }
  
  navigate(direction: 'prev' | 'next') {
    switch (this.currentView) {
      case 'month':
        this.currentDate = direction === 'next'
          ? this.currentDate.plus({ months: 1 })
          : this.currentDate.minus({ months: 1 });
        break;
      case 'week':
        this.currentDate = direction === 'next'
          ? this.currentDate.plus({ weeks: 1 })
          : this.currentDate.minus({ weeks: 1 });
        break;
      case 'year':
        this.currentDate = direction === 'next'
          ? this.currentDate.plus({ years: 1 })
          : this.currentDate.minus({ years: 1 });
        break;
      case 'day':
        this.currentDate = direction === 'next'
          ? this.currentDate.plus({ days: 1 })
          : this.currentDate.minus({ days: 1 });
        break;
    }
    
    this.loadView();
    this.applyMockData();
  }
  
  switchView(view: CalendarView) {
    this.currentView = view;
    this.loadView();
    this.applyMockData();
  }
  
  goToToday() {
    this.currentDate = DateTime.now();
    this.loadView();
    this.applyMockData();
  }
  
  onDayClick(day: CalendarDay) {
    this.dayClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO(),
      day,
    });
  }
  
  onHourClick(hour: HourSlot) {
    this.hourClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO(),
      hour,
    });
  }
  
  onMonthClick(month: MonthSummary) {
    this.monthClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO(),
      month,
    });
  }
  
  get currentViewLabel(): string {
    switch (this.currentView) {
      case 'year':
        return this.currentDate.toFormat('yyyy');
      case 'month':
        return this.currentDate.toFormat('LLLL yyyy', { locale: 'fr' });
      case 'week':
        const start = this.currentDate.startOf('week');
        const end = this.currentDate.endOf('week');
        return `${start.toFormat('d MMM', { locale: 'fr' })} - ${end.toFormat('d MMM yyyy', { locale: 'fr' })}`;
      case 'day':
        return this.currentDate.toFormat('EEEE d LLLL yyyy', { locale: 'fr' });
      default:
        return '';
    }
  }
}
