export interface ExtensionRequest {
  _id: string;
  contractId: string;
  requestedDays: number;
  reason: string;
  oldDeadline: string;
  proposedDeadline: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
