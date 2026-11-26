const express = require("express");
const router = express.Router();
const { auth, relasedTo } = require("../middlewares/auth");
const { createAdminAccount, listAdmins } = require("../controllers/admin");

router.use(auth, relasedTo("Admin"));
router.post("/create-admin", createAdminAccount);
router.get("/admins", listAdmins);

module.exports = router;
