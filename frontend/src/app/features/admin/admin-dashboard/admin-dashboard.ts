import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-admin-dashboard',
  styleUrl: './admin-dashboard.css',
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit {
  key = localStorage.getItem('adminKey') || 'nti-admin';
  stats: any = { users: 0, projects: 0, payments: 0, pendingWithdrawals: 0 };
  withdrawals: any[] = [];
  transactions: any[] = [];
  skills: any[] = [];
  users: any[] = [];
  projects: any[] = [];
  skill = { name: '', category: 'General' };
  message = '';

  constructor(private admin: AdminService) {}

  ngOnInit() { this.load(); }

  saveKey() { this.admin.setAdminKey(this.key); this.load(); }

  load() {
    this.admin.dashboard().subscribe({ next: (r) => (this.stats = r.data), error: (e) => this.fail(e) });
    this.admin.withdrawals().subscribe({ next: (r) => (this.withdrawals = r.data) });
    this.admin.transactions().subscribe({ next: (r) => (this.transactions = r.data) });
    this.admin.skills().subscribe({ next: (r) => (this.skills = r.data) });
    this.admin.users().subscribe({ next: (r) => (this.users = r.data) });
    this.admin.projects().subscribe({ next: (r) => (this.projects = r.data) });
  }

  addSkill() {
    if (!this.skill.name.trim()) return;
    this.admin.addSkill(this.skill).subscribe({ next: () => { this.skill.name = ''; this.load(); }, error: (e) => this.fail(e) });
  }

  deleteSkill(id: string) { this.admin.deleteSkill(id).subscribe(() => this.load()); }
  approve(id: string) { this.admin.approveWithdrawal(id).subscribe({ next: () => this.load(), error: (e) => this.fail(e) }); }
  reject(id: string) { this.admin.rejectWithdrawal(id).subscribe({ next: () => this.load(), error: (e) => this.fail(e) }); }
  private fail(error: any) { this.message = error.error?.message || 'Request failed'; }
}
