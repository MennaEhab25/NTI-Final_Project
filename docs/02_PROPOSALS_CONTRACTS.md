# Proposals + Contracts

## Proposal flow
الفريلانسر يقدم proposal فيها price + duration + coverLetter.
العميل يستطيع shortlist أو reject أو accept.

عند `accept`:
1. proposal تصبح `ACCEPTED`.
2. project تصبح `AWARDED`.
3. باقي proposals تصبح `REJECTED`.
4. Contract جديد يتعمل تلقائيًا.

## Contract money
الكود يستخدم commission ثابتة 10% مثل الـspec:
- `amount`: قيمة العرض.
- `commissionAmount`: عمولة المنصة.
- `freelancerAmount`: المبلغ الصافي للفريلانسر.

## Contract status
يبدأ `AWAITING_PAYMENT` لأن Person 4 هو المسؤول عن الدفع.
بعد نجاح الدفع، يمكن بدء العقد بـ `POST /api/contracts/:id/start` فيتحول إلى `ACTIVE`.

## PDF
`GET /api/contracts/:id/pdf` يولد PDF بسيط باستخدام `pdfkit`، لذلك يلزم `npm install pdfkit`.
