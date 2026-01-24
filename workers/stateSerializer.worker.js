// State Serialization Worker - Offloads large state serialization to prevent UI blocking
// Use for state saves > 1MB

/**
 * Handle messages from main thread
 */
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    try {
        switch (type) {
            case 'serialize':
                // Serialize state to JSON string
                const serialized = JSON.stringify(data.state);
                self.postMessage({
                    type: 'serialized',
                    data: serialized,
                    requestId: data.requestId
                });
                break;
                
            case 'parse':
                // Parse JSON string to object
                const parsed = JSON.parse(data.jsonString);
                self.postMessage({
                    type: 'parsed',
                    data: parsed,
                    requestId: data.requestId
                });
                break;
                
            case 'compress':
                // Compress using simple string compression (optional)
                // For now, just serialize - can add compression later if needed
                const compressed = JSON.stringify(data.state);
                self.postMessage({
                    type: 'compressed',
                    data: compressed,
                    requestId: data.requestId
                });
                break;
                
            default:
                self.postMessage({
                    type: 'error',
                    error: `Unknown message type: ${type}`,
                    requestId: data?.requestId
                });
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message,
            requestId: data?.requestId
        });
    }
};
