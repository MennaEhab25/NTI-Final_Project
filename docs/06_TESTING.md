# Manual Testing

استخدم MongoDB IDs حقيقية للمستخدمين لأن الحقول ObjectId.

1. أنشئ Project كـClient باستخدام header `x-user-id`.
2. افتح Project بفريلانسر مختلف وأرسل Proposal.
3. استخدم Client ID واعمل Accept للـProposal.
4. من response خذ `contract._id`.
5. افتح `GET /api/contracts/:id`.
6. جرّب `GET /api/contracts/:id/pdf`.
7. بعد الدفع/للاختبار المؤقت جرّب Start contract.
8. استخدم Freelancer ID لعمل Extension Request.
9. استخدم Client ID لعمل Approve/Reject.

قبل التسليم النهائي اختبر التكامل مع Auth وPayment لأنهما أجزاء أعضاء آخرين.
