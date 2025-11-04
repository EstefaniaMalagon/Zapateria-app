import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import productsRouter from "./routes/products.js";
import cartRouter from "./routes/cart.js";
const app = express();
const PORT = process.env.PORT || 3000;
// Middlewares básicos
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
// Sesiones
app.use(cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET || "zapateria-secret-change-in-production",
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict'
}));
// Generar userId si no existe
app.use((req, res, next) => {
    const sess = req.session;
    if (!sess.userId) {
        sess.userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    next();
});
// Headers de seguridad básicos
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
// Archivos estáticos (frontend)
app.use(express.static("public"));
// API Routes
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
// Ruta de salud
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
    });
});
// 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path
    });
});
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
SportZone Servidor en ejecución
http://localhost:${PORT}
  `);
});
export default app;
