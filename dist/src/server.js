import express from 'express';
import 'dotenv/config';
import path from "node:path";
import fs from "node:fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { initDb } from '../db/index.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import { errorHandler } from './middleware/errorHandler.js';
const app = express();
const PORT = process.env.PORT || 3000;
// Initialize database
initDb();
// JSON body parsing middleware
app.use(express.json());
// Load OpenAPI from openapi.yaml
const openapiPath = path.join(process.cwd(), "openapi.yaml");
const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, "utf-8"));
// Serve Swagger UI and raw JSON
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
app.get("/openapi.json", (_req, res) => res.json(openapiDoc));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ ok: true });
});
// API routes
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
// Central error handler
app.use(errorHandler);
// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}
export default app;
//# sourceMappingURL=server.js.map