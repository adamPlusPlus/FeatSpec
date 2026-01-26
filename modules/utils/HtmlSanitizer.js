// HtmlSanitizer - HTML sanitization utilities to prevent XSS attacks
// Provides safe alternatives to innerHTML for user-controlled content

/**
 * Sanitizes HTML content by removing dangerous elements and attributes
 * Uses a whitelist-based approach for security
 * @param {string} html - HTML string to sanitize
 * @param {object} options - Sanitization options
 * @param {boolean} options.allowMarkdown - Allow markdown-style HTML (default: false)
 * @param {boolean} options.trusted - Content is from trusted source (default: false)
 * @returns {string} Sanitized HTML string
 */
function sanitizeHtml(html, options = {}) {
    if (typeof html !== 'string') return '';
    if (options.trusted) {
        return html; // Skip sanitization for trusted content
    }
    
    // Create a temporary container
    const temp = document.createElement('div');
    temp.textContent = html; // This escapes all HTML
    
    // For markdown content, we need to allow some HTML tags
    if (options.allowMarkdown) {
        // Use DOMPurify-like approach: whitelist safe tags
        const allowedTags = ['p', 'br', 'strong', 'em', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'];
        const allowedAttributes = ['class', 'style'];
        
        // Parse HTML and filter
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Recursively sanitize nodes
        const sanitizeNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                
                // Remove disallowed tags
                if (!allowedTags.includes(tagName)) {
                    return Array.from(node.childNodes).map(sanitizeNode).join('');
                }
                
                // Create new element with only allowed attributes
                const newElement = document.createElement(tagName);
                for (const attr of allowedAttributes) {
                    if (node.hasAttribute(attr)) {
                        newElement.setAttribute(attr, node.getAttribute(attr));
                    }
                }
                
                // Recursively sanitize children
                Array.from(node.childNodes).forEach(child => {
                    const sanitized = sanitizeNode(child);
                    if (typeof sanitized === 'string') {
                        newElement.appendChild(document.createTextNode(sanitized));
                    } else if (sanitized instanceof Node) {
                        newElement.appendChild(sanitized);
                    }
                });
                
                return newElement.outerHTML;
            }
            
            return '';
        };
        
        // Sanitize all nodes in body
        const body = doc.body;
        if (body) {
            return Array.from(body.childNodes).map(sanitizeNode).join('');
        }
    }
    
    // Default: return escaped HTML (safest)
    return temp.innerHTML;
}

/**
 * Safely sets innerHTML after sanitization
 * @param {HTMLElement} element - DOM element to update
 * @param {string} html - HTML content to set
 * @param {object} options - Sanitization options (passed to sanitizeHtml)
 */
function safeSetInnerHTML(element, html, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
        console.warn('safeSetInnerHTML: Invalid element provided');
        return;
    }
    
    const sanitized = sanitizeHtml(html, options);
    element.innerHTML = sanitized;
}

/**
 * Creates a DOM element with sanitized content
 * @param {string} tag - HTML tag name
 * @param {string|HTMLElement} content - Content (string will be sanitized, element will be appended)
 * @param {object} attributes - HTML attributes to set
 * @param {object} options - Sanitization options
 * @returns {HTMLElement} Created element
 */
function createSafeElement(tag, content, attributes = {}, options = {}) {
    const element = document.createElement(tag);
    
    // Set attributes (sanitize attribute values)
    for (const [key, value] of Object.entries(attributes)) {
        if (typeof value === 'string') {
            // Escape attribute values to prevent XSS
            const escaped = value
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            element.setAttribute(key, escaped);
        } else {
            element.setAttribute(key, value);
        }
    }
    
    // Set content
    if (typeof content === 'string') {
        safeSetInnerHTML(element, content, options);
    } else if (content instanceof HTMLElement) {
        element.appendChild(content);
    } else if (content instanceof Node) {
        element.appendChild(content);
    }
    
    return element;
}

/**
 * Sanitizes markdown content after it's been converted to HTML
 * This should be called after markdown processing, not before
 * @param {string} markdownHtml - HTML generated from markdown
 * @returns {string} Sanitized HTML
 */
function sanitizeMarkdown(markdownHtml) {
    return sanitizeHtml(markdownHtml, { allowMarkdown: true });
}

/**
 * Escapes HTML special characters (alternative to escapeHtml in MessageFormatter)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.HtmlSanitizer = {
        sanitizeHtml,
        safeSetInnerHTML,
        createSafeElement,
        sanitizeMarkdown,
        escapeHtml
    };
    
    // Also expose as individual functions for convenience
    window.sanitizeHtml = sanitizeHtml;
    window.safeSetInnerHTML = safeSetInnerHTML;
    window.createSafeElement = createSafeElement;
    window.sanitizeMarkdown = sanitizeMarkdown;
}

// Export for ES modules (if imported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHtml,
        safeSetInnerHTML,
        createSafeElement,
        sanitizeMarkdown,
        escapeHtml
    };
}
