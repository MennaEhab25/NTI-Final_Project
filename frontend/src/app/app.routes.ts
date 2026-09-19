import { Routes } from '@angular/router';
import { Wallet } from './features/wallet/wallet';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: 'wallet', component: Wallet },
  { path: 'admin', component: AdminDashboard },
  { path: '', redirectTo: 'wallet', pathMatch: 'full' },
  { path: '**', redirectTo: 'wallet' },
];
