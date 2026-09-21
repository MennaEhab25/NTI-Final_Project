import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Project } from '../../core/models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private api = 'http://localhost:3000/api/projects';
  constructor(private http: HttpClient) {}

  getAll(filters: Record<string, string> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params = params.set(key, value); });
    return this.http.get<{ data: Project[] }>(this.api, { params });
  }

  getById(id: string) { return this.http.get<{ data: Project }>(`${this.api}/${id}`); }
  getMine(userId: string) { return this.http.get<{ data: Project[] }>(`${this.api}/mine`, { headers: { 'x-user-id': userId } }); }
  create(userId: string, body: Partial<Project>) { return this.http.post<{ data: Project }>(this.api, body, { headers: { 'x-user-id': userId } }); }
  update(userId: string, id: string, body: Partial<Project>) { return this.http.patch<{ data: Project }>(`${this.api}/${id}`, body, { headers: { 'x-user-id': userId } }); }
  remove(userId: string, id: string) { return this.http.delete(`${this.api}/${id}`, { headers: { 'x-user-id': userId } }); }
}
