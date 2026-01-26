// Automation Dashboard - Comprehensive automation status display
class AutomationDashboard {
    constructor(stateManager, eventSystem, automationSystem, cursorCLIAutomation, multiAgentAutomation) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.automationSystem = automationSystem;
        this.cursorCLIAutomation = cursorCLIAutomation;
        this.multiAgentAutomation = multiAgentAutomation;
        this.updateInterval = null;
        this.activityHistory = [];
    }
    
    /**
     * Render automation dashboard
     * @param {string} projectId - Project ID
     * @returns {string} HTML string for dashboard
     */
    render(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            return '<div class="dashboard-error">Project not found</div>';
        }
        
        const status = this.getAutomationStatus(project);
        const progress = this.calculateProgress(project);
        const activeSections = this.getActiveSections(project);
        const recentActivity = this.getRecentActivity();
        
        return `
            <div class="automation-dashboard">
                <div class="dashboard-header">
                    <div class="dashboard-actions">
                        <button class="dashboard-btn" id="dashboard-refresh" title="Refresh">🔄</button>
                        <button class="dashboard-btn" id="dashboard-export" title="Export Report">📥</button>
                    </div>
                </div>
                
                <div class="dashboard-grid">
                    <!-- Status Overview Card -->
                    <div class="dashboard-card status-card">
                        <div class="dashboard-card-header">
                            <h3>Status Overview</h3>
                        </div>
                        <div class="dashboard-card-content">
                            <div class="status-indicator status-${status.state}">
                                <span class="status-icon">${status.icon}</span>
                                <span class="status-text">${status.text}</span>
                            </div>
                            <div class="status-details">
                                <div class="status-detail-item">
                                    <span class="detail-label">Engine:</span>
                                    <span class="detail-value">${this._escapeHtml(status.engine)}</span>
                                </div>
                                ${status.currentSection ? `
                                <div class="status-detail-item">
                                    <span class="detail-label">Current Section:</span>
                                    <span class="detail-value">${this._escapeHtml(status.currentSection)}</span>
                                </div>
                                ` : ''}
                                ${status.uptime ? `
                                <div class="status-detail-item">
                                    <span class="detail-label">Uptime:</span>
                                    <span class="detail-value">${status.uptime}</span>
                                </div>
                                ` : ''}
                            </div>
                            <div class="status-actions">
                                ${status.state === 'running' ? `
                                    <button class="dashboard-action-btn pause-btn" data-action="pause">⏸️ Pause</button>
                                    <button class="dashboard-action-btn stop-btn" data-action="stop">⏹️ Stop</button>
                                ` : status.state === 'paused' ? `
                                    <button class="dashboard-action-btn resume-btn" data-action="resume">▶️ Resume</button>
                                    <button class="dashboard-action-btn stop-btn" data-action="stop">⏹️ Stop</button>
                                ` : `
                                    <button class="dashboard-action-btn start-btn" data-action="start">▶️ Start</button>
                                `}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Progress Summary Card -->
                    <div class="dashboard-card progress-card">
                        <div class="dashboard-card-header">
                            <h3>Progress Summary</h3>
                        </div>
                        <div class="dashboard-card-content">
                            <div class="progress-overview">
                                <div class="progress-percentage">${progress.percentage}%</div>
                                <div class="progress-breakdown">
                                    <div class="progress-stat">
                                        <span class="stat-label">Complete:</span>
                                        <span class="stat-value complete">${progress.complete}</span>
                                    </div>
                                    <div class="progress-stat">
                                        <span class="stat-label">In Progress:</span>
                                        <span class="stat-value in-progress">${progress.inProgress}</span>
                                    </div>
                                    <div class="progress-stat">
                                        <span class="stat-label">Pending:</span>
                                        <span class="stat-value pending">${progress.pending}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="progress-bar-mini">
                                <div class="progress-segment-mini complete" style="width: ${progress.percentage}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Active Sections Card -->
                    <div class="dashboard-card active-sections-card">
                        <div class="dashboard-card-header">
                            <h3>Active Sections</h3>
                        </div>
                        <div class="dashboard-card-content">
                            ${activeSections.length > 0 ? `
                                <div class="active-sections-list">
                                    ${activeSections.map(section => `
                                        <div class="active-section-item">
                                            <span class="section-name">${this._escapeHtml(section.name)}</span>
                                            <span class="section-status status-${section.status}">${section.statusText}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="dashboard-empty">No active sections</div>
                            `}
                        </div>
                    </div>
                    
                    <!-- File Watch Status Card -->
                    <div class="dashboard-card file-watch-card">
                        <div class="dashboard-card-header">
                            <h3>File Watch Status</h3>
                        </div>
                        <div class="dashboard-card-content">
                            ${status.fileWatch ? `
                                <div class="file-watch-info">
                                    <div class="file-watch-item">
                                        <span class="file-watch-label">Directory:</span>
                                        <span class="file-watch-value">${this._escapeHtml(status.fileWatch.directory)}</span>
                                    </div>
                                    <div class="file-watch-item">
                                        <span class="file-watch-label">Status:</span>
                                        <span class="file-watch-status status-${status.fileWatch.status}">${status.fileWatch.statusText}</span>
                                    </div>
                                    ${status.fileWatch.filesWatched ? `
                                    <div class="file-watch-item">
                                        <span class="file-watch-label">Files Watched:</span>
                                        <span class="file-watch-value">${status.fileWatch.filesWatched}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            ` : `
                                <div class="dashboard-empty">File watching not active</div>
                            `}
                        </div>
                    </div>
                    
                    ${status.engine === 'multi-agent' ? `
                    <!-- Agent Status Card (Multi-Agent Only) -->
                    <div class="dashboard-card agent-status-card">
                        <div class="dashboard-card-header">
                            <h3>Agent Status</h3>
                        </div>
                        <div class="dashboard-card-content">
                            ${this.renderAgentStatus(project)}
                        </div>
                    </div>
                    
                    <!-- Quality Metrics Card (Multi-Agent Only) -->
                    <div class="dashboard-card quality-metrics-card">
                        <div class="dashboard-card-header">
                            <h3>Quality Metrics</h3>
                        </div>
                        <div class="dashboard-card-content">
                            ${this.renderQualityMetrics(project)}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Recent Activity Card -->
                    <div class="dashboard-card activity-card">
                        <div class="dashboard-card-header">
                            <h3>Recent Activity</h3>
                            <button class="dashboard-toggle" data-target="activity-timeline">Show</button>
                        </div>
                        <div class="dashboard-card-content">
                            <div id="activity-timeline" class="activity-timeline collapsed">
                                ${this.renderActivityTimeline(recentActivity)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get automation status
     * @param {Object} project - Project object
     * @returns {Object} Status object
     */
    getAutomationStatus(project) {
        const engine = project.automationEngine || 'file-watching';
        let isRunning = false;
        let isPaused = false;
        let currentSection = null;
        let startTime = null;
        
        if (engine === 'cursor-cli' && this.cursorCLIAutomation) {
            isRunning = this.cursorCLIAutomation.isRunning;
            isPaused = this.cursorCLIAutomation.isPaused || false;
            if (isRunning && this.cursorCLIAutomation.currentProjectId === project.id) {
                currentSection = this.cursorCLIAutomation.currentSectionId;
                startTime = this.cursorCLIAutomation.startTime;
            }
        } else if (engine === 'multi-agent' && this.multiAgentAutomation) {
            isRunning = this.multiAgentAutomation.isRunning;
            isPaused = this.multiAgentAutomation.isPaused || false;
            if (isRunning && this.multiAgentAutomation.currentProjectId === project.id) {
                startTime = this.multiAgentAutomation.startTime;
            }
        } else if (this.automationSystem) {
            isRunning = this.automationSystem.isRunning;
            if (isRunning && this.automationSystem.currentProjectId === project.id) {
                currentSection = this.automationSystem.currentSectionId;
            }
        }
        
        let state = 'stopped';
        let icon = '⏹️';
        let text = 'Stopped';
        
        if (isPaused) {
            state = 'paused';
            icon = '⏸️';
            text = 'Paused';
        } else if (isRunning) {
            state = 'running';
            icon = '▶️';
            text = 'Running';
        }
        
        const uptime = startTime ? this.formatUptime(Date.now() - startTime) : null;
        
        const currentSectionName = currentSection ? 
            project.sections.find(s => s.sectionId === currentSection)?.sectionName || currentSection : null;
        
        return {
            state,
            icon,
            text,
            engine: this.formatEngineName(engine),
            currentSection: currentSectionName,
            uptime,
            fileWatch: this.getFileWatchStatus(project, engine)
        };
    }
    
    /**
     * Get file watch status
     * @private
     */
    getFileWatchStatus(project, engine) {
        if (engine !== 'file-watching' || !this.automationSystem) {
            return null;
        }
        
        const directory = project.automationDirectory;
        if (!directory) {
            return { status: 'not_configured', statusText: 'Not Configured', directory: 'N/A' };
        }
        
        const isWatching = this.automationSystem.isRunning && 
                          this.automationSystem.currentProjectId === project.id;
        
        return {
            directory,
            status: isWatching ? 'active' : 'inactive',
            statusText: isWatching ? 'Active' : 'Inactive',
            filesWatched: isWatching ? 'Multiple' : null
        };
    }
    
    /**
     * Calculate progress
     * @param {Object} project - Project object
     * @returns {Object} Progress object
     */
    calculateProgress(project) {
        if (!project || !project.sections) {
            return { percentage: 0, complete: 0, inProgress: 0, pending: 0 };
        }
        
        const total = project.sections.length;
        let complete = 0;
        let inProgress = 0;
        let pending = 0;
        
        project.sections.forEach(section => {
            if (section.status === 'complete') {
                complete++;
            } else if (section.status === 'in_progress') {
                inProgress++;
            } else {
                pending++;
            }
        });
        
        const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;
        
        return { percentage, complete, inProgress, pending, total };
    }
    
    /**
     * Get active sections
     * @param {Object} project - Project object
     * @returns {Array} Array of active section objects
     */
    getActiveSections(project) {
        if (!project || !project.sections) {
            return [];
        }
        
        return project.sections
            .filter(section => section.status === 'in_progress')
            .map(section => ({
                id: section.sectionId,
                name: section.sectionName || section.sectionId,
                status: section.status,
                statusText: 'In Progress'
            }));
    }
    
    /**
     * Render agent status (multi-agent only)
     * @private
     */
    renderAgentStatus(project) {
        if (!this.multiAgentAutomation || !this.multiAgentAutomation.isRunning) {
            return '<div class="dashboard-empty">No active agents</div>';
        }
        
        const activeAgents = this.multiAgentAutomation.activeAgents || new Map();
        if (activeAgents.size === 0) {
            return '<div class="dashboard-empty">No active agents</div>';
        }
        
        const agentsHtml = Array.from(activeAgents.entries()).map(([sectionId, agentInfo]) => {
            const section = project.sections.find(s => s.sectionId === sectionId);
            return `
                <div class="agent-status-item">
                    <span class="agent-section">${this._escapeHtml(section?.sectionName || sectionId)}</span>
                    <span class="agent-status status-active">Active</span>
                </div>
            `;
        }).join('');
        
        return `<div class="agent-status-list">${agentsHtml}</div>`;
    }
    
    /**
     * Render quality metrics (multi-agent only)
     * @private
     */
    renderQualityMetrics(project) {
        if (!this.multiAgentAutomation || !this.multiAgentAutomation.qualityScores) {
            return '<div class="dashboard-empty">No quality metrics available</div>';
        }
        
        const qualityScores = this.multiAgentAutomation.qualityScores || new Map();
        if (qualityScores.size === 0) {
            return '<div class="dashboard-empty">No quality metrics available</div>';
        }
        
        const scores = Array.from(qualityScores.values());
        const avgScore = scores.length > 0 ? 
            Math.round(scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length) : 0;
        
        return `
            <div class="quality-metrics">
                <div class="quality-average">
                    <span class="quality-label">Average Score:</span>
                    <span class="quality-value">${avgScore}/100</span>
                </div>
                <div class="quality-breakdown">
                    ${scores.slice(0, 5).map(score => `
                        <div class="quality-item">
                            <span class="quality-section">${this._escapeHtml(score.sectionName || 'Unknown')}</span>
                            <span class="quality-score">${score.score || 0}/100</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Get recent activity
     * @returns {Array} Array of activity items
     */
    getRecentActivity() {
        // Return last 10 activities
        return this.activityHistory.slice(-10).reverse();
    }
    
    /**
     * Render activity timeline
     * @private
     */
    renderActivityTimeline(activities) {
        if (activities.length === 0) {
            return '<div class="dashboard-empty">No recent activity</div>';
        }
        
        return activities.map(activity => `
            <div class="activity-item">
                <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                <span class="activity-message">${this._escapeHtml(activity.message)}</span>
            </div>
        `).join('');
    }
    
    /**
     * Add activity to history
     * @param {string} message - Activity message
     */
    addActivity(message) {
        this.activityHistory.push({
            timestamp: Date.now(),
            message
        });
        
        // Keep only last 100 activities
        if (this.activityHistory.length > 100) {
            this.activityHistory.shift();
        }
    }
    
    /**
     * Format engine name
     * @private
     */
    formatEngineName(engine) {
        const names = {
            'file-watching': 'File Watching',
            'cursor-cli': 'Cursor CLI',
            'multi-agent': 'Multi-Agent'
        };
        return names[engine] || engine;
    }
    
    /**
     * Format uptime
     * @private
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Format time
     * @private
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }
    
    /**
     * Setup dashboard event handlers
     * @param {HTMLElement} container - Dashboard container
     * @param {string} projectId - Project ID
     */
    setupHandlers(container, projectId) {
        if (!container) return;
        
        // Refresh button
        const refreshBtn = container.querySelector('#dashboard-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.updateDashboard(projectId);
            });
        }
        
        // Export button
        const exportBtn = container.querySelector('#dashboard-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReport(projectId);
            });
        }
        
        // Action buttons
        container.querySelectorAll('.dashboard-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleAction(action, projectId);
            });
        });
        
        // Toggle buttons
        container.querySelectorAll('.dashboard-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.dataset.target;
                const target = container.querySelector(`#${targetId}`);
                if (target) {
                    const isCollapsed = target.classList.contains('collapsed');
                    target.classList.toggle('collapsed');
                    btn.textContent = isCollapsed ? 'Hide' : 'Show';
                }
            });
        });
    }
    
    /**
     * Handle dashboard action
     * @private
     */
    handleAction(action, projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const engine = project.automationEngine || 'file-watching';
        
        switch (action) {
            case 'start':
                if (engine === 'cursor-cli' && this.cursorCLIAutomation) {
                    this.cursorCLIAutomation.start(projectId);
                } else if (engine === 'multi-agent' && this.multiAgentAutomation) {
                    this.multiAgentAutomation.start(projectId);
                } else if (this.automationSystem) {
                    this.automationSystem.start(projectId);
                }
                this.addActivity('Automation started');
                break;
            case 'pause':
                if (engine === 'cursor-cli' && this.cursorCLIAutomation) {
                    this.cursorCLIAutomation.pause?.();
                } else if (engine === 'multi-agent' && this.multiAgentAutomation) {
                    this.multiAgentAutomation.pause?.();
                }
                this.addActivity('Automation paused');
                break;
            case 'resume':
                if (engine === 'cursor-cli' && this.cursorCLIAutomation) {
                    this.cursorCLIAutomation.resume?.();
                } else if (engine === 'multi-agent' && this.multiAgentAutomation) {
                    this.multiAgentAutomation.resume?.();
                }
                this.addActivity('Automation resumed');
                break;
            case 'stop':
                if (engine === 'cursor-cli' && this.cursorCLIAutomation) {
                    this.cursorCLIAutomation.stop();
                } else if (engine === 'multi-agent' && this.multiAgentAutomation) {
                    this.multiAgentAutomation.stop();
                } else if (this.automationSystem) {
                    this.automationSystem.stop();
                }
                this.addActivity('Automation stopped');
                break;
        }
        
        // Update dashboard after action
        setTimeout(() => this.updateDashboard(projectId), 500);
    }
    
    /**
     * Update dashboard
     */
    updateDashboard(projectId) {
        const container = document.getElementById('automation-dashboard-container');
        if (!container) return;
        
        const html = this.render(projectId);
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(container, html, { trusted: true });
        } else {
            container.innerHTML = html;
        }
        
        this.setupHandlers(container, projectId);
    }
    
    /**
     * Export status report
     * @private
     */
    exportReport(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const status = this.getAutomationStatus(project);
        const progress = this.calculateProgress(project);
        
        const report = {
            project: {
                id: project.id,
                name: project.name,
                case: project.case
            },
            automation: {
                engine: status.engine,
                state: status.state,
                currentSection: status.currentSection,
                uptime: status.uptime
            },
            progress: {
                percentage: progress.percentage,
                complete: progress.complete,
                inProgress: progress.inProgress,
                pending: progress.pending,
                total: progress.total
            },
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `automation-status-${project.id}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Start auto-update
     */
    startAutoUpdate(projectId) {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.updateDashboard(projectId);
        }, 2000); // Update every 2 seconds
    }
    
    /**
     * Stop auto-update
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
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
    window.AutomationDashboard = AutomationDashboard;
}
