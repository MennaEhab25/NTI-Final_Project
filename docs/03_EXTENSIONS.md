# Extension Requests

الـextension جزء Person 2 في التقسيمة الجديدة.

Flow:
1. Freelancer على Contract حالته `ACTIVE` يطلب عدد أيام إضافية وسبب.
2. النظام يحسب `proposedDeadline` من الـdeadline القديم.
3. Client يعمل approve أو reject.
4. لو Approved، يتم تحديث `contract.deadline`.

Endpoints:
- `POST /api/contracts/:id/extensions`
- `POST /api/extensions/:id/approve`
- `POST /api/extensions/:id/reject`
