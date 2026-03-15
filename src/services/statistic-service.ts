import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductPriceHistoryStatsResponse,
  StatisticsTimelineResponse,
} from '../interfaces/statistics.interface';

@Injectable({ providedIn: 'root' })
export class StatisticService {
  baseUrl = 'http://localhost:3000';

  constructor(private readonly http: HttpClient) {}

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getTimeline(
    fromDateLocal: string,
    toDateLocal: string,
    timezone: string,
  ): Observable<StatisticsTimelineResponse> {
    const params = new HttpParams()
      .set('from', fromDateLocal)
      .set('to', toDateLocal)
      .set('timezone', timezone);
    return this.http.get<StatisticsTimelineResponse>(`${this.baseUrl}/statistics/timeline`, {
      params,
    });
  }

  getProductPriceHistory(
    productId: number,
    fromDateLocal: string,
    toDateLocal: string,
    timezone: string,
  ): Observable<ProductPriceHistoryStatsResponse> {
    const params = new HttpParams()
      .set('from', fromDateLocal)
      .set('to', toDateLocal)
      .set('timezone', timezone);
    return this.http.get<ProductPriceHistoryStatsResponse>(
      `${this.baseUrl}/statistics/product-price-history/${productId}`,
      { params },
    );
  }
}
