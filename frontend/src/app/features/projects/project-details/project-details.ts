import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../project';
import { Project } from '../../../core/models/project.model';

@Component({ selector: 'app-project-details', standalone: true, imports: [CommonModule, RouterLink], templateUrl: './project-details.html', styleUrl: './project-details.css' })
export class ProjectDetails implements OnInit {
  project?: Project;
  constructor(private route: ActivatedRoute, private projectService: ProjectService) {}
  ngOnInit() { const id=this.route.snapshot.paramMap.get('id'); if(id) this.projectService.getById(id).subscribe(r=>this.project=r.data); }
}
