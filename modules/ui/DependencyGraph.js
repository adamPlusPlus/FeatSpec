// Dependency Graph Component - Visualizes section dependencies
class DependencyGraph {
    constructor(stateManager, sectionManager) {
        this.stateManager = stateManager;
        this.sectionManager = sectionManager;
    }
    
    /**
     * Build dependency graph data structure
     * @param {Object} project - Project object
     * @returns {Object} Graph data with nodes and edges
     */
    buildGraph(project) {
        if (!project || !project.sections) {
            return { nodes: [], edges: [], circular: [] };
        }
        
        const nodes = project.sections.map(section => ({
            id: section.sectionId,
            name: section.sectionName || section.sectionId,
            status: section.status || 'not_started',
            section: section
        }));
        
        const edges = [];
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        
        // Build edges from dependencies
        project.sections.forEach(section => {
            if (section.dependencies && section.dependencies.length > 0) {
                section.dependencies.forEach(depId => {
                    if (nodeMap.has(depId)) {
                        edges.push({
                            from: depId,
                            to: section.sectionId,
                            type: 'dependency'
                        });
                    }
                });
            }
        });
        
        // Detect circular dependencies
        const circular = this._detectCircularDependencies(nodes, edges);
        
        return { nodes, edges, circular };
    }
    
    /**
     * Detect circular dependencies using DFS
     * @private
     * @param {Array} nodes - Array of node objects
     * @param {Array} edges - Array of edge objects
     * @returns {Array} Array of circular dependency chains
     */
    _detectCircularDependencies(nodes, edges) {
        const circular = [];
        const visited = new Set();
        const recStack = new Set();
        const adjList = new Map();
        
        // Build adjacency list
        nodes.forEach(node => adjList.set(node.id, []));
        edges.forEach(edge => {
            const list = adjList.get(edge.from) || [];
            list.push(edge.to);
            adjList.set(edge.from, list);
        });
        
        // DFS to detect cycles
        const dfs = (nodeId, path) => {
            visited.add(nodeId);
            recStack.add(nodeId);
            path.push(nodeId);
            
            const neighbors = adjList.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor, [...path]);
                } else if (recStack.has(neighbor)) {
                    // Found cycle
                    const cycleStart = path.indexOf(neighbor);
                    if (cycleStart !== -1) {
                        const cycle = path.slice(cycleStart).concat(neighbor);
                        circular.push(cycle);
                    }
                }
            }
            
            recStack.delete(nodeId);
        };
        
        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                dfs(node.id, []);
            }
        });
        
        return circular;
    }
    
    /**
     * Get blocking sections (dependencies not complete)
     * @param {Object} project - Project object
     * @param {string} sectionId - Section ID
     * @returns {Array} Array of blocking section IDs
     */
    getBlockingSections(project, sectionId) {
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section || !section.dependencies) {
            return [];
        }
        
        return section.dependencies.filter(depId => {
            const depSection = project.sections.find(s => s.sectionId === depId);
            return !depSection || depSection.status !== 'complete';
        });
    }
    
    /**
     * Get available sections (all dependencies complete)
     * @param {Object} project - Project object
     * @returns {Array} Array of available section IDs
     */
    getAvailableSections(project) {
        if (!project || !project.sections) {
            return [];
        }
        
        return project.sections
            .filter(section => {
                if (!section.dependencies || section.dependencies.length === 0) {
                    return true;
                }
                return section.dependencies.every(depId => {
                    const depSection = project.sections.find(s => s.sectionId === depId);
                    return depSection && depSection.status === 'complete';
                });
            })
            .map(section => section.sectionId);
    }
    
    /**
     * Render mini dependency graph (for section header)
     * @param {Object} project - Project object
     * @param {Object} section - Current section object
     * @returns {string} HTML string for mini graph
     */
    renderMiniGraph(project, section) {
        if (!section.dependencies || section.dependencies.length === 0) {
            return '<div class="dependency-mini-graph"><span class="dependency-none">No dependencies</span></div>';
        }
        
        const deps = section.dependencies.map(depId => {
            const depSection = project.sections.find(s => s.sectionId === depId);
            if (!depSection) return null;
            
            const statusClass = `status-${depSection.status || 'not_started'}`;
            const statusIcon = depSection.status === 'complete' ? '✓' : 
                             depSection.status === 'in_progress' ? '◐' : '○';
            
            return {
                id: depId,
                name: depSection.sectionName || depId,
                status: depSection.status || 'not_started',
                statusClass,
                statusIcon
            };
        }).filter(Boolean);
        
        if (deps.length === 0) {
            return '<div class="dependency-mini-graph"><span class="dependency-none">No dependencies</span></div>';
        }
        
        const depsHtml = deps.map(dep => `
            <div class="dependency-mini-item ${dep.statusClass}" 
                 data-section-id="${dep.id}"
                 title="${this._escapeHtml(dep.name)} (${dep.status})">
                <span class="dependency-mini-icon">${dep.statusIcon}</span>
                <span class="dependency-mini-name">${this._escapeHtml(dep.name)}</span>
            </div>
        `).join('');
        
        return `
            <div class="dependency-mini-graph">
                <div class="dependency-mini-label">Depends on:</div>
                <div class="dependency-mini-list">${depsHtml}</div>
            </div>
        `;
    }
    
    /**
     * Render full dependency graph (for expandable panel)
     * @param {Object} project - Project object
     * @param {string} currentSectionId - Currently selected section ID
     * @returns {string} HTML string for full graph
     */
    renderFullGraph(project, currentSectionId = null) {
        const graph = this.buildGraph(project);
        const availableSections = this.getAvailableSections(project);
        
        // Build nodes HTML
        const nodesHtml = graph.nodes.map(node => {
            const isAvailable = availableSections.includes(node.id);
            const isCurrent = node.id === currentSectionId;
            const statusClass = `status-${node.status}`;
            const statusIcon = node.status === 'complete' ? '✓' : 
                             node.status === 'in_progress' ? '◐' : 
                             node.status === 'needs_revision' ? '⚠' : '○';
            
            return `
                <div class="dependency-node ${statusClass} ${isCurrent ? 'current' : ''} ${isAvailable ? 'available' : ''}" 
                     data-section-id="${node.id}"
                     title="${this._escapeHtml(node.name)} (${node.status})">
                    <div class="dependency-node-header">
                        <span class="dependency-node-icon">${statusIcon}</span>
                        <span class="dependency-node-name">${this._escapeHtml(node.name)}</span>
                    </div>
                    ${isAvailable && node.status !== 'complete' ? '<span class="dependency-available-badge">Available</span>' : ''}
                </div>
            `;
        }).join('');
        
        // Build edges HTML (visual connections)
        const edgesHtml = graph.edges.map(edge => {
            const fromNode = graph.nodes.find(n => n.id === edge.from);
            const toNode = graph.nodes.find(n => n.id === edge.to);
            const fromComplete = fromNode && fromNode.status === 'complete';
            const toComplete = toNode && toNode.status === 'complete';
            
            return `
                <div class="dependency-edge ${fromComplete && toComplete ? 'complete' : ''}" 
                     data-from="${edge.from}" 
                     data-to="${edge.to}">
                    <div class="dependency-edge-line"></div>
                </div>
            `;
        }).join('');
        
        // Circular dependencies warning
        const circularWarning = graph.circular.length > 0 ? `
            <div class="dependency-circular-warning">
                <span class="warning-icon">⚠️</span>
                <span>Circular dependencies detected: ${graph.circular.length} cycle(s)</span>
            </div>
        ` : '';
        
        return `
            <div class="dependency-graph-container">
                ${circularWarning}
                <div class="dependency-graph-legend">
                    <div class="legend-item">
                        <span class="legend-icon status-complete">✓</span>
                        <span>Complete</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-icon status-in_progress">◐</span>
                        <span>In Progress</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-icon status-not_started">○</span>
                        <span>Not Started</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-badge available">Available</span>
                        <span>Ready to work</span>
                    </div>
                </div>
                <div class="dependency-graph-content">
                    <div class="dependency-nodes-container">${nodesHtml}</div>
                    <div class="dependency-edges-container">${edgesHtml}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Setup click handlers for dependency graph
     * @param {HTMLElement} container - Container element
     * @param {string} projectId - Project ID
     */
    setupClickHandlers(container, projectId) {
        if (!container || !this.sectionManager) return;
        
        container.querySelectorAll('.dependency-node, .dependency-mini-item').forEach(element => {
            element.addEventListener('click', (e) => {
                const sectionId = element.dataset.sectionId;
                if (sectionId && this.sectionManager) {
                    this.sectionManager.navigateToSection(projectId, sectionId);
                }
            });
            
            // Add hover effect
            element.addEventListener('mouseenter', () => {
                element.style.cursor = 'pointer';
            });
        });
    }
    
    /**
     * Escape HTML helper
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.DependencyGraph = DependencyGraph;
}
