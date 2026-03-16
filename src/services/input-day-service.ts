import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateInputDayItemsDto,
  InputDayItemCommand,
  InputMonthResponse,
  InputDayResponse,
  InputWeekResponse,
  UpdateInputDayItemDto,
} from '../interfaces/input-day.interface';

@Injectable({ providedIn: 'root' })
export class InputDayService {
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
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
    inventoryId: number,
  ): Observable<InputDayResponse> {
    return this.http.post<InputDayResponse>(
      `${this.baseUrl}/input-days/${dateLocal}/template-items/${templateItemId}/convert`,
      {
        inventoryId,
      },
    );
  }

  removeItem(dateLocal: string, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/input-days/${dateLocal}/items/${itemId}`);
  }
}
