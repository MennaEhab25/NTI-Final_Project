import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../contract';
import { Contract } from '../../../core/models/contract.model';

@Component({ selector:'app-contract-tab', standalone:true, imports:[CommonModule,FormsModule], templateUrl:'./contract-tab.html', styleUrl:'./contract-tab.css' })
export class ContractTab { contractId=''; userId=''; contract?:Contract; requestedDays=1; reason=''; message=''; constructor(private service:ContractService){} load(){if(this.contractId)this.service.get(this.contractId).subscribe(r=>this.contract=r.data);} start(){if(this.contract)this.service.start(this.userId,this.contract._id).subscribe(()=>this.load());} download(){if(!this.contract)return;this.service.downloadPdf(this.contract._id).subscribe(blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`contract-${this.contract!._id}.pdf`;a.click();URL.revokeObjectURL(url);});} extension(){if(this.contract)this.service.requestExtension(this.userId,this.contract._id,this.requestedDays,this.reason).subscribe(()=>this.message='Extension request sent');} }
