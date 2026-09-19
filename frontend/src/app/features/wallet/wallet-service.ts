import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private api = 'http://localhost:3000/api/wallet';

  constructor(private http: HttpClient) {}

  summary(userId: string): Observable<any> {
    return this.http.get(this.api, { headers: this.userHeaders(userId) });
  }

  transactions(userId: string): Observable<any> {
    return this.http.get(`${this.api}/transactions`, { headers: this.userHeaders(userId) });
  }

  private userHeaders(userId: string) {
    return new HttpHeaders({ 'x-user-id': userId });
  }
}
