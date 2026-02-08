import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCycleDto, Cycle, UpdateCycleDto } from '../interfaces/cycle.interface';

@Injectable({ providedIn: 'root' })
export class CycleService {
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  create(dto: CreateCycleDto): Observable<Cycle> {
    return this.http.post<Cycle>(`${this.baseUrl}/cycle`, dto);
  }

  findAll(): Observable<Cycle[]> {
    return this.http.get<Cycle[]>(`${this.baseUrl}/cycle`);
  }

  findOne(id: number): Observable<Cycle> {
    return this.http.get<Cycle>(`${this.baseUrl}/cycle/${id}`);
  }

  update(id: number, dto: UpdateCycleDto): Observable<Cycle> {
    return this.http.patch<Cycle>(`${this.baseUrl}/cycle/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cycle/${id}`);
  }
}
