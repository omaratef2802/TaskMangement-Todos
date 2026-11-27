const mongoose = require("mongoose");
const Organization = require("../modules/dbOrganization");
const Workspace = require("../modules/dbWorkspace");
const Project = require("../modules/dbProject");
const User = require("../modules/dbUser");
const ApiError = require("../utils/ApiError");

const validId = (id, label = "ID") => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`);
};
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const membership = (org, userId) => org.members.find((item) => String(item.userId?._id || item.userId) === String(userId));
const requireOrg = async (organizationId, userId, adminOnly = false) => {
  validId(organizationId, "organization ID");
  const org = await Organization.findById(organizationId);
  if (!org) throw new ApiError(404, "Organization not found");
  const member = membership(org, userId);
  if (!member) throw new ApiError(403, "You are not a member of this organization");
  if (adminOnly && !["owner", "admin"].includes(member.role)) throw new ApiError(403, "Organization admin permission required");
  return { org, member };
};
const requireWorkspace = async (workspaceId, userId, adminOnly = false) => {
  validId(workspaceId, "workspace ID");
  const workspace = await Workspace.findOne({ _id: workspaceId, archivedAt: null });
  if (!workspace) throw new ApiError(404, "Workspace not found");
  const access = await requireOrg(workspace.organizationId, userId, adminOnly);
  return { workspace, ...access };
};
const assertWorkspaceAccess = async (workspaceId, userId) => requireWorkspace(workspaceId, userId);

const assertProjectAccess = async (projectId, userId) => {
  validId(projectId, "project ID");
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");
  const access = await requireWorkspace(project.workspaceId, userId);
  return { project, ...access };
};

const listOrganizations = async (userId) => Organization.find({ "members.userId": userId })
  .populate("ownerId", "fname lname username image")
  .populate("members.userId", "fname lname username mail image")
  .sort({ createdAt: -1 });

const createOrganization = async (payload, userId) => {
  const name = String(payload.name || "").trim();
  if (name.length < 2 || name.length > 80) throw new ApiError(400, "Organization name must be between 2 and 80 characters");
  const baseSlug = slugify(name) || "organization";
  const slug = `${baseSlug}-${new mongoose.Types.ObjectId().toString().slice(-6)}`;
  return Organization.create({
    name,
    slug,
    description: String(payload.description || "").trim(),
    ownerId: userId,
    members: [{ userId, role: "owner" }],
  });
};

const getOrganization = async (id, userId) => {
  const { org } = await requireOrg(id, userId);
  return Organization.populate(org, { path: "members.userId ownerId", select: "fname lname username mail image" });
};

const updateOrganization = async (id, userId, payload) => {
  const { org } = await requireOrg(id, userId, true);
  const update = {};
  if (payload.name !== undefined) update.name = String(payload.name).trim();
  if (payload.description !== undefined) update.description = String(payload.description).trim();
  const updated = await Organization.findByIdAndUpdate(org._id, { $set: update }, { new: true, runValidators: true });
  return updated.populate("members.userId ownerId", "fname lname username mail image");
};

const addOrganizationMember = async (id, userId, email, role = "member") => {
  const { org } = await requireOrg(id, userId, true);
  if (!["admin", "member"].includes(role)) throw new ApiError(400, "Invalid organization role");
  const user = await User.findOne({ mail: String(email || "").trim().toLowerCase() }).select("_id fname lname mail username image");
  if (!user) throw new ApiError(404, "No registered user found with this email");
  if (org.members.some((item) => String(item.userId) === String(user._id))) throw new ApiError(409, "User is already an organization member");
  org.members.push({ userId: user._id, role });
  await org.save();
  return Organization.populate(org, { path: "members.userId ownerId", select: "fname lname username mail image" });
};

const removeOrganizationMember = async (id, userId, memberId) => {
  const { org } = await requireOrg(id, userId, true);
  validId(memberId, "member ID");
  if (String(org.ownerId) === String(memberId)) throw new ApiError(400, "The organization owner cannot be removed");
  const exists = org.members.some((item) => String(item.userId) === String(memberId));
  if (!exists) throw new ApiError(404, "Organization member not found");
  org.members = org.members.filter((item) => String(item.userId) !== String(memberId));
  await org.save();
  const Todo = require("../modules/dbTodos");
  await Todo.updateMany(
    { organizationId: org._id, assignedTo: memberId },
    { $pull: { assignedTo: memberId, assignedStatuses: { userId: memberId } } },
  );
  return org.populate("members.userId ownerId", "fname lname username mail image");
};

const listWorkspaces = async (organizationId, userId) => {
  await requireOrg(organizationId, userId);
  return Workspace.find({ organizationId, archivedAt: null }).sort({ createdAt: -1 });
};

const createWorkspace = async (organizationId, userId, payload) => {
  const { org } = await requireOrg(organizationId, userId, true);
  const name = String(payload.name || "").trim();
  const key = String(payload.key || name.replace(/[^a-z0-9]/gi, "").slice(0, 5)).toUpperCase();
  if (name.length < 2 || name.length > 80) throw new ApiError(400, "Workspace name must be between 2 and 80 characters");
  if (!/^[A-Z0-9]{2,8}$/.test(key)) throw new ApiError(400, "Workspace key must be 2–8 letters or numbers");
  return Workspace.create({ organizationId: org._id, name, key, description: String(payload.description || "").trim(), createdBy: userId });
};

const updateWorkspace = async (id, userId, payload) => {
  const { workspace } = await requireWorkspace(id, userId, true);
  const update = {};
  if (payload.name !== undefined) update.name = String(payload.name).trim();
  if (payload.description !== undefined) update.description = String(payload.description).trim();
  if (payload.key !== undefined) update.key = String(payload.key).trim().toUpperCase();
  return Workspace.findByIdAndUpdate(workspace._id, { $set: update }, { new: true, runValidators: true });
};

const archiveWorkspace = async (id, userId) => {
  const { workspace } = await requireWorkspace(id, userId, true);
  await Workspace.updateOne({ _id: workspace._id }, { $set: { archivedAt: new Date() } });
  return { archived: true };
};

const listProjects = async (workspaceId, userId) => {
  await requireWorkspace(workspaceId, userId);
  return Project.find({ workspaceId }).sort({ createdAt: -1 });
};

const createProject = async (workspaceId, userId, payload) => {
  const { workspace } = await requireWorkspace(workspaceId, userId);
  const name = String(payload.name || "").trim();
  if (name.length < 2 || name.length > 100) throw new ApiError(400, "Project name must be between 2 and 100 characters");
  const data = {
    organizationId: workspace.organizationId,
    workspaceId: workspace._id,
    name,
    description: String(payload.description || "").trim(),
    createdBy: userId,
  };
  if (payload.dueDate) {
    if (Number.isNaN(new Date(payload.dueDate).getTime())) throw new ApiError(400, "Invalid project due date");
    data.dueDate = new Date(payload.dueDate);
  }
  return Project.create(data);
};

const updateProject = async (id, userId, payload) => {
  const { project, member } = await assertProjectAccess(id, userId);
  if (!["owner", "admin"].includes(member.role) && String(project.createdBy) !== String(userId)) {
    throw new ApiError(403, "Only the project creator or organization admin can update this project");
  }
  const update = {};
  for (const field of ["name", "description", "status"]) if (payload[field] !== undefined) update[field] = payload[field];
  if (payload.dueDate !== undefined) {
    if (payload.dueDate && Number.isNaN(new Date(payload.dueDate).getTime())) throw new ApiError(400, "Invalid project due date");
    update.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }
  return Project.findByIdAndUpdate(project._id, { $set: update }, { new: true, runValidators: true });
};

const deleteProject = async (id, userId) => {
  const { project, member } = await assertProjectAccess(id, userId);
  if (!["owner", "admin"].includes(member.role) && String(project.createdBy) !== String(userId)) {
    throw new ApiError(403, "Only the project creator or organization admin can archive this project");
  }
  return Project.findByIdAndUpdate(project._id, { $set: { status: "archived" } }, { new: true });
};

module.exports = {
  listOrganizations, createOrganization, getOrganization, updateOrganization,
  addOrganizationMember, removeOrganizationMember, listWorkspaces, createWorkspace,
  updateWorkspace, archiveWorkspace, listProjects, createProject, updateProject,
  deleteProject, assertProjectAccess, assertWorkspaceAccess,
};
