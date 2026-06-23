import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateSlotDto, Slot, UpdateSlotDto } from '../interfaces/slot.interface';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

@Injectable({
  providedIn: 'root',
})
export class SlotService {
  private http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string): void {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  create(dto: CreateSlotDto): Observable<Slot> {
    return this.http.post<Slot>(`${this.baseUrl}/slot`, dto);
  }

  findAll(): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${this.baseUrl}/slot`);
  }

  findOne(id: number): Observable<Slot> {
    return this.http.get<Slot>(`${this.baseUrl}/slot/${id}`);
  }

  update(id: number, dto: UpdateSlotDto): Observable<Slot> {
    return this.http.patch<Slot>(`${this.baseUrl}/slot/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/slot/${id}`);
  }
}
