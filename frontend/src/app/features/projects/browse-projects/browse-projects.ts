import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../project';
import { Project } from '../../../core/models/project.model';

@Component({ selector: 'app-browse-projects', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './browse-projects.html', styleUrl: './browse-projects.css' })
export class BrowseProjects implements OnInit {
  projects: Project[] = [];
  search = '';
  category = '';
  loading = false;
  constructor(private projectService: ProjectService) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading = true;
    this.projectService.getAll({ search: this.search, category: this.category }).subscribe({
      next: (res) => { this.projects = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
