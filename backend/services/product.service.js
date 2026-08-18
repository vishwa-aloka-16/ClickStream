const productRepository = require("../repositories/product.repository");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function addProduct({ name, description, category, price, imageFilename }) {
  const cleanName = String(name || "").trim();
  const cleanDescription = String(description || "").trim();
  const cleanCategory = String(category || "Bags").trim() || "Bags";
  const numericPrice = Number(price);

  if (!cleanName || price === undefined || price === "") {
    throw createServiceError("Product name and price are required.", 400);
  }
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    throw createServiceError("Price must be a valid positive number.", 400);
  }
  if (!imageFilename) {
    throw createServiceError("A product image is required.", 400);
  }

  return productRepository.createProduct({
    name: cleanName,
    description: cleanDescription,
    category: cleanCategory,
    price: numericPrice,
    imageUrl: `/uploads/${imageFilename}`,
  });
}

async function getProducts() {
  return productRepository.findAllProducts();
}

async function getProduct(id) {
  const product = await productRepository.findProductById(id);
  if (!product) throw createServiceError("Product not found.", 404);
  return product;
}

module.exports = { addProduct, getProducts, getProduct };
