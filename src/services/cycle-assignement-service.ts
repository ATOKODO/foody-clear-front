import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateCycleAssignmentDto,
  CycleAssignment,
  UpdateCycleAssignmentDto,
} from '../interfaces/cycle-assignment.interface';

@Injectable({
  providedIn: 'root',
})
export class CycleAssignementService {
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  create(dto: CreateCycleAssignmentDto): Observable<CycleAssignment> {
    return this.http.post<CycleAssignment>(`${this.baseUrl}/cycle-assignment`, dto);
  }

  findAll(): Observable<CycleAssignment[]> {
    return this.http.get<CycleAssignment[]>(`${this.baseUrl}/cycle-assignment`);
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
