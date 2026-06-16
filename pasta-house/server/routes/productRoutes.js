const express = require("express");
const productController = require("../controllers/productController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", adminAuth, productController.createProduct);
router.put("/:id", adminAuth, productController.updateProduct);
router.patch("/:id", adminAuth, productController.updateProduct);
router.delete("/:id", adminAuth, productController.deleteProduct);

module.exports = router;
