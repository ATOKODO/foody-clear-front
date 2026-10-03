import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/** Parses the numeric day/month/year format shared by en-GB and fr-FR. */
@Injectable()
export class LocalizedDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value !== 'string') return super.parse(value, parseFormat);
    const text = value.trim();
    if (!text) return null;
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    const localized = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
    if (!iso && !localized) return this.invalid();
    const year = Number(iso?.[1] ?? localized?.[3]);
    const month = Number(iso?.[2] ?? localized?.[2]);
    const day = Number(iso?.[3] ?? localized?.[1]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return this.invalid();
    try {
      const date = this.createDate(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
        ? date : this.invalid();
    } catch {
      return this.invalid();
    }
  }
}
