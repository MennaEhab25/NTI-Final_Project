export type ContractStatus = 'AWAITING_PAYMENT' | 'ACTIVE' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'COMPLETED' | 'CANCELLED';

export interface Contract {
  _id: string;
  projectId: any;
  clientId: string;
  freelancerId: string;
  proposalId: any;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  freelancerAmount: number;
  revisionLimit: number;
  startDate?: string | null;
  deadline: string;
  status: ContractStatus;
  pdfUrl?: string;
}
