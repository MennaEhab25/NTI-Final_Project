import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../project';
import { Project } from '../../../core/models/project.model';

@Component({ selector: 'app-my-projects', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './my-projects.html', styleUrl: './my-projects.css' })
export class MyProjects {
  userId = '';
  projects: Project[] = [];
  constructor(private projectService: ProjectService) {}
  load() { if (this.userId) this.projectService.getMine(this.userId).subscribe((r) => this.projects = r.data); }
}
