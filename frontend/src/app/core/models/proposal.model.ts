export type ProposalStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Proposal {
  _id: string;
  projectId: string | { _id: string; title: string; budget: number; status: string };
  freelancerId: string;
  price: number;
  duration: number;
  coverLetter: string;
  status: ProposalStatus;
  createdAt?: string;
}
