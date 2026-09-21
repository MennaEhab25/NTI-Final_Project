import projectRoutes from './modules/projects/project.routes.js';
import proposalRoutes from './modules/proposals/proposal.routes.js';
import contractRoutes from './modules/contracts/contract.routes.js';
import extensionRoutes from './modules/extensions/extension.routes.js';

export function mountPerson2Routes(app) {
  app.use('/api/projects', projectRoutes);
  app.use('/api/proposals', proposalRoutes);
  app.use('/api/contracts', contractRoutes);
  app.use('/api/extensions', extensionRoutes);
}
