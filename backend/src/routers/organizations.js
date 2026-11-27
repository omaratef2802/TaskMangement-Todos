const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const controller = require("../controllers/organizations");

router.use(auth);
router.get("/", controller.listOrganizations);
router.post("/", controller.createOrganization);
router.get("/:organizationId", controller.getOrganization);
router.patch("/:organizationId", controller.updateOrganization);
router.post("/:organizationId/members", controller.addOrganizationMember);
router.delete(
  "/:organizationId/members/:userId",
  controller.removeOrganizationMember,
);
router.get("/:organizationId/workspaces", controller.listWorkspaces);
router.post("/:organizationId/workspaces", controller.createWorkspace);
router.patch("/workspaces/:workspaceId", controller.updateWorkspace);
router.delete("/workspaces/:workspaceId", controller.archiveWorkspace);
router.get("/workspaces/:workspaceId/projects", controller.listProjects);
router.post("/workspaces/:workspaceId/projects", controller.createProject);
router.patch("/projects/:projectId", controller.updateProject);
router.delete("/projects/:projectId", controller.deleteProject);

module.exports = router;
