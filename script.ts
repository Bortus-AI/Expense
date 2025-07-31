/**
 * Bunny Edge Script for Expense Matcher Application
 * This script handles edge-side optimizations and security for the app
 */

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Security headers for the application
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
    };

    // Handle API requests with rate limiting
    if (url.pathname.startsWith('/api/')) {
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                       request.headers.get('X-Forwarded-For') || 
                       'unknown';
      
      // Simple rate limiting (in production, use KV store for persistence)
      const rateLimit = await checkRateLimit(clientIP);
      if (!rateLimit.allowed) {
        return new Response('Rate limit exceeded', { 
          status: 429,
          headers: {
            'Retry-After': '60',
            ...securityHeaders
          }
        });
      }
    }

    // Handle file uploads with size limits
    if (request.method === 'POST' && url.pathname.includes('/upload')) {
      const contentLength = request.headers.get('Content-Length');
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      
      if (contentLength && parseInt(contentLength) > maxSize) {
        return new Response('File too large', { 
          status: 413,
          headers: securityHeaders
        });
      }
    }

    // Cache static assets
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$/)) {
      const response = await fetch(request);
      
      if (response.ok) {
        const modifiedResponse = new Response(response.body, response);
        
        // Add cache headers for static assets
        modifiedResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        
        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          modifiedResponse.headers.set(key, value);
        });
        
        return modifiedResponse;
      }
    }

    // Forward request to origin and add security headers
    const response = await fetch(request);
    const modifiedResponse = new Response(response.body, response);
    
    // Add security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      modifiedResponse.headers.set(key, value);
    });

    // Add CORS headers for API endpoints
    if (url.pathname.startsWith('/api/')) {
      modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
      modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    return modifiedResponse;
  }
};

/**
 * Simple rate limiting function
 * In production, you would use Bunny's KV store for persistence
 */
async function checkRateLimit(clientIP: string): Promise<{ allowed: boolean; remaining: number }> {
  // For demo purposes, allow all requests
  // In production, implement proper rate limiting with KV store
  return {
    allowed: true,
    remaining: 100
  };
}