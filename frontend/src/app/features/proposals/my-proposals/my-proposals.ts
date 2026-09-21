import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProposalService } from '../proposal';
import { Proposal } from '../../../core/models/proposal.model';

@Component({ selector:'app-my-proposals', standalone:true, imports:[CommonModule,FormsModule], templateUrl:'./my-proposals.html', styleUrl:'./my-proposals.css' })
export class MyProposals { userId=''; proposals:Proposal[]=[]; constructor(private service:ProposalService){} load(){if(this.userId)this.service.getMine(this.userId).subscribe(r=>this.proposals=r.data);} withdraw(id:string){this.service.withdraw(this.userId,id).subscribe(()=>this.load());} }
