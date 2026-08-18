const fs = require("fs/promises");
const productService = require("../services/product.service");

async function getProducts(_req, res) {
  try {
    const products = await productService.getProducts();
    return res.json({ products });
  } catch (error) {
    console.error("Get products error:", error.message);
    return res.status(500).json({ message: "Could not load products." });
  }
}

async function getProduct(req, res) {
  try {
    const product = await productService.getProduct(req.params.id);
    return res.json({ product });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Could not load the product.",
    });
  }
}

async function addProduct(req, res) {
  try {
    const product = await productService.addProduct({
      ...req.body,
      imageFilename: req.file?.filename,
    });
    return res.status(201).json({ message: "Product added successfully.", product });
  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error("Add product error:", error.message);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Could not add the product.",
    });
  }
}

module.exports = { getProducts, getProduct, addProduct };
