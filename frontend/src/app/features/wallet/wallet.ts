import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaymentService } from './payment';
import { WalletService } from './wallet-service';
import { WithdrawalService } from './withdrawal';

declare const FawryPay: any;
declare const DISPLAY_MODE: any;

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-wallet',
  styleUrl: './wallet.css',
  templateUrl: './wallet.html',
})
export class Wallet implements OnInit {
  userId = localStorage.getItem('demoFreelancerId') || 'freelancer-demo-1';
  summary = { balance: 0, reserved: 0, available: 0 };
  transactions: any[] = [];
  withdrawals: any[] = [];
  message = '';
  loading = false;

  checkout = {
    clientId: 'client-demo-1',
    freelancerId: this.userId,
    contractId: 'contract-demo-1',
    amount: 100,
    customerName: 'Test Customer',
    customerEmail: 'test@email.com',
    customerMobile: '01000000000',
  };

  withdrawal = {
    amount: 50,
    method: 'MOBILE_WALLET',
    accountDetails: '01000000000',
  };

  constructor(
    private paymentService: PaymentService,
    private walletService: WalletService,
    private withdrawalService: WithdrawalService,
  ) {}

  ngOnInit() {
    this.refresh();
  }

  saveUser() {
    localStorage.setItem('demoFreelancerId', this.userId);
    this.checkout.freelancerId = this.userId;
    this.refresh();
  }

  refresh() {
    this.walletService.summary(this.userId).subscribe({
      next: (res) => (this.summary = res.data),
      error: (err) => (this.message = err.error?.message || 'Could not load wallet'),
    });

    this.walletService.transactions(this.userId).subscribe({
      next: (res) => (this.transactions = res.data),
    });

    this.withdrawalService.list(this.userId).subscribe({
      next: (res) => (this.withdrawals = res.data),
    });
  }

  pay() {
    this.loading = true;
    this.message = '';
    this.checkout.freelancerId = this.userId;

    this.paymentService.createCheckout(this.checkout).subscribe({
      next: (res) => {
        this.loading = false;

        if (typeof FawryPay === 'undefined') {
          this.message = 'FawryPay script did not load. Check frontend/src/index.html.';
          return;
        }

        const config = { locale: 'en', mode: DISPLAY_MODE.POPUP };
        FawryPay.checkout(res.data.chargeRequest, config);
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Could not start payment';
      },
    });
  }

  requestWithdrawal() {
    this.withdrawalService
      .create(this.userId, Number(this.withdrawal.amount), this.withdrawal.method, this.withdrawal.accountDetails)
      .subscribe({
        next: () => {
          this.message = 'Withdrawal request created.';
          this.refresh();
        },
        error: (err) => (this.message = err.error?.message || 'Could not create withdrawal'),
      });
  }
}
