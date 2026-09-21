import PDFDocument from 'pdfkit';

export function sendContractPdf(res, contract) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `contract-${contract._id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.fontSize(20).text('FreelanceHub Contract', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Contract ID: ${contract._id}`);
  doc.text(`Project: ${contract.projectId?.title || contract.projectId}`);
  doc.text(`Client ID: ${contract.clientId}`);
  doc.text(`Freelancer ID: ${contract.freelancerId}`);
  doc.text(`Amount: ${contract.amount} EGP`);
  doc.text(`Platform commission: ${contract.commissionRate}% (${contract.commissionAmount} EGP)`);
  doc.text(`Freelancer amount: ${contract.freelancerAmount} EGP`);
  doc.text(`Revision limit: ${contract.revisionLimit}`);
  doc.text(`Status: ${contract.status}`);
  doc.text(`Deadline: ${new Date(contract.deadline).toLocaleDateString()}`);
  doc.moveDown();
  doc.text('This PDF is generated from the accepted proposal and contract data.');
  doc.end();
}
