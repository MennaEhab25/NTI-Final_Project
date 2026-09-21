export type ProjectStatus = 'DRAFT' | 'OPEN' | 'AWARDED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  _id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  budget: number;
  duration: number;
  attachments: string[];
  status: ProjectStatus;
  acceptedProposalId?: string | null;
  proposalsCount: number;
  deadline?: string | null;
  createdAt?: string;
}
