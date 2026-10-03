import { Injectable, effect, inject } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { Language } from './language';

@Injectable({ providedIn: 'root' })
export class MaterialDatepickerIntl extends MatDatepickerIntl {
  private readonly language = inject(Language);

  constructor() {
    super();
    effect(() => {
      const translate = (source: string): string => this.language.translate(source);
      this.calendarLabel = translate('Calendar');
      this.openCalendarLabel = translate('Open calendar');
      this.closeCalendarLabel = translate('Close calendar');
      this.prevMonthLabel = translate('Previous month');
      this.nextMonthLabel = translate('Next month');
      this.prevYearLabel = translate('Previous year');
      this.nextYearLabel = translate('Next year');
      this.prevMultiYearLabel = translate('Previous 24 years');
      this.nextMultiYearLabel = translate('Next 24 years');
      this.switchToMonthViewLabel = translate('Choose date');
      this.switchToMultiYearViewLabel = translate('Choose month and year');
      this.startDateLabel = translate('Start date');
      this.endDateLabel = translate('End date');
      this.comparisonDateLabel = translate('Comparison date');
      this.changes.next();
    });
  }

  override formatYearRangeLabel(start: string, end: string): string {
    return this.language.translate('Years {p0} to {p1}', { p0: start, p1: end });
  }
}
