# Person 2 — Start Here

هذا الجزء هو شغل **Person 2 بعد دمج الستة أشخاص إلى أربعة**.

## المسؤوليات
- Landing page.
- Projects: browse, details, create/edit, my projects.
- Freelancer Directory UI (يعتمد على `/api/freelancers` من Person 1).
- Proposals: submit, my proposals, comparison, shortlist/accept/reject/withdraw.
- Contracts: create automatically after accepting a proposal, details, start, PDF.
- Extension requests: freelancer requests, client approves/rejects.

## أهم Flow
`Client creates project -> Freelancer submits proposal -> Client accepts proposal -> Contract is created -> Payment from Person 4 -> Contract starts -> Extension if needed`

الكود متعمد يكون مباشر وبسيط: `route -> controller -> service -> model`.
