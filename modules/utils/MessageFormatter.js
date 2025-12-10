// MessageFormatter - Message formatting, markdown rendering, timestamp formatting
// Pure utility functions, no dependencies

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
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

/**
 * Truncates text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength, suffix = '...') {
    if (typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Formats a timestamp to a readable time string
 * @param {number|Date} timestamp - Timestamp (milliseconds or Date object)
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Simple markdown to HTML converter (basic implementation)
 * Handles: **bold**, *italic*, `code`, ```code blocks```, # headers, - lists
 * @param {string} text - Markdown text
 * @returns {string} HTML string
 */
export function renderMarkdown(text) {
    if (typeof text !== 'string') return '';
    
    let html = escapeHtml(text);
    
    // Code blocks (```...```)
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Inline code (`...`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**text**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic (*text*)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Headers (# Header)
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Unordered lists (- item)
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

/**
 * Formats a message object for display
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 * @param {number|Date} timestamp - Message timestamp
 * @returns {object} Formatted message object
 */
export function formatMessage(role, content, timestamp) {
    return {
        role,
        content,
        timestamp: timestamp || Date.now(),
        formattedTime: formatTimestamp(timestamp),
        html: renderMarkdown(content)
    };
}

