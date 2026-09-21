import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ExtensionService {
  private api = 'http://localhost:3000/api/extensions';
  constructor(private http: HttpClient) {}
  approve(userId: string, id: string) { return this.http.post(`${this.api}/${id}/approve`, {}, { headers: { 'x-user-id': userId } }); }
  reject(userId: string, id: string) { return this.http.post(`${this.api}/${id}/reject`, {}, { headers: { 'x-user-id': userId } }); }
}
