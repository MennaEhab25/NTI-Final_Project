import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({ selector:'app-freelancer-directory', standalone:true, imports:[CommonModule,FormsModule], templateUrl:'./freelancer-directory.html', styleUrl:'./freelancer-directory.css' })
export class FreelancerDirectory { search=''; freelancers:any[]=[]; message=''; constructor(private http:HttpClient){} load(){let params=new HttpParams();if(this.search)params=params.set('search',this.search);this.http.get<any>('http://localhost:3000/api/freelancers',{params}).subscribe({next:r=>this.freelancers=r.data||r,error:()=>this.message='Freelancer API belongs to Person 1 and will work after integration.'});} }
