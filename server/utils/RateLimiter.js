// Rate Limiter - Prevents API abuse by limiting requests per IP
class RateLimiter {
    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map(); // IP -> { count, resetTime }
    }
    
    /**
     * Middleware function to check rate limits
     * @param {object} req - HTTP request object
     * @param {object} res - HTTP response object
     * @param {function} next - Next middleware function
     */
    middleware(req, res, next) {
        // Extract IP address (handle proxies)
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                   (req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    'unknown');
        
        const now = Date.now();
        const record = this.requests.get(ip);
        
        // No record or window expired - create new record
        if (!record || now > record.resetTime) {
            this.requests.set(ip, { count: 1, resetTime: now + this.windowMs });
            return next();
        }
        
        // Rate limit exceeded
        if (record.count >= this.maxRequests) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            res.writeHead(429, { 
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString()
            });
            res.end(JSON.stringify({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                retryAfter: retryAfter
            }));
            return;
        }
        
        // Increment count and continue
        record.count++;
        next();
    }
    
    /**
     * Clean up expired rate limit records
     * Should be called periodically to prevent memory leaks
     */
    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.requests.entries()) {
            if (now > record.resetTime) {
                this.requests.delete(ip);
            }
        }
    }
    
    /**
     * Reset rate limit for a specific IP (useful for testing)
     * @param {string} ip - IP address to reset
     */
    reset(ip) {
        this.requests.delete(ip);
    }
    
    /**
     * Get current rate limit status for an IP
     * @param {string} ip - IP address to check
     * @returns {object|null} Current rate limit status or null if no record
     */
    getStatus(ip) {
        const record = this.requests.get(ip);
        if (!record) return null;
        
        const now = Date.now();
        if (now > record.resetTime) {
            this.requests.delete(ip);
            return null;
        }
        
        return {
            count: record.count,
            limit: this.maxRequests,
            resetTime: record.resetTime,
            remaining: Math.max(0, this.maxRequests - record.count),
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
        };
    }
}

module.exports = RateLimiter;
