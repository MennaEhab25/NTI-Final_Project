import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project';

@Component({ selector: 'app-create-edit-project', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './create-edit-project.html', styleUrl: './create-edit-project.css' })
export class CreateEditProject {
  userId = '';
  message = '';
  form = { title: '', description: '', category: '', budget: 0, duration: 1, requiredSkills: [] as string[] };
  constructor(private projectService: ProjectService) {}
  submit() {
    if (!this.userId) { this.message = 'Enter user id for the current demo'; return; }
    this.projectService.create(this.userId, this.form).subscribe({ next: () => this.message = 'Project created', error: (e) => this.message = e.error?.message || 'Could not create project' });
  }
}
