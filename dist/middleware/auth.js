/**
 * ACTIVIDAD 10: 5 Elementos de Seguridad y Autenticación
 * Middleware y utilidades de seguridad para la aplicación
 */
import { randomBytes, pbkdf2Sync } from "crypto";
const rateLimitStore = {};
/**
 * Middleware de Rate Limiting
 * Limita las peticiones por IP para prevenir ataques DDoS y abuso
 */
export function rateLimiter(maxRequests = 100, windowMs = 60000) {
    return (req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        if (!rateLimitStore[ip]) {
            rateLimitStore[ip] = {
                count: 1,
                resetTime: now + windowMs
            };
            return next();
        }
        const record = rateLimitStore[ip];
        // Reset si el tiempo expiró
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
            return next();
        }
        // Incrementar contador
        record.count++;
        // Verificar límite
        if (record.count > maxRequests) {
            return res.status(429).json({
                error: 'Demasiadas peticiones. Intente más tarde.',
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
        }
        // Headers informativos
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
        res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
        next();
    };
}
// ============================================
// ELEMENTO 2: Validación y Sanitización de Entradas
// ============================================
/**
 * Sanitiza strings para prevenir XSS
 */
export function sanitizeString(input) {
    if (typeof input !== 'string')
        return '';
    return input
        .replace(/[<>'"]/g, '') // Remover caracteres peligrosos
        .trim()
        .substring(0, 1000); // Limitar longitud
}
/**
 * Valida y sanitiza datos del carrito
 */
export function validateCartData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Datos inválidos' };
    }
    const { productId, qty } = data;
    // Validar productId
    if (!Number.isInteger(productId) || productId < 1 || productId > 999) {
        return { valid: false, error: 'ProductId inválido' };
    }
    // Validar quantity
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        return { valid: false, error: 'Cantidad inválida (1-100)' };
    }
    return {
        valid: true,
        sanitized: {
            productId: Math.floor(productId),
            qty: Math.floor(qty)
        }
    };
}
/**
 * Middleware de validación de inputs
 */
export function inputValidator(req, res, next) {
    // Sanitizar query params
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        });
    }
    // Validar Content-Type para POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                error: 'Content-Type debe ser application/json'
            });
        }
    }
    next();
}
// ============================================
// ELEMENTO 3: Headers de Seguridad
// ============================================
/**
 * Middleware de seguridad HTTP headers
 * Implementa headers de seguridad según OWASP
 */
export function securityHeaders(req, res, next) {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevenir MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // XSS Protection (navegadores antiguos)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Content Security Policy básico
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "img-src 'self' data:; " +
        "font-src 'self' https://cdn.jsdelivr.net;");
    // Strict Transport Security (HTTPS)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
}
// Simulación de base de datos de usuarios
const users = new Map();
/**
 * Hash de contraseña con PBKDF2 + SHA-256
 */
export function hashPassword(password, salt) {
    const useSalt = salt || randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, useSalt, 10000, 64, 'sha256').toString('hex');
    return { hash, salt: useSalt };
}
/**
 * Verificar contraseña
 */
export function verifyPassword(password, hash, salt) {
    const { hash: newHash } = hashPassword(password, salt);
    return hash === newHash;
}
/**
 * Crear usuario
 */
export function createUser(username, password, role = 'user') {
    const { hash, salt } = hashPassword(password);
    const userId = randomBytes(16).toString('hex');
    const user = {
        id: userId,
        username: sanitizeString(username),
        passwordHash: `${salt}:${hash}`,
        role,
        createdAt: new Date()
    };
    users.set(username, user);
    return user;
}
/**
 * Autenticar usuario
 */
export function authenticateUser(username, password) {
    const user = users.get(username);
    if (!user)
        return null;
    const [salt, hash] = user.passwordHash.split(':');
    if (verifyPassword(password, hash, salt)) {
        return user;
    }
    return null;
}
/**
 * Middleware de autenticación
 */
export function requireAuth(req, res, next) {
    const sess = req.session;
    if (!sess.userId) {
        return res.status(401).json({
            error: 'No autenticado. Por favor inicie sesión.'
        });
    }
    next();
}
/**
 * Middleware de autorización por rol
 */
export function requireRole(role) {
    return (req, res, next) => {
        const sess = req.session;
        if (!sess.userId || !sess.userRole) {
            return res.status(401).json({
                error: 'No autenticado'
            });
        }
        if (sess.userRole !== role && role === 'admin') {
            return res.status(403).json({
                error: 'No tiene permisos suficientes'
            });
        }
        next();
    };
}
const auditLogs = [];
/**
 * Middleware de auditoría
 */
export function auditLogger(req, res, next) {
    const startTime = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const sess = req.session;
    // Capturar respuesta
    const originalSend = res.send;
    res.send = function (data) {
        res.send = originalSend;
        const log = {
            timestamp: new Date(),
            ip,
            method: req.method,
            path: req.path,
            userId: sess?.userId,
            statusCode: res.statusCode
        };
        // Guardar log
        auditLogs.push(log);
        // Mantener solo últimos 1000 logs
        if (auditLogs.length > 1000) {
            auditLogs.shift();
        }
        // Log en consola para desarrollo
        const duration = Date.now() - startTime;
        console.log(`[${log.timestamp.toISOString()}] ` +
            `${log.method} ${log.path} - ` +
            `${log.statusCode} - ${duration}ms - ` +
            `IP: ${ip}`);
        return originalSend.call(this, data);
    };
    next();
}
/**
 * Obtener logs de auditoría
 */
export function getAuditLogs(limit = 100) {
    return auditLogs.slice(-limit);
}
/**
 * Detectar actividad sospechosa
 */
export function detectSuspiciousActivity(ip) {
    const recentLogs = auditLogs
        .filter(log => log.ip === ip)
        .filter(log => Date.now() - log.timestamp.getTime() < 60000);
    if (recentLogs.length > 50) {
        console.warn(`⚠️ ALERTA: Actividad sospechosa desde IP ${ip}`);
        return true;
    }
    return false;
}
/**
 * Generar token CSRF
 */
export function generateCSRFToken() {
    return randomBytes(32).toString('hex');
}
/**
 * Verificar token CSRF
 */
export function verifyCSRFToken(token, sessionToken) {
    return token === sessionToken;
}
export default {
    rateLimiter,
    sanitizeString,
    validateCartData,
    inputValidator,
    securityHeaders,
    hashPassword,
    verifyPassword,
    createUser,
    authenticateUser,
    requireAuth,
    requireRole,
    auditLogger,
    getAuditLogs,
    detectSuspiciousActivity,
    generateCSRFToken,
    verifyCSRFToken
};
