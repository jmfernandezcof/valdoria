#!/usr/bin/env node
/**
 * CONTACT FORM SERVER - VALDORIAHOTEL
 * Maneja solicitudes de formulario de contacto con validación y rate limiting
 * Puerto: 9086 (para proxy desde Nginx en 9085)
 */

const http = require('http');
const url = require('url');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
const PORT = 9086;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX = 5; // 5 mensajes por IP
const rateLimitMap = new Map();

// ============================================================================
// UTILITIES
// ============================================================================

function getClientIp(headers) {
  const forwarded = headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text.trim().substring(0, 1000).replace(/[<>]/g, '');
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  const timePassed = now - record.timestamp;
  if (timePassed > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.timestamp + RATE_LIMIT_WINDOW };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.timestamp + RATE_LIMIT_WINDOW };
}

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// ============================================================================
// MAIN REQUEST HANDLER
// ============================================================================

const server = http.createServer(async (req, res) => {
  const clientIp = getClientIp(req.headers);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Only accept POST to /api/contact
  if (req.method !== 'POST' || req.url !== '/api/contact') {
    sendJsonResponse(res, 404, { error: 'Not Found' });
    return;
  }

  try {
    // 1. RATE LIMITING
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      console.warn(`[${new Date().toISOString()}] ⚠️ Rate limit exceeded for IP: ${clientIp}`);
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString(),
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        error: 'Demasiadas solicitudes. Por favor, intenta más tarde.'
      }));
      return;
    }

    // 2. PARSE JSON BODY
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > 5000) {
          reject(new Error('Payload too large'));
        }
      });
      req.on('end', resolve);
      req.on('error', reject);
    });

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      sendJsonResponse(res, 400, { error: 'JSON inválido' });
      return;
    }

    // 3. VALIDATE INPUTS
    const { name, email, subject, message } = data;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      sendJsonResponse(res, 400, { error: 'Nombre inválido (2-100 caracteres)' });
      return;
    }

    if (!email || !validateEmail(email)) {
      sendJsonResponse(res, 400, { error: 'Email inválido' });
      return;
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 200) {
      sendJsonResponse(res, 400, { error: 'Asunto inválido (3-200 caracteres)' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000) {
      sendJsonResponse(res, 400, { error: 'Mensaje inválido (10-5000 caracteres)' });
      return;
    }

    // 4. SANITIZE
    const sanitized = {
      name: sanitizeInput(name),
      email: email.toLowerCase().trim(),
      subject: sanitizeInput(subject),
      message: sanitizeInput(message)
    };

    // 5. LOG (en producción, guardar en base de datos)
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ Contact form received:`, {
      ipAddress: clientIp,
      name: sanitized.name,
      email: sanitized.email,
      subject: sanitized.subject,
      messageLength: sanitized.message.length
    });

    // 6. SUCCESS RESPONSE
    sendJsonResponse(res, 200, {
      success: true,
      message: 'Mensaje recibido. Nos pondremos en contacto pronto.'
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error:`, error.message);
    sendJsonResponse(res, 500, { error: 'Error al procesar la solicitud' });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Contact server running on http://127.0.0.1:${PORT}`);
  console.log(`📧 Endpoint: POST http://127.0.0.1:${PORT}/api/contact`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
