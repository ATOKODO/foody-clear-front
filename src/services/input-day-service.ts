import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateExternalMealEntryDto,
  CreateInputDayItemsDto,
  InputDayItemCommand,
  InputMonthResponse,
  InputDayResponse,
  InputWeekResponse,
  UpdateExternalMealEntryDto,
  UpdateInputDayItemDto,
} from '../interfaces/input-day.interface';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

@Injectable({ providedIn: 'root' })
export class InputDayService {
  private readonly http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string) {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  getInputDay(dateLocal: string, timezone?: string): Observable<InputDayResponse> {
    let params = new HttpParams();
    if (timezone && timezone.trim() !== '') {
      params = params.set('timezone', timezone.trim());
    }

    return this.http.get<InputDayResponse>(`${this.baseUrl}/input-days/${dateLocal}`, {
      params,
    });
  }

  getInputWeek(startDateLocal: string, timezone?: string): Observable<InputWeekResponse> {
    let params = new HttpParams();
    if (timezone && timezone.trim() !== '') {
      params = params.set('timezone', timezone.trim());
    }

    return this.http.get<InputWeekResponse>(
      `${this.baseUrl}/input-days/week/${startDateLocal}`,
      { params },
    );
  }

  getInputMonth(dateLocal: string, timezone?: string): Observable<InputMonthResponse> {
    let params = new HttpParams();
    if (timezone && timezone.trim() !== '') {
      params = params.set('timezone', timezone.trim());
    }

    return this.http.get<InputMonthResponse>(
      `${this.baseUrl}/input-days/month/${dateLocal}`,
      { params },
    );
  }

  createItem(dateLocal: string, dto: InputDayItemCommand): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/input-days/${dateLocal}/items`, dto);
  }

  createItems(dateLocal: string, dto: CreateInputDayItemsDto): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/input-days/${dateLocal}/items/bulk`, dto);
  }

  updateItem(
    dateLocal: string,
    itemId: number,
    dto: UpdateInputDayItemDto,
  ): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/input-days/${dateLocal}/items/${itemId}`, dto);
  }

  setTemplate(dateLocal: string, templateId: number | null): Observable<InputDayResponse> {
    return this.http.put<InputDayResponse>(`${this.baseUrl}/input-days/${dateLocal}/template`, {
      templateId,
    });
  }

  convertTemplateItem(
    dateLocal: string,
    templateItemId: number,
    inventoryIds: number[],
  ): Observable<InputDayResponse> {
    return this.http.post<InputDayResponse>(
      `${this.baseUrl}/input-days/${dateLocal}/template-items/${templateItemId}/convert`,
      {
        inventoryId: inventoryIds[0] ?? null,
      },
    );
  }

  createExternalEntry(
    dateLocal: string,
    dto: CreateExternalMealEntryDto,
  ): Observable<unknown> {
    return this.http.post(
      `${this.baseUrl}/input-days/${dateLocal}/external-entries`,
      dto,
    );
  }

  updateExternalEntry(
    dateLocal: string,
    entryId: number,
    dto: UpdateExternalMealEntryDto,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.baseUrl}/input-days/${dateLocal}/external-entries/${entryId}`,
      dto,
    );
  }

  removeExternalEntry(dateLocal: string, entryId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/input-days/${dateLocal}/external-entries/${entryId}`,
    );
  }

  removeItem(dateLocal: string, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/input-days/${dateLocal}/items/${itemId}`);
  }
}
