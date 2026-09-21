# Integration With The Team

## من Person 1
بعد ربط Auth استبدل `x-user-id` بـ `req.user.id` في الـbackend. Freelancer Directory يستخدم `/api/freelancers` من User module.

## مع Person 4 Payment
بعد Accept Proposal، الـContract الناتج يحتوي:
- `contractId`
- `clientId`
- `freelancerId`
- `amount`

هذه هي البيانات الأساسية التي يحتاجها Payment checkout عند Person 4.

مهم: Contract يبدأ `AWAITING_PAYMENT`. في الدمج النهائي لا يتم `start` إلا بعد التأكد أن Payment لهذا العقد `HELD` أو تم اعتماد حالة الدفع المطلوبة من التيم.

## مع Person 3 Workspace
Person 3 يملك Workspace shell، وPerson 2 يملك Contract Tab. يضيف Person 3 الـContractTab داخل الـworkspace routes/tabs.
