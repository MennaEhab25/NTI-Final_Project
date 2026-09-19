import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WithdrawalService {
  private api = 'http://localhost:3000/api/withdrawals';

  constructor(private http: HttpClient) {}

  create(userId: string, amount: number, method: string, accountDetails: string): Observable<any> {
    return this.http.post(
      this.api,
      { amount, method, accountDetails },
      { headers: new HttpHeaders({ 'x-user-id': userId }) },
    );
  }

  list(userId: string): Observable<any> {
    return this.http.get(this.api, { headers: new HttpHeaders({ 'x-user-id': userId }) });
  }
}
