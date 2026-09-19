import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CheckoutForm {
  clientId: string;
  freelancerId: string;
  contractId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
}

export interface FawryChargeRequest {
  merchantCode: string;
  merchantRefNum: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerProfileId: string;
  paymentExpiry: string;
  chargeItems: { itemId: string; description: string; price: number; quantity: number }[];
  returnUrl: string;
  authCaptureModePayment: boolean;
  signature: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private api = 'http://localhost:3000/api/payments';

  constructor(private http: HttpClient) {}

  createCheckout(form: CheckoutForm): Observable<{ data: { payment: any; chargeRequest: FawryChargeRequest } }> {
    return this.http.post<{ data: { payment: any; chargeRequest: FawryChargeRequest } }>(`${this.api}/checkout`, form);
  }

  release(paymentId: string): Observable<any> {
    return this.http.post(`${this.api}/${paymentId}/release`, {});
  }
}
