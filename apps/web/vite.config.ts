import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";

// Helper to download files locally (needed for offline product images backup)
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure destination directory exists
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download image (HTTP ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function localBackupPlugin() {
  return {
    name: "local-backup-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. Save Backup API Endpoint
        if (req.url.startsWith("/api/backup/save") && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", async () => {
            try {
              const payload = JSON.parse(body);
              const { products = [], categories = [], collections = [] } = payload;
              
              const backupDir = path.resolve(__dirname, "./backup");
              const imagesDir = path.resolve(backupDir, "./images");
              
              if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
              if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

              const updatedProducts = [];
              for (const product of products) {
                const updatedProduct = { ...product };
                const productSlug = product.slug || "no-slug";
                const productImagesDir = path.resolve(imagesDir, productSlug);

                // Download main product image if it is uploaded to Supabase Storage
                if (product.image_url && product.image_url.includes("supabase.co/storage/v1/object/public/")) {
                  try {
                    const parsedUrl = new URL(product.image_url);
                    const filename = path.basename(parsedUrl.pathname);
                    const localPath = path.join(productImagesDir, filename);
                    
                    await downloadFile(product.image_url, localPath);
                    updatedProduct.image_url = `local://images/${productSlug}/${filename}`;
                  } catch (err) {
                    console.error(`[Backup-Server] Failed to download main image for product ${product.id}:`, err);
                  }
                }

                // Download gallery image arrays
                if (Array.isArray(product.images)) {
                  const updatedGallery = [];
                  for (const imgUrl of product.images) {
                    if (imgUrl && imgUrl.includes("supabase.co/storage/v1/object/public/")) {
                      try {
                        const parsedUrl = new URL(imgUrl);
                        const filename = path.basename(parsedUrl.pathname);
                        const localPath = path.join(productImagesDir, filename);
                        
                        await downloadFile(imgUrl, localPath);
                        updatedGallery.push(`local://images/${productSlug}/${filename}`);
                      } catch (err) {
                        console.error(`[Backup-Server] Failed to download gallery image ${imgUrl}:`, err);
                        updatedGallery.push(imgUrl);
                      }
                    } else {
                      updatedGallery.push(imgUrl);
                    }
                  }
                  updatedProduct.images = updatedGallery;
                }
                
                updatedProducts.push(updatedProduct);
              }

              // Write structural details to local products_catalog.json
              const backupData = {
                products: updatedProducts,
                categories,
                collections,
                timestamp: new Date().toISOString(),
              };

              fs.writeFileSync(
                path.resolve(backupDir, "products_catalog.json"),
                JSON.stringify(backupData, null, 2),
                "utf-8"
              );

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true, message: "Local backup generated successfully!" }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
            }
          });
          return;
        }

        // 2. Load Backup API Endpoint
        if (req.url.startsWith("/api/backup/load") && req.method === "GET") {
          try {
            const backupFile = path.resolve(__dirname, "./backup/products_catalog.json");
            if (fs.existsSync(backupFile)) {
              const data = fs.readFileSync(backupFile, "utf-8");
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(data);
            } else {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: "Backup file not found. Ensure catalog has products first." }));
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }));
          }
          return;
        }

        // 3. Serve Cached Local Images
        if (req.url.startsWith("/api/backup/images/") && req.method === "GET") {
          try {
            const relativePath = req.url.substring("/api/backup/images/".length);
            const safePath = relativePath.replace(/\.\./g, ""); // Prevent path traversal attacks
            const filePath = path.resolve(__dirname, "./backup/images", safePath);

            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath).toLowerCase();
              let contentType = "application/octet-stream";
              if (ext === ".webp") contentType = "image/webp";
              else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
              else if (ext === ".png") contentType = "image/png";
              else if (ext === ".svg") contentType = "image/svg+xml";

              res.statusCode = 200;
              res.setHeader("Content-Type", contentType);
              fs.createReadStream(filePath).pipe(res);
            } else {
              res.statusCode = 404;
              res.end("Image not found");
            }
          } catch (err) {
            res.statusCode = 500;
            res.end("Internal Server Error");
          }
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), localBackupPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
