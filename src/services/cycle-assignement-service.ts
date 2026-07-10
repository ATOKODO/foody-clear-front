import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateCycleAssignmentDto,
  CycleAssignment,
  UpdateCycleAssignmentDto,
} from '../interfaces/cycle-assignment.interface';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

@Injectable({
  providedIn: 'root',
})
export class CycleAssignementService {
  private readonly http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string): void {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  create(dto: CreateCycleAssignmentDto): Observable<CycleAssignment> {
    return this.http.post<CycleAssignment>(`${this.baseUrl}/cycle-assignment`, dto);
  }

  findAll(): Observable<CycleAssignment[]> {
    return this.http.get<CycleAssignment[]>(`${this.baseUrl}/cycle-assignment`);
  }

  findInRange(from: string, to: string): Observable<CycleAssignment[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<CycleAssignment[]>(`${this.baseUrl}/cycle-assignment`, { params });
  }

  findOne(id: number): Observable<CycleAssignment> {
    return this.http.get<CycleAssignment>(`${this.baseUrl}/cycle-assignment/${id}`);
  }

  update(id: number, dto: UpdateCycleAssignmentDto): Observable<CycleAssignment> {
    return this.http.patch<CycleAssignment>(`${this.baseUrl}/cycle-assignment/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cycle-assignment/${id}`);
  }
}
