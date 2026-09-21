import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProposalService } from '../proposal';
import { Proposal } from '../../../core/models/proposal.model';

@Component({ selector:'app-proposal-comparison', standalone:true, imports:[CommonModule,FormsModule], templateUrl:'./proposal-comparison.html', styleUrl:'./proposal-comparison.css' })
export class ProposalComparison implements OnInit { userId=''; proposals:Proposal[]=[]; projectId=''; constructor(private route:ActivatedRoute,private service:ProposalService){} ngOnInit(){this.projectId=this.route.snapshot.paramMap.get('projectId')||'';this.load();} load(){if(this.projectId)this.service.getForProject(this.projectId).subscribe(r=>this.proposals=r.data);} action(id:string,type:'shortlist'|'accept'|'reject'){if(!this.userId)return;this.service[type](this.userId,id).subscribe(()=>this.load());} }
