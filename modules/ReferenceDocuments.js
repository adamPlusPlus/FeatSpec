// Reference Documents - Loads and manages reference documents
class ReferenceDocuments {
    constructor() {
        this.documents = new Map(); // Cache: docName -> content
        this.loaded = false;
        this.loading = false;
        
        // Path options to try (in order of preference)
        // Load from local reference directory
        this.pathOptions = [
            'reference/',
            './reference/',
            '../feat-spec/reference/',
            '/feat-spec/reference/'
        ];
        
        // Consolidated reference document contains all parts
        this.documentPaths = {
            'feature-spec-reference': 'feature-spec-reference.md',
            'pipeline-template': 'master-pipeline-template.md'
        };
        
        this.documentNames = {
            'feature-spec-reference': 'Feature Specification Reference (Complete)',
            'pipeline-template': 'Master Pipeline Template'
        };
        
        // Map old document keys to parts of consolidated document for backward compatibility
        this.documentPartMap = {
            'master-terminology': { doc: 'feature-spec-reference', part: 'Part 1: Terminology' },
            'feature-taxonomy': { doc: 'feature-spec-reference', part: 'Part 2: Feature Taxonomy' },
            'dependency-mapping': { doc: 'feature-spec-reference', part: 'Part 3: Dependency Mapping' },
            'quality-metrics': { doc: 'feature-spec-reference', part: 'Part 4: Quality Metrics & Validation' },
            'validation-rules': { doc: 'feature-spec-reference', part: 'Part 4: Quality Metrics & Validation' }
        };
    }
    
    // Load all reference documents
    async loadAll() {
        if (this.loaded) {
            return this.documents;
        }
        
        if (this.loading) {
            // Wait for existing load to complete
            while (this.loading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.documents;
        }
        
        this.loading = true;
        
        try {
            const loadPromises = Object.entries(this.documentPaths).map(async ([key, relativePath]) => {
                // Try each base path option
                let lastError = null;
                for (const basePath of this.pathOptions) {
                    try {
                        const fullPath = basePath + relativePath;
                        const response = await fetch(fullPath);
                        if (response.ok) {
                            const content = await response.text();
                            return [key, content];
                        }
                    } catch (error) {
                        lastError = error;
                        continue; // Try next path
                    }
                }
                // All paths failed
                console.warn(`Failed to load ${key} from any path. Last error:`, lastError);
                return [key, null];
            });
            
            const results = await Promise.all(loadPromises);
            results.forEach(([key, content]) => {
                if (content) {
                    this.documents.set(key, content);
                }
            });
            
            this.loaded = true;
            this.loading = false;
            
            return this.documents;
        } catch (error) {
            console.error('Error loading reference documents:', error);
            this.loading = false;
            throw error;
        }
    }
    
    // Get a specific document
    async getDocument(docKey) {
        await this.loadAll();
        return this.documents.get(docKey) || null;
    }
    
    // Get document name
    getDocumentName(docKey) {
        return this.documentNames[docKey] || docKey;
    }
    
    // Get all document keys
    getAllDocumentKeys() {
        return Object.keys(this.documentPaths);
    }
    
    // Search across all documents
    async search(query) {
        await this.loadAll();
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [docKey, content] of this.documents.entries()) {
            if (!content) continue;
            
            const lines = content.split('\n');
            lines.forEach((line, lineNum) => {
                if (line.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        document: docKey,
                        documentName: this.getDocumentName(docKey),
                        line: lineNum + 1,
                        content: line.trim(),
                        context: this.getContext(lines, lineNum, 2)
                    });
                }
            });
        }
        
        return results;
    }
    
    // Get context around a line
    getContext(lines, lineNum, contextLines = 2) {
        const start = Math.max(0, lineNum - contextLines);
        const end = Math.min(lines.length, lineNum + contextLines + 1);
        return lines.slice(start, end).join('\n');
    }
    
    // Extract terminology terms (for quick copy)
    async getTerminologyTerms() {
        const content = await this.getDocument('feature-spec-reference');
        if (!content) return [];
        
        const terms = [];
        const lines = content.split('\n');
        let inTerminologySection = false;
        
        for (const line of lines) {
            // Check if we're entering/exiting terminology section
            if (line.includes('## Part 1: Terminology')) {
                inTerminologySection = true;
                continue;
            }
            if (line.startsWith('## Part 2:')) {
                inTerminologySection = false;
                break;
            }
            
            if (inTerminologySection) {
                // Match lines like "- **action1**: Primary activation..."
                const match = line.match(/^-\s+\*\*(\w+)\*\*:\s+(.+)$/);
                if (match) {
                    terms.push({
                        term: match[1],
                        definition: match[2]
                    });
                }
            }
        }
        
        return terms;
    }
    
    // Get relevant documents for a section
    // Using section name IDs (no enumeration)
    getRelevantDocuments(sectionId) {
        // Map sections to relevant documents
        // All sections now reference the consolidated feature-spec-reference.md
        const sectionDocs = {
            'research-initial': ['pipeline-template'],
            'research-extraction': ['feature-spec-reference', 'pipeline-template'],
            'research-validation': ['feature-spec-reference', 'pipeline-template'],
            'discovery-inventory': ['pipeline-template'],
            'discovery-decomposition': ['feature-spec-reference', 'pipeline-template'],
            'discovery-atomic': ['feature-spec-reference', 'pipeline-template'],
            'ux-generation': ['feature-spec-reference', 'pipeline-template'],
            'ux-validation': ['feature-spec-reference', 'pipeline-template'],
            'ux-dependencies': ['feature-spec-reference', 'pipeline-template'],
            'impl-generation': ['feature-spec-reference', 'pipeline-template'],
            'impl-validation': ['feature-spec-reference', 'pipeline-template'],
            'impl-interface': ['feature-spec-reference', 'pipeline-template'],
            'final-assembly': ['feature-spec-reference', 'pipeline-template']
        };
        
        return sectionDocs[sectionId] || ['feature-spec-reference', 'pipeline-template'];
    }
    
    // Clear cache and reload
    async reload() {
        this.documents.clear();
        this.loaded = false;
        return await this.loadAll();
    }
}

// Export singleton instance
window.ReferenceDocuments = new ReferenceDocuments();

