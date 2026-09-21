import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Contract } from '../../core/models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private api = 'http://localhost:3000/api/contracts';
  constructor(private http: HttpClient) {}
  get(id: string) { return this.http.get<{ data: Contract }>(`${this.api}/${id}`); }
  start(userId: string, id: string) { return this.http.post(`${this.api}/${id}/start`, {}, { headers: { 'x-user-id': userId } }); }
  downloadPdf(id: string) { return this.http.get(`${this.api}/${id}/pdf`, { responseType: 'blob' }); }
  requestExtension(userId: string, id: string, requestedDays: number, reason: string) {
    return this.http.post(`${this.api}/${id}/extensions`, { requestedDays, reason }, { headers: { 'x-user-id': userId } });
  }
}
