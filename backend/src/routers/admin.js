const express = require("express");
const router = express.Router();
const { auth, relasedTo } = require("../middlewares/auth");
const {
  createAdminAccount,
  setupFirstAdminAccount,
  listAdmins,
} = require("../controllers/admin");

// One-time bootstrap endpoint. It is permanently locked after the first Admin is created.
router.post("/setup", setupFirstAdminAccount);

router.use(auth, relasedTo("Admin"));
router.post("/create-admin", createAdminAccount);
router.get("/admins", listAdmins);

module.exports = router;
