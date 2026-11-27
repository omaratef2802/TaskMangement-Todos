const service = require("../services/organizations");

const wrap =
  (handler, status = 200) =>
  async (req, res, next) => {
    try {
      const data = await handler(req);
      res.status(status).json({ message: "success", data });
    } catch (error) {
      next(error);
    }
  };

module.exports = {
  listOrganizations: wrap((req) => service.listOrganizations(req.id)),
  createOrganization: wrap(
    (req) => service.createOrganization(req.body, req.id),
    201,
  ),
  getOrganization: wrap((req) =>
    service.getOrganization(req.params.organizationId, req.id),
  ),
  updateOrganization: wrap((req) =>
    service.updateOrganization(req.params.organizationId, req.id, req.body),
  ),
  addOrganizationMember: wrap((req) =>
    service.addOrganizationMember(
      req.params.organizationId,
      req.id,
      req.body.email,
      req.body.role,
    ),
  ),
  removeOrganizationMember: wrap((req) =>
    service.removeOrganizationMember(
      req.params.organizationId,
      req.id,
      req.params.userId,
    ),
  ),
  listWorkspaces: wrap((req) =>
    service.listWorkspaces(req.params.organizationId, req.id),
  ),
  createWorkspace: wrap(
    (req) =>
      service.createWorkspace(req.params.organizationId, req.id, req.body),
    201,
  ),
  updateWorkspace: wrap((req) =>
    service.updateWorkspace(req.params.workspaceId, req.id, req.body),
  ),
  archiveWorkspace: wrap((req) =>
    service.archiveWorkspace(req.params.workspaceId, req.id),
  ),
  listProjects: wrap((req) =>
    service.listProjects(req.params.workspaceId, req.id),
  ),
  createProject: wrap(
    (req) => service.createProject(req.params.workspaceId, req.id, req.body),
    201,
  ),
  updateProject: wrap((req) =>
    service.updateProject(req.params.projectId, req.id, req.body),
  ),
  deleteProject: wrap((req) =>
    service.deleteProject(req.params.projectId, req.id),
  ),
};
