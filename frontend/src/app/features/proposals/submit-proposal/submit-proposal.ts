import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProposalService } from '../proposal';

@Component({ selector: 'app-submit-proposal', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './submit-proposal.html', styleUrl: './submit-proposal.css' })
export class SubmitProposal {
  userId=''; message=''; form={price:0,duration:1,coverLetter:''};
  constructor(private route: ActivatedRoute, private service: ProposalService) {}
  submit(){ const projectId=this.route.snapshot.paramMap.get('projectId'); if(!projectId||!this.userId)return; this.service.submit(this.userId,projectId,this.form).subscribe({next:()=>this.message='Proposal submitted',error:e=>this.message=e.error?.message||'Error'}); }
}
