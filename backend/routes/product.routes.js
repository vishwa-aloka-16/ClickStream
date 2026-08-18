const express = require("express");
const productController = require("../controllers/product.controller");
const upload = require("../config/upload");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);
router.post("/", upload.single("image"), productController.addProduct);

module.exports = router;
