import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';
import { BrowseProjects } from './features/projects/browse-projects/browse-projects';
import { CreateEditProject } from './features/projects/create-edit-project/create-edit-project';
import { MyProjects } from './features/projects/my-projects/my-projects';
import { ProjectDetails } from './features/projects/project-details/project-details';
import { SubmitProposal } from './features/proposals/submit-proposal/submit-proposal';
import { MyProposals } from './features/proposals/my-proposals/my-proposals';
import { ProposalComparison } from './features/proposals/proposal-comparison/proposal-comparison';
import { FreelancerDirectory } from './features/freelancer-directory/freelancer-directory';
import { ContractTab } from './features/workspace/contract-tab/contract-tab';

export const person2Routes: Routes = [
  { path: '', component: Landing },
  { path: 'projects', component: BrowseProjects },
  { path: 'projects/create', component: CreateEditProject },
  { path: 'projects/mine', component: MyProjects },
  { path: 'projects/:id', component: ProjectDetails },
  { path: 'projects/:projectId/proposal', component: SubmitProposal },
  { path: 'projects/:projectId/proposals', component: ProposalComparison },
  { path: 'proposals/mine', component: MyProposals },
  { path: 'freelancers', component: FreelancerDirectory },
  { path: 'contracts', component: ContractTab },
];
