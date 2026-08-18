const pool = require("../config/db");
const productRepository = require("../repositories/product.repository");

const image = (photoId) => `https://unsplash.com/photos/${photoId}/download?force=true&w=900`;

const products = [
  ["Midnight Leather Tote", "Structured black leather tote with a roomy everyday interior.", 189, image("tcVH_BwHtrc")],
  ["Sandstone City Handbag", "A warm neutral handbag with clean lines and polished hardware.", 149, image("oCXVxwTFwqE")],
  ["Sienna Crossbody Bag", "Compact crossbody silhouette designed for hands-free city days.", 95, image("CtOA9wbFAdQ")],
  ["Studio Mini Purse", "Minimal mini purse with a refined strap and modern proportions.", 79, image("xzrJCS4grC4")],
  ["Ivory Crescent Bag", "Soft crescent shoulder bag in an easy-to-style ivory finish.", 119, image("lnbuoKz2GlM")],
  ["Arden Work Tote", "Spacious work tote sized for a laptop, notebook, and daily essentials.", 175, image("iUvQRvdIhsY")],
  ["Cocoa Bucket Bag", "Drawstring bucket bag with a relaxed shape and rich cocoa tone.", 135, image("ZT16YkAYueo")],
  ["Noir Evening Clutch", "Sleek evening clutch made for dinners, events, and formal looks.", 88, image("J4DnKxz_3sA")],
  ["Heritage Top-Handle Bag", "Classic top-handle design with a timeless structured profile.", 229, image("nvQemFKRBUo")],
  ["Willow Shoulder Bag", "Lightweight shoulder bag with a comfortable everyday strap.", 125, image("ZB4eQcNqVUs")],
  ["Monarch Leather Satchel", "Premium leather satchel with vintage-inspired detailing.", 245, image("ZmeFtu11Hpc")],
  ["Rosewood Chain Bag", "Elegant chain-strap handbag in a deep rosewood color.", 159, image("P779eLIuKyU")],
  ["Canvas Market Tote", "Durable canvas carryall for errands, work, and weekend markets.", 62, image("APNnyM36puU")],
  ["Pebble Mini Handbag", "Small structured handbag with a subtle pebbled texture.", 105, image("uhWdD5OMQNg")],
  ["Oatmeal Everyday Bag", "Versatile neutral handbag designed to pair with every wardrobe.", 139, image("HFE2RyC76tw")],
  ["Alpine Trail Backpack", "Practical day backpack with space for travel and outdoor essentials.", 129, image("_H0fjILH5Vw")],
  ["Metro Commuter Backpack", "Streamlined commuter backpack for laptops and daily gear.", 145, image("1Pgq9ZpIatI")],
  ["Chestnut Travel Duffle", "Weekender duffle with generous capacity and sturdy handles.", 210, image("SwWCo1k92M4")],
  ["Drift Drawstring Bag", "Casual drawstring bag with a lightweight, relaxed construction.", 58, image("HY1fq4ZtLTE")],
  ["Terra Utility Backpack", "Utility-focused backpack with organized storage for busy days.", 155, image("iFelMiWMuO4")],
  ["Vintage Leather Messenger", "Classic messenger bag with a comfortable adjustable strap.", 198, image("pSVYyO-XlJk")],
  ["Walnut Laptop Briefcase", "Polished leather briefcase built for work and business travel.", 235, image("pFLNV4gkXsc")],
  ["Ember Weekend Holdall", "A roomy holdall for short trips, gym sessions, and overnights.", 185, image("yOCIkYb1L5g")],
  ["Moss Field Backpack", "Earth-toned backpack with a rugged outdoor-inspired finish.", 118, image("XwjrPFW7xw0")],
  ["Natural Woven Tote", "Textured woven tote that brings an easy summer feel to any look.", 92, image("IFlg3kFbR0E")],
];

async function seedProducts() {
  await productRepository.createProductsTable();
  let inserted = 0;

  for (const [name, description, price, imageUrl] of products) {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, image_url)
       SELECT $1::varchar, $2::text, $3::numeric, $4::text
       WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = $1::varchar)`,
      [name, description, price, imageUrl],
    );
    inserted += result.rowCount;
  }

  const count = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  console.log(`Seeded ${inserted} bag products. Database now contains ${count.rows[0].count} products.`);
}

seedProducts()
  .catch((error) => {
    console.error("Product seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
