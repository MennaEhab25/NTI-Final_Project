import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = 'http://localhost:3000/api/admin';
  private adminKey = localStorage.getItem('adminKey') || 'nti-admin';

  constructor(private http: HttpClient) {}

  setAdminKey(key: string) {
    this.adminKey = key;
    localStorage.setItem('adminKey', key);
  }

  dashboard() { return this.http.get<any>(`${this.api}/dashboard`, this.options()); }
  users() { return this.http.get<any>(`${this.api}/users`, this.options()); }
  projects() { return this.http.get<any>(`${this.api}/projects`, this.options()); }
  skills() { return this.http.get<any>(`${this.api}/skills`, this.options()); }
  addSkill(data: any) { return this.http.post<any>(`${this.api}/skills`, data, this.options()); }
  deleteSkill(id: string) { return this.http.delete(`${this.api}/skills/${id}`, this.options()); }
  transactions() { return this.http.get<any>(`${this.api}/transactions`, this.options()); }
  withdrawals() { return this.http.get<any>(`${this.api}/withdrawals`, this.options()); }
  approveWithdrawal(id: string) { return this.http.post<any>(`${this.api}/withdrawals/${id}/approve`, {}, this.options()); }
  rejectWithdrawal(id: string) { return this.http.post<any>(`${this.api}/withdrawals/${id}/reject`, {}, this.options()); }

  private options() {
    return { headers: new HttpHeaders({ 'x-admin-key': this.adminKey }) };
  }
}
