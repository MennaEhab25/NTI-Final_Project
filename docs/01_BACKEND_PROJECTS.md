# Backend — Projects

## project.model.js
يمثل المشروع في MongoDB. أهم الحقول: `clientId`, `title`, `description`, `category`, `requiredSkills`, `budget`, `duration`, `status`, `acceptedProposalId`, `proposalsCount`.

## project.service.js
فيه منطق الشغل الحقيقي:
- `createProject`: ينشئ مشروع.
- `getProjects`: بحث وفلاتر بسيطة.
- `getProjectById`: تفاصيل مشروع.
- `getMyProjects`: مشاريع العميل الحالي.
- `updateProject`: يمنع تعديل مشروع ليس ملك المستخدم أو بدأ بالفعل.
- `deleteProject`: يمنع الحذف بعد وجود proposals.

## project.controller.js
يستقبل Request ويرجع Response. مؤقتًا يقرأ المستخدم من `x-user-id` إلى أن Person 1 يربط الـAuth، وبعدها يصبح `req.user.id`.

## project.routes.js
Endpoints:
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/mine`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/proposals`
- `GET /api/projects/:id/proposals`
