import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Proposal } from '../../core/models/proposal.model';

@Injectable({ providedIn: 'root' })
export class ProposalService {
  private api = 'http://localhost:3000/api';
  constructor(private http: HttpClient) {}

  submit(userId: string, projectId: string, body: { price: number; duration: number; coverLetter: string }) {
    return this.http.post<{ data: Proposal }>(`${this.api}/projects/${projectId}/proposals`, body, { headers: { 'x-user-id': userId } });
  }
  getForProject(projectId: string) { return this.http.get<{ data: Proposal[] }>(`${this.api}/projects/${projectId}/proposals`); }
  getMine(userId: string) { return this.http.get<{ data: Proposal[] }>(`${this.api}/proposals/mine`, { headers: { 'x-user-id': userId } }); }
  update(userId: string, id: string, body: Partial<Proposal>) { return this.http.patch(`${this.api}/proposals/${id}`, body, { headers: { 'x-user-id': userId } }); }
  shortlist(userId: string, id: string) { return this.action(userId, id, 'shortlist'); }
  accept(userId: string, id: string) { return this.action(userId, id, 'accept'); }
  reject(userId: string, id: string) { return this.action(userId, id, 'reject'); }
  withdraw(userId: string, id: string) { return this.action(userId, id, 'withdraw'); }
  private action(userId: string, id: string, action: string) {
    return this.http.post(`${this.api}/proposals/${id}/${action}`, {}, { headers: { 'x-user-id': userId } });
  }
}
