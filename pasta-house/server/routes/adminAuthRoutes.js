const express = require("express");
const adminAuthController = require("../controllers/adminAuthController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.post("/login", adminAuthController.login);
router.post("/auth/login", adminAuthController.login);
router.get("/me", adminAuth, adminAuthController.me);

module.exports = router;
