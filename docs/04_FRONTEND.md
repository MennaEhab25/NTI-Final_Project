# Frontend Files

## Projects
- `browse-projects`: عرض المشاريع + بحث بسيط.
- `create-edit-project`: إنشاء مشروع.
- `my-projects`: مشاريع العميل.
- `project-details`: تفاصيل المشروع.
- `project.ts`: ProjectService وكل HTTP calls.

## Proposals
- `submit-proposal`: إرسال Proposal.
- `my-proposals`: عروض الفريلانسر وسحب العرض.
- `proposal-comparison`: العميل يقارن Shortlist / Accept / Reject.
- `proposal.ts`: ProposalService.

## Contracts
- `contract-tab`: تحميل العقد، Start، Download PDF، Request Extension.
- `contract.ts`: ContractService.
- `extension.ts`: approve/reject extension.

## Freelancer Directory
الشاشة موجودة عند Person 2، لكن الداتا نفسها تعتمد على `/api/freelancers` من Person 1، لذلك لا نكرر User backend هنا.
