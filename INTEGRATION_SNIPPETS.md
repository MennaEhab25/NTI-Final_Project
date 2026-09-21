# Quick Integration Snippets

## backend/src/app.js
أضف:
```js
import { mountPerson2Routes } from './person2.routes.js';
// بعد express.json()
mountPerson2Routes(app);
```

## frontend/src/app/app.routes.ts
إما تستخدم `person2Routes` وحدها أثناء الاختبار:
```ts
import { person2Routes } from './person2.routes';
export const routes = person2Routes;
```
أو تدمج عناصرها مع Routes باقي الفريق.

## Backend dependency
```bash
npm install pdfkit
```
