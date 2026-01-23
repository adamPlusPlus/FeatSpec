// Multi-Agent Automation System - Executes pipeline steps in parallel with quality gates, synthesis, and multi-agent discussion
class MultiAgentAutomationSystem {
    constructor(eventSystem, stateManager, renderingEngine, errorHandler = null) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.renderingEngine = renderingEngine;
        this.errorHandler = errorHandler;
        this.isRunning = false;
        this.currentProjectId = null;
        this.shouldStop = false;
        this.progressModal = null;
        this.progressText = null;
        this.progressLog = null;
        
        // Multi-agent specific state
        this.activeAgents = new Map(); // Map of sectionId -> agent info
        this.agentDiscussions = new Map(); // Map of discussionId -> discussion history
        this.qualityScores = new Map(); // Map of sectionId -> quality score object
        this.parallelExecutionQueue = []; // Queue of steps ready for parallel execution
        this.synthesisQueue = []; // Queue of parallel results awaiting synthesis
        this.executionHistory = []; // Array of execution events for visualization
        this.ragSteps = []; // Array of RAG/context building steps
        this.currentIteration = 0; // Current iteration number
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for automation stop events
        this.eventSystem.register(EventType.AUTOMATION_STOP, () => {
            this.stop();
        });
    }
    
    // Start automation for a project - main entry point
    async start(projectId, initialInput = null) {
        if (this.isRunning) {
            console.warn('Multi-agent automation already running');
            return;
        }
        
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            console.error('Project not found:', projectId);
            return;
        }
        
        // Validate project uses multi-agent engine
        if (project.automationEngine !== 'multi-agent') {
            alert('This project is not configured for multi-agent automation');
            return;
        }
        
        // Get scope directory from project (per-project, not global)
        const scopeDir = project.scopeDirectory || this.stateManager.getScopeDirectory();
        if (!scopeDir || !scopeDir.trim()) {
            alert('Please set the scope directory in the Pipeline Flow view for multi-agent mode');
            return;
        }
        
        // Validate dependencies before starting
        const validationResult = this.validateDependencies(project);
        if (!validationResult.valid) {
            alert(`Cannot start automation: ${validationResult.message}\n\nMissing dependencies:\n${validationResult.missingDeps.join('\n')}`);
            return;
        }
        
        this.currentProjectId = projectId;
        this.isRunning = true;
        this.shouldStop = false;
        
        // Clear previous state
        this.activeAgents.clear();
        this.agentDiscussions.clear();
        this.qualityScores.clear();
        this.parallelExecutionQueue = [];
        this.synthesisQueue = [];
        this.executionHistory = [];
        this.ragSteps = [];
        this.currentIteration = 0;
        
        // Show progress modal
        this.showProgressModal();
        this.updateProgress('Initializing multi-agent automation...', '');
        this.updateUI();
        
        try {
            // Initialize first step if initialInput provided
            if (initialInput) {
                await this.initializeFirstStep(projectId, initialInput);
            }
            
            // Execute with multi-agent system
            await this.executeWithAgents(projectId);
            
            if (!this.shouldStop) {
                this.updateProgress('All steps completed successfully!', '');
                this.appendToLog('Multi-agent automation completed');
                // Auto-close after 2 seconds
                setTimeout(() => {
                    this.hideProgressModal();
                }, AppConstants.TIMEOUTS.MODAL_AUTO_CLOSE);
            }
        } catch (error) {
            console.error('Error in multi-agent automation:', error);
            this.updateProgress(`Fatal error: ${error.message}`, '');
            alert(`Fatal error: ${error.message}`);
        } finally {
            this.isRunning = false;
            this.currentProjectId = null;
        }
    }
    
    // Initialize first incomplete step with initialInput
    async initializeFirstStep(projectId, initialInput) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        // Find first incomplete section
        const firstIncomplete = project.sections.find(s => 
            s.status !== 'complete' && s.status !== 'skipped'
        );
        
        if (firstIncomplete && (!firstIncomplete.input || !firstIncomplete.input.trim())) {
            // Set input if empty
            this.stateManager.updateSection(projectId, firstIncomplete.sectionId, {
                input: initialInput
            });
            this.appendToLog(`Initialized first step "${firstIncomplete.sectionName || firstIncomplete.sectionId}" with initial input`);
        }
    }
    
    /**
     * Check for deadlock condition (no ready steps but incomplete steps remain)
     * @private
     * @returns {Object} Deadlock status with isDeadlock flag and message
     */
    _checkForDeadlock(project, readySteps) {
        if (readySteps.length > 0) {
            return { isDeadlock: false };
        }
        
        // Check if all steps are complete
        const incompleteSteps = project.sections.filter(s => 
            s.status !== 'complete' && s.status !== 'skipped'
        );
        
        if (incompleteSteps.length === 0) {
            // All done!
            return { isDeadlock: false, allComplete: true };
        }
        
        // Deadlock: steps have unmet dependencies
        const stuckSteps = incompleteSteps.map(s => s.sectionName || s.sectionId).join(', ');
        return {
            isDeadlock: true,
            message: `Deadlock detected: Steps cannot proceed due to unmet dependencies: ${stuckSteps}`
        };
    }
    
    /**
     * Execute a single iteration of the multi-agent system
     * @private
     * @returns {Object} Iteration result with continue flag and updated project
     */
    async _executeIteration(projectId, project, iterationCount) {
        // Get all ready steps (dependencies met)
        const readySteps = this.getReadySteps(project);
        
        // Log iteration start
        this.addExecutionEvent('iteration_start', {
            iteration: iterationCount,
            readySteps: readySteps.map(s => s.sectionName || s.sectionId)
        });
        this.updateUI();
        
        // Check for deadlock
        const deadlockCheck = this._checkForDeadlock(project, readySteps);
        if (deadlockCheck.allComplete) {
            return { continue: false, project };
        }
        if (deadlockCheck.isDeadlock) {
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(deadlockCheck.message, {
                    source: 'MultiAgentAutomationSystem',
                    operation: '_executeIteration',
                    projectId
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Deadlock Detected'
                });
            }
            throw new Error(deadlockCheck.message);
        }
        
        // Execute ready steps in parallel
        this.updateProgress(
            `Executing ${readySteps.length} step(s) in parallel (iteration ${iterationCount})...`,
            ''
        );
        
        this.addExecutionEvent('parallel_start', {
            iteration: iterationCount,
            steps: readySteps.map(s => s.sectionName || s.sectionId)
        });
        this.updateUI();
        
        const parallelResults = await this.executeReadyStepsInParallel(projectId, readySteps);
        
        this.addExecutionEvent('parallel_complete', {
            iteration: iterationCount,
            results: parallelResults.map(r => ({
                step: r.section.sectionName || r.section.sectionId,
                success: r.success
            }))
        });
        this.updateUI();
        
        // Score outputs for quality
        for (const result of parallelResults) {
            if (result.success) {
                const qualityScore = await this.scoreOutput(result.output, result.section);
                this.qualityScores.set(result.section.sectionId, qualityScore);
                this.appendToLog(
                    `Quality score for "${result.section.sectionName || result.section.sectionId}": ${(qualityScore.score * 100).toFixed(1)}%`
                );
            }
        }
        
        // Synthesize outputs from parallel execution
        this.addExecutionEvent('synthesis_start', { iteration: iterationCount });
        this.updateUI();
        
        const synthesis = await this.synthesizeOutputs(projectId, parallelResults);
        
        if (synthesis) {
            this.appendToLog('Synthesis completed');
            this.addExecutionEvent('synthesis_complete', {
                iteration: iterationCount,
                conflicts: synthesis.conflicts?.length || 0,
                improvements: synthesis.improvements?.length || 0
            });
            
            // Refine outputs based on synthesis feedback
            await this.refineOutputsBasedOnSynthesis(projectId, parallelResults, synthesis);
        }
        
        this.updateUI();
        
        // Update project reference (may have changed)
        const updatedProject = this.stateManager.getProject(projectId);
        if (!updatedProject) {
            return { continue: false, project };
        }
        
        return { continue: true, project: updatedProject };
    }
    
    // Main execution loop with multi-agent system
    async executeWithAgents(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        let iterationCount = 0;
        const maxIterations = 50; // Safety limit
        let currentProject = project;
        
        while (iterationCount < maxIterations && !this.shouldStop) {
            iterationCount++;
            this.currentIteration = iterationCount;
            
            const result = await this._executeIteration(projectId, currentProject, iterationCount);
            if (!result.continue) {
                break; // All done or project deleted
            }
            currentProject = result.project;
        }
        
        if (iterationCount >= maxIterations) {
            throw new Error('Maximum iterations reached. Automation stopped to prevent infinite loop.');
        }
    }
    
    // Get steps that are ready to execute (all dependencies met)
    getReadySteps(project) {
        const sections = project.sections.filter(s => 
            s.status !== 'complete' && s.status !== 'skipped'
        );
        
        const readySteps = [];
        
        for (const section of sections) {
            // Check if all dependencies are complete
            let allDepsMet = true;
            
            if (section.dependencies && section.dependencies.length > 0) {
                for (const depId of section.dependencies) {
                    const depSection = project.sections.find(s => s.sectionId === depId);
                    if (!depSection || depSection.status !== 'complete') {
                        allDepsMet = false;
                        break;
                    }
                }
            }
            
            if (allDepsMet) {
                readySteps.push(section);
            }
        }
        
        return readySteps;
    }
    
    // Execute multiple steps in parallel
    async executeReadyStepsInParallel(projectId, steps) {
        const promises = steps.map(step => 
            this.executeStepWithAgent(projectId, step).catch(error => ({
                success: false,
                section: step,
                error: error.message,
                output: null
            }))
        );
        
        const results = await Promise.all(promises);
        
        // Log results
        for (const result of results) {
            if (result.success) {
                this.appendToLog(`✓ Completed ${result.section.sectionName || result.section.sectionId}`);
            } else {
                this.appendToLog(`✗ Error in ${result.section.sectionName || result.section.sectionId}: ${result.error}`);
            }
        }
        
        return results;
    }
    
    // Execute a single step with agent (with auto-retry on low quality)
    async executeStepWithAgent(projectId, section, retryCount = 0, refinementPromptOverride = null) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        // Mark agent as active
        this.activeAgents.set(section.sectionId, {
            role: 'executor',
            startTime: Date.now(),
            retryCount: retryCount
        });
        
        try {
            // Use refinement prompt if provided (from retry), otherwise build fresh
            let fullPrompt;
            if (refinementPromptOverride) {
                fullPrompt = refinementPromptOverride;
            } else {
            // Build enhanced prompt with context (RAG step)
            this.addRAGStep({
                step: section.sectionName || section.sectionId,
                type: 'context_building',
                timestamp: Date.now()
            });
            this.updateUI();
            
            const context = await this.buildContextForStep(projectId, section);
            const enhancedPrompt = await this.buildEnhancedPrompt(projectId, section, context);
            
            this.addRAGStep({
                step: section.sectionName || section.sectionId,
                type: 'prompt_enhancement',
                contextSources: Object.keys(context).filter(k => context[k] && (Array.isArray(context[k]) ? context[k].length > 0 : true)),
                timestamp: Date.now()
            });
            this.updateUI();
                
                // Get input
                const input = await this.getSectionInput(projectId, section);
                
                // Combine prompt + input
                // Note: Input field contains NEW input for this step
                // Previous outputs (cAtoms, ccompounds, cElements) are available in conversation history
                if (input && input.trim()) {
                    fullPrompt = `${enhancedPrompt}\n\n## Fresh Input for This Step\n\n${input}\n\n**Note**: Process this fresh input in context of all previously established cAtoms, ccompounds, and cElements from previous steps (available in conversation history).`;
                } else {
                    fullPrompt = enhancedPrompt;
                }
            }
            
            // Get scope directory from project (per-project, not global)
            const project = this.stateManager.getProject(projectId);
            const scopeDir = project?.scopeDirectory || this.stateManager.getScopeDirectory();
            if (!scopeDir) {
                const error = 'Scope directory not set for this project';
                if (this.errorHandler) {
                    this.errorHandler.showUserNotification(error, {
                        source: 'MultiAgentAutomationSystem',
                        operation: 'executeStepWithAgent',
                        projectId,
                        sectionId: section.sectionId
                    }, {
                        severity: ErrorHandler.Severity.ERROR,
                        title: 'Scope Directory Required'
                    });
                }
                throw new Error(error);
            }
            
            // Execute cursor-cli
            const output = await this.executeCursorCLI(fullPrompt, scopeDir);
            
            // Score output quality (RAG step - quality evaluation)
            this.addRAGStep({
                step: section.sectionName || section.sectionId,
                type: 'quality_evaluation',
                timestamp: Date.now()
            });
            this.updateUI();
            
            const qualityScore = await this.scoreOutput(output, section);
            
            // Auto-retry if quality is low and retries remaining
            if (qualityScore.score < 0.8 && retryCount < 2) {
                this.appendToLog(
                    `Quality score ${(qualityScore.score * 100).toFixed(1)}% below threshold. Retrying with refinement...`
                );
                
                // Build refinement prompt (need to extract original prompt and input)
                const context = await this.buildContextForStep(projectId, section);
                const enhancedPrompt = await this.buildEnhancedPrompt(projectId, section, context);
                const input = await this.getSectionInput(projectId, section);
                
                const refinementPrompt = this.buildRefinementPrompt(
                    enhancedPrompt,
                    input,
                    output,
                    qualityScore
                );
                
                // Retry with refinement prompt
                return await this.executeStepWithAgent(projectId, section, retryCount + 1, refinementPrompt);
            }
            
            // Save output to section state
            this.stateManager.updateSection(projectId, section.sectionId, {
                output: output,
                status: 'complete'
            });
            
            // Save output to file for persistence
            await this.saveOutputToFile(projectId, section, output);
            
            // Update UI
            this.renderingEngine.renderAll();
            
            // Mark agent as inactive
            this.activeAgents.delete(section.sectionId);
            
            return {
                success: true,
                section: section,
                output: output,
                qualityScore: qualityScore
            };
            
        } catch (error) {
            // Mark agent as inactive
            this.activeAgents.delete(section.sectionId);
            throw error;
        }
    }
    
    // Score output quality (0-1 scale)
    async scoreOutput(output, section) {
        const qualityPrompt = `You are a quality evaluator. Evaluate the following output for a pipeline step.

Step: ${section.sectionName || section.sectionId}
Step Type: ${section.stepName || 'unknown'}

Expected Output: The output should be complete, accurate, relevant to the step's goals, and well-structured.

Output to Evaluate:
${output}

Provide a JSON response with:
{
  "score": <number between 0 and 1>,
  "feedback": "<brief explanation of the score>",
  "issues": ["<issue 1>", "<issue 2>", ...]
}

Score guidelines:
- 0.9-1.0: Excellent, complete, accurate, well-structured
- 0.8-0.9: Good, minor issues or missing details
- 0.7-0.8: Acceptable, some issues but usable
- 0.6-0.7: Needs improvement, significant issues
- Below 0.6: Poor quality, major problems

Respond with ONLY the JSON object, no additional text.`;

        try {
            const project = this.stateManager.getProject(projectId);
            const scopeDir = project?.scopeDirectory || this.stateManager.getScopeDirectory();
            const response = await this.executeCursorCLI(qualityPrompt, scopeDir);
            
            // Parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const qualityData = JSON.parse(jsonMatch[0]);
                return {
                    score: Math.max(0, Math.min(1, qualityData.score || 0.5)),
                    feedback: qualityData.feedback || 'No feedback provided',
                    issues: qualityData.issues || []
                };
            }
            
            // Fallback if JSON parsing fails
            return {
                score: 0.7,
                feedback: 'Could not parse quality evaluation',
                issues: ['Quality evaluation response format invalid']
            };
        } catch (error) {
            console.error('Error scoring output:', error);
            // Fallback score
            return {
                score: 0.7,
                feedback: 'Quality evaluation failed',
                issues: ['Could not evaluate quality']
            };
        }
    }
    
    // Build refinement prompt for retry
    buildRefinementPrompt(originalPrompt, input, previousOutput, qualityScore) {
        return `${originalPrompt}

## Previous Attempt

The previous attempt produced the following output, which received a quality score of ${(qualityScore.score * 100).toFixed(1)}%:

### Quality Feedback
${qualityScore.feedback}

### Issues Identified
${qualityScore.issues.map(issue => `- ${issue}`).join('\n')}

### Previous Output
${previousOutput}

## Refinement Instructions

Please refine the output to address the issues identified above. Focus on:
1. Completeness: Ensure all required elements are present
2. Accuracy: Correct any errors or inaccuracies
3. Structure: Improve organization and clarity
4. Relevance: Better align with the step's goals

Generate an improved version of the output.`;
    }
    
    // Synthesize outputs from parallel execution
    async synthesizeOutputs(projectId, parallelResults) {
        const successfulResults = parallelResults.filter(r => r.success);
        
        if (successfulResults.length === 0) {
            return null;
        }
        
        if (successfulResults.length === 1) {
            // No synthesis needed for single result
            return null;
        }
        
        const synthesisPrompt = this.buildSynthesisPrompt(parallelResults);
        
        try {
            const synthesis = await this.executeSynthesisAgent(projectId, synthesisPrompt);
            return synthesis;
        } catch (error) {
            console.error('Error in synthesis:', error);
            this.appendToLog(`Warning: Synthesis failed: ${error.message}`);
            return null;
        }
    }
    
    // Build synthesis prompt
    buildSynthesisPrompt(parallelResults) {
        const successfulResults = parallelResults.filter(r => r.success);
        
        let prompt = `You are a synthesis agent. Analyze the following parallel execution results and identify:

1. **Conflicts**: Contradictory information or approaches
2. **Gaps**: Missing information that should be present
3. **Redundancies**: Duplicate or overlapping content
4. **Improvement Opportunities**: Ways to enhance the outputs

## Parallel Execution Results

`;

        for (const result of successfulResults) {
            prompt += `### ${result.section.sectionName || result.section.sectionId}
Quality Score: ${result.qualityScore ? (result.qualityScore.score * 100).toFixed(1) + '%' : 'N/A'}

Output:
${result.output}

---

`;
        }
        
        prompt += `## Synthesis Instructions

Provide a JSON response with:
{
  "conflicts": [{"step": "<step name>", "issue": "<description>"}, ...],
  "gaps": ["<gap description 1>", ...],
  "redundancies": ["<redundancy description 1>", ...],
  "improvements": [{"step": "<step name>", "suggestion": "<improvement>"}, ...],
  "summary": "<overall synthesis summary>"
}

Respond with ONLY the JSON object, no additional text.`;

        return prompt;
    }
    
    // Execute synthesis agent
    async executeSynthesisAgent(projectId, synthesisPrompt) {
        const project = this.stateManager.getProject(projectId);
        const scopeDir = project?.scopeDirectory || this.stateManager.getScopeDirectory();
        const response = await this.executeCursorCLI(synthesisPrompt, scopeDir);
        
        // Parse JSON response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error('Error parsing synthesis JSON:', e);
            }
        }
        
        // Fallback: return basic structure
        return {
            conflicts: [],
            gaps: [],
            redundancies: [],
            improvements: [],
            summary: 'Synthesis completed but response format invalid'
        };
    }
    
    // Refine outputs based on synthesis feedback
    async refineOutputsBasedOnSynthesis(projectId, parallelResults, synthesis) {
        if (!synthesis || !synthesis.improvements || synthesis.improvements.length === 0) {
            return;
        }
        
        // Group improvements by step
        const improvementsByStep = new Map();
        for (const improvement of synthesis.improvements) {
            const stepName = improvement.step;
            if (!improvementsByStep.has(stepName)) {
                improvementsByStep.set(stepName, []);
            }
            improvementsByStep.get(stepName).push(improvement.suggestion);
        }
        
        // Refine each affected step
        for (const result of parallelResults) {
            if (!result.success) continue;
            
            const stepName = result.section.sectionName || result.section.sectionId;
            const improvements = improvementsByStep.get(stepName);
            
            if (improvements && improvements.length > 0) {
                this.appendToLog(`Refining "${stepName}" based on synthesis feedback...`);
                
                // Build refinement prompt
                const refinementPrompt = `${await this.buildEnhancedPrompt(projectId, result.section, await this.buildContextForStep(projectId, result.section))}

## Previous Output
${result.output}

## Synthesis Feedback
The synthesis agent identified the following improvements:
${improvements.map(imp => `- ${imp}`).join('\n')}

## Refinement Instructions
Please refine the output to incorporate the synthesis feedback above. Generate an improved version.`;

                try {
                    const project = this.stateManager.getProject(projectId);
                    const scopeDir = project?.scopeDirectory || this.stateManager.getScopeDirectory();
                    const refinedOutput = await this.executeCursorCLI(refinementPrompt, scopeDir);
                    
                    // Update section with refined output
                    this.stateManager.updateSection(projectId, result.section.sectionId, {
                        output: refinedOutput
                    });
                    
                    // Save refined output to file
                    await this.saveOutputToFile(projectId, result.section, refinedOutput);
                    
                    this.appendToLog(`✓ Refined "${stepName}"`);
                } catch (error) {
                    console.error(`Error refining ${stepName}:`, error);
                    this.appendToLog(`✗ Error refining "${stepName}": ${error.message}`);
                }
            }
        }
        
        // Update UI
        this.renderingEngine.renderAll();
    }
    
    // Build context for a step (aggregates previous outputs, codebase, references, discussions)
    async buildContextForStep(projectId, section) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return {};
        
        const context = {
            previousOutputs: [],
            codebaseContext: null,
            referenceDocuments: [],
            discussionHistory: []
        };
        
        // Get outputs from dependency sections
        if (section.dependencies && section.dependencies.length > 0) {
            for (const depId of section.dependencies) {
                const depSection = project.sections.find(s => s.sectionId === depId);
                if (depSection && depSection.output) {
                    context.previousOutputs.push({
                        sectionId: depId,
                        sectionName: depSection.sectionName || depId,
                        output: depSection.output
                    });
                }
            }
        }
        
        // Get codebase context from scope directory (if available)
        const scopeDir = project.scopeDirectory || this.stateManager.getScopeDirectory();
        if (scopeDir) {
            context.codebaseContext = `Scope directory: ${scopeDir}`;
        }
        
        // Get reference documents (if ReferenceDocuments module available)
        if (window.ReferenceDocuments) {
            try {
                const refDocs = window.ReferenceDocuments.getDocuments();
                context.referenceDocuments = refDocs.map(doc => ({
                    name: doc.name || 'Unknown',
                    content: doc.content || ''
                }));
            } catch (e) {
                console.warn('Could not load reference documents:', e);
            }
        }
        
        // Get discussion history for this step
        const discussionId = `discussion-${section.sectionId}`;
        if (this.agentDiscussions.has(discussionId)) {
            context.discussionHistory = this.agentDiscussions.get(discussionId);
        }
        
        return context;
    }
    
    // Build enhanced prompt with context, quality feedback, synthesis, discussions
    async buildEnhancedPrompt(projectId, section, context) {
        const project = this.stateManager.getProject(projectId);
        const promptLoader = window.PromptLoader;
        
        if (!promptLoader) {
            const error = 'PromptLoader not available';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'MultiAgentAutomationSystem',
                    operation: 'buildEnhancedPrompt',
                    projectId,
                    sectionId: section.sectionId
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'PromptLoader Not Available'
                });
            }
            throw new Error(error);
        }
        
        // Get base prompt
        const basePrompt = await promptLoader.getPrompt(
            section.sectionId,
            section,
            project,
            { substituteInput: false } // We'll add input separately
        );
        
        if (!basePrompt) {
            const error = `Could not load prompt for ${section.sectionId}`;
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'MultiAgentAutomationSystem',
                    operation: 'buildEnhancedPrompt',
                    projectId,
                    sectionId: section.sectionId
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Failed to Load Prompt'
                });
            }
            throw new Error(error);
        }
        
        let enhancedPrompt = basePrompt;
        
        // Add context summary (only if not using conversation memory)
        // If LLM has conversation memory and scope, previous outputs are available in the conversation
        // Only include them explicitly if needed for single-shot prompts or when conversation memory is disabled
        const useConversationMemory = project?.useConversationMemory !== false; // Default to true
        if (!useConversationMemory && context.previousOutputs && context.previousOutputs.length > 0) {
            enhancedPrompt += `\n\n## Context from Previous Steps\n\n`;
            enhancedPrompt += `(Note: If you have conversation memory, you can reference previous steps from the conversation history)\n\n`;
            for (const prevOutput of context.previousOutputs) {
                enhancedPrompt += `### ${prevOutput.sectionName}\n${prevOutput.output}\n\n`;
            }
        } else if (useConversationMemory && context.previousOutputs && context.previousOutputs.length > 0) {
            // Just reference them, don't paste the full content
            enhancedPrompt += `\n\n## Previous Steps Available in Conversation\n\n`;
            enhancedPrompt += `The following previous steps are available in the conversation history:\n`;
            for (const prevOutput of context.previousOutputs) {
                enhancedPrompt += `- ${prevOutput.sectionName}\n`;
            }
            enhancedPrompt += `\n**CRITICAL**: You MUST consider all previously established cAtoms, ccompounds (compound structures), and cElements from these previous steps when analyzing the current input.\n`;
            enhancedPrompt += `- Reference cAtoms, ccompounds, and cElements from previous steps\n`;
            enhancedPrompt += `- Build upon the axiomatic foundations and structures already established\n`;
            enhancedPrompt += `- Integrate previous outputs with the fresh input provided in the current step\n`;
            enhancedPrompt += `- The input field contains NEW input specific to this step - process it in context of previous steps\n`;
        }
        
        // Add quality feedback from previous attempts (if any)
        const qualityScore = this.qualityScores.get(section.sectionId);
        if (qualityScore && qualityScore.score < 0.8) {
            enhancedPrompt += `\n## Quality Feedback from Previous Attempt\n`;
            enhancedPrompt += `Score: ${(qualityScore.score * 100).toFixed(1)}%\n`;
            enhancedPrompt += `Feedback: ${qualityScore.feedback}\n`;
            if (qualityScore.issues && qualityScore.issues.length > 0) {
                enhancedPrompt += `Issues to address:\n${qualityScore.issues.map(issue => `- ${issue}`).join('\n')}\n`;
            }
        }
        
        // Add synthesis insights (if available)
        // Note: Synthesis is per-iteration, so we'd need to store it to reference here
        // For now, we'll skip this to avoid complexity
        
        // Add discussion points (if any)
        if (context.discussionHistory && context.discussionHistory.length > 0) {
            enhancedPrompt += `\n## Agent Discussion History\n\n`;
            for (const entry of context.discussionHistory) {
                enhancedPrompt += `**${entry.agentRole}**: ${entry.message}\n\n`;
            }
        }
        
        return enhancedPrompt;
    }
    
    // Get section input (user input if exists, else from dependencies)
    async getSectionInput(projectId, section) {
        // If section has user input, use that
        if (section.input && section.input.trim()) {
            return section.input;
        }
        
        // Otherwise, get input from dependencies
        const project = this.stateManager.getProject(projectId);
        if (!project) return '';
        
        // If section has dependencies, use outputs from dependency sections
        if (section.dependencies && section.dependencies.length > 0) {
            const dependencyOutputs = [];
            for (const depId of section.dependencies) {
                const depSection = project.sections.find(s => s.sectionId === depId);
                if (depSection && depSection.output) {
                    dependencyOutputs.push(depSection.output);
                }
            }
            // Combine all dependency outputs
            return dependencyOutputs.join('\n\n---\n\n') || '';
        }
        
        // Fallback: use previous section by position (for backward compatibility)
        const currentIndex = project.sections.findIndex(s => s.sectionId === section.sectionId);
        if (currentIndex > 0) {
            const previousSection = project.sections[currentIndex - 1];
            return previousSection.output || '';
        }
        
        return '';
    }
    
    // Initiate discussion between agents
    initiateDiscussion(projectId, stepIds) {
        const discussionId = `discussion-${stepIds.join('-')}`;
        this.agentDiscussions.set(discussionId, []);
        return discussionId;
    }
    
    // Add entry to discussion
    addDiscussionEntry(discussionId, agentRole, message) {
        if (!this.agentDiscussions.has(discussionId)) {
            this.agentDiscussions.set(discussionId, []);
        }
        
        const discussion = this.agentDiscussions.get(discussionId);
        discussion.push({
            agentRole: agentRole,
            message: message,
            timestamp: Date.now()
        });
    }
    
    // Build discussion prompt for LLM
    buildDiscussionPrompt(discussionHistory) {
        let prompt = `## Agent Discussion History\n\n`;
        for (const entry of discussionHistory) {
            prompt += `**${entry.agentRole}**: ${entry.message}\n\n`;
        }
        prompt += `\n## Your Response\n\nContinue the discussion with your perspective.`;
        return prompt;
    }
    
    // Detect conflicts in parallel results
    detectConflicts(parallelResults) {
        const conflicts = [];
        // Simple conflict detection: look for contradictory keywords or patterns
        // This is a basic implementation; could be enhanced with more sophisticated analysis
        return conflicts;
    }
    
    // Resolve conflicts
    async resolveConflicts(projectId, conflicts) {
        if (conflicts.length === 0) return null;
        
        const resolutionPrompt = `You are a conflict resolution agent. The following conflicts were detected in parallel execution:

${conflicts.map(c => `- ${c.description}`).join('\n')}

Please provide a resolution that reconciles these conflicts. Respond with a JSON object:
{
  "resolution": "<description of resolution>",
  "recommendedActions": ["<action 1>", ...]
}`;

        try {
            const project = this.stateManager.getProject(projectId);
            const scopeDir = project?.scopeDirectory || this.stateManager.getScopeDirectory();
            const response = await this.executeCursorCLI(resolutionPrompt, scopeDir);
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Error resolving conflicts:', error);
        }
        
        return null;
    }
    
    // Validate dependencies
    validateDependencies(project) {
        const sections = project.sections;
        const sectionIds = new Set(sections.map(s => s.sectionId));
        const missingDeps = [];
        
        for (const section of sections) {
            if (section.dependencies && section.dependencies.length > 0) {
                for (const depId of section.dependencies) {
                    if (!sectionIds.has(depId)) {
                        missingDeps.push(`Section "${section.sectionName || section.sectionId}" depends on missing section: ${depId}`);
                    }
                }
            }
        }
        
        if (missingDeps.length > 0) {
            return {
                valid: false,
                message: 'Some sections have missing dependencies',
                missingDeps: missingDeps
            };
        }
        
        return { valid: true };
    }
    
    // Execute cursor-cli via server endpoint with retry logic
    async executeCursorCLI(prompt, scopeDirectory) {
        if (this.errorHandler) {
            const result = await this.errorHandler.handleAsyncWithRetry(
                async () => {
                    const response = await fetch('/api/cursor-cli-execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: prompt,
                            scopeDirectory: scopeDirectory
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status} ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.error || 'Cursor CLI execution failed');
                    }
                    
                    return result.output;
                },
                { source: 'MultiAgentAutomationSystem', operation: 'executeCursorCLI' },
                { maxRetries: 2, baseDelay: 2000 }
            );
            
            if (!result.success) {
                this.errorHandler.showUserNotification(result.error, {
                    source: 'MultiAgentAutomationSystem',
                    operation: 'executeCursorCLI'
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Cursor CLI Execution Failed'
                });
                throw new Error(result.error);
            }
            
            return result.data;
        } else {
            // Fallback to original logic
            const response = await fetch('/api/cursor-cli-execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    scopeDirectory: scopeDirectory
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Cursor CLI execution failed');
            }
            
            return result.output;
        }
    }
    
    // Save output to file for persistence
    async saveOutputToFile(projectId, section, output) {
        const project = this.stateManager.getProject(projectId);
        const automationDir = project.automationDirectory;
        
        if (!automationDir) {
            console.warn('No automation directory set, skipping file save');
            return;
        }
        
        // Determine file name from section
        const stepName = section.stepName || section.sectionId;
        const fileName = `${stepName}-output.md`;
        const filePath = `${automationDir}/${fileName}`;
        
        try {
            const response = await fetch('http://localhost:8050/api/save-automation-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: filePath,
                    content: output
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                console.warn(`Failed to save output file: ${result.error}`);
            }
        } catch (error) {
            console.error('Error saving output file:', error);
        }
    }
    
    // Stop execution
    stop() {
        if (this.isRunning) {
            this.shouldStop = true;
            this.isRunning = false;
            this.updateProgress('Stopping execution...', '');
        }
    }
    
    // Show progress modal
    showProgressModal() {
        const modal = document.getElementById('multi-agent-progress-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.progressModal = modal;
            this.progressText = document.getElementById('multi-agent-progress-text');
            this.progressLog = document.getElementById('multi-agent-progress-log');
            
            // Clear log
            if (this.progressLog) {
                this.progressLog.innerHTML = ''; // Clearing - safe
            }
        }
    }
    
    // Hide progress modal
    hideProgressModal() {
        const modal = document.getElementById('multi-agent-progress-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Update progress text
    updateProgress(text, logEntry) {
        if (this.progressText) {
            this.progressText.textContent = text;
        }
        if (logEntry) {
            this.appendToLog(logEntry);
        }
    }
    
    // Append to progress log
    appendToLog(message) {
        if (this.progressLog) {
            const entry = document.createElement('div');
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            entry.style.marginBottom = '4px';
            this.progressLog.appendChild(entry);
            // Auto-scroll to bottom
            this.progressLog.scrollTop = this.progressLog.scrollHeight;
        }
    }
    
    // Add execution event for visualization
    addExecutionEvent(type, data) {
        this.executionHistory.push({
            type: type,
            data: data,
            timestamp: Date.now()
        });
        // Keep only last 100 events
        if (this.executionHistory.length > 100) {
            this.executionHistory.shift();
        }
    }
    
    // Add RAG step
    addRAGStep(stepInfo) {
        this.ragSteps.push(stepInfo);
        // Keep only last 50 RAG steps
        if (this.ragSteps.length > 50) {
            this.ragSteps.shift();
        }
    }
    
    // Update all UI elements
    updateUI() {
        this.updateActiveAgents();
        this.updateExecutionFlow();
        this.updateConversations();
        this.updateRAGSteps();
    }
    
    // Update active agents display
    updateActiveAgents() {
        const container = document.getElementById('multi-agent-active-agents');
        if (!container) return;
        
        if (this.activeAgents.size === 0) {
            container.innerHTML = '<span style="color: #888; font-size: 0.9em;">No active agents</span>';
            return;
        }
        
        container.innerHTML = ''; // Clearing - safe
        this.activeAgents.forEach((agentInfo, sectionId) => {
            const project = this.stateManager.getProject(this.currentProjectId);
            const section = project?.sections.find(s => s.sectionId === sectionId);
            const sectionName = section?.sectionName || sectionId;
            
            const agentEl = document.createElement('div');
            agentEl.style.cssText = 'background: #2d2d2d; padding: 6px 12px; border-radius: 4px; font-size: 0.85em; display: flex; align-items: center; gap: 8px;';
            // agentInfo contains user data (section names, roles) - escape and use safeSetInnerHTML
            const agentHtml = `
                <span style="color: #4CAF50;">●</span>
                <span style="color: #e0e0e0;">${this.escapeHtml(sectionName)}</span>
                <span style="color: #888; font-size: 0.9em;">(${this.escapeHtml(agentInfo.role)})</span>
                ${agentInfo.retryCount > 0 ? `<span style="color: #ff9800; font-size: 0.9em;">[Retry ${agentInfo.retryCount}]</span>` : ''}
            `;
            if (window.safeSetInnerHTML) {
                window.safeSetInnerHTML(agentEl, agentHtml, { trusted: false });
            } else {
                agentEl.innerHTML = agentHtml;
            }
            container.appendChild(agentEl);
        });
    }
    
    // Update execution flow visualization
    updateExecutionFlow() {
        const container = document.getElementById('multi-agent-execution-flow');
        if (!container) return;
        
        if (this.executionHistory.length === 0) {
            container.innerHTML = '<div style="color: #888;">Waiting for execution...</div>';
            return;
        }
        
        // Group events by iteration
        const iterations = new Map();
        this.executionHistory.forEach(event => {
            const iter = event.data?.iteration || 0;
            if (!iterations.has(iter)) {
                iterations.set(iter, []);
            }
            iterations.get(iter).push(event);
        });
        
        let html = '';
        iterations.forEach((events, iter) => {
            html += `<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #404040;">`;
            html += `<div style="font-weight: 500; color: #4CAF50; margin-bottom: 8px;">Iteration ${iter}</div>`;
            
            events.forEach(event => {
                const time = new Date(event.timestamp).toLocaleTimeString();
                let eventText = '';
                let color = '#e0e0e0';
                
                switch (event.type) {
                    case 'iteration_start':
                        eventText = `Started with ${event.data.readySteps?.length || 0} ready step(s)`;
                        color = '#4CAF50';
                        break;
                    case 'parallel_start':
                        eventText = `Executing ${event.data.steps?.length || 0} step(s) in parallel: ${event.data.steps?.join(', ') || ''}`;
                        color = '#2196F3';
                        break;
                    case 'parallel_complete':
                        const successCount = event.data.results?.filter(r => r.success).length || 0;
                        eventText = `Completed ${successCount}/${event.data.results?.length || 0} parallel step(s)`;
                        color = successCount === event.data.results?.length ? '#4CAF50' : '#ff9800';
                        break;
                    case 'synthesis_start':
                        eventText = 'Starting synthesis...';
                        color = '#9C27B0';
                        break;
                    case 'synthesis_complete':
                        eventText = `Synthesis complete: ${event.data.conflicts || 0} conflicts, ${event.data.improvements || 0} improvements`;
                        color = '#4CAF50';
                        break;
                }
                
                // eventText may contain user data - escape
                const escapedEventText = this.escapeHtml(eventText);
                html += `<div style="color: ${color}; font-size: 0.9em; margin-left: 12px; margin-top: 4px;">
                    <span style="color: #888;">[${time}]</span> ${escapedEventText}
                </div>`;
            });
            
            html += `</div>`;
        });
        
        // html contains user data (agent discussions, messages) - sanitize
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(container, html, { allowMarkdown: true });
        } else {
            container.innerHTML = html;
        }
        container.scrollTop = container.scrollHeight;
    }
    
    // Update conversations display
    updateConversations() {
        const container = document.getElementById('multi-agent-conversations');
        if (!container) return;
        
        if (this.agentDiscussions.size === 0) {
            container.innerHTML = '<div style="color: #888;">No conversations yet</div>';
            return;
        }
        
        let html = '';
        this.agentDiscussions.forEach((discussion, discussionId) => {
            if (discussion.length === 0) return;
            
            html += `<div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #404040;">`;
            html += `<div style="font-weight: 500; color: #e0e0e0; margin-bottom: 8px;">${discussionId.replace('discussion-', 'Discussion: ')}</div>`;
            
            discussion.forEach(entry => {
                const time = new Date(entry.timestamp).toLocaleTimeString();
                html += `<div style="margin-bottom: 8px; padding: 8px; background: #2d2d2d; border-radius: 4px;">`;
                html += `<div style="font-weight: 500; color: #4CAF50; margin-bottom: 4px;">${this.escapeHtml(entry.agentRole)} <span style="color: #888; font-size: 0.85em; font-weight: normal;">[${time}]</span></div>`;
                html += `<div style="color: #e0e0e0; font-size: 0.9em; white-space: pre-wrap;">${this.escapeHtml(entry.message)}</div>`;
                html += `</div>`;
            });
            
            html += `</div>`;
        });
        
        container.innerHTML = html || '<div style="color: #888;">No conversations yet</div>';
    }
    
    // Update RAG steps display
    updateRAGSteps() {
        const container = document.getElementById('multi-agent-rag-steps');
        if (!container) return;
        
        if (this.ragSteps.length === 0) {
            // Static message - safe
            container.innerHTML = '<div style="color: #888;">No RAG steps yet</div>';
            return;
        }
        
        let html = '';
        this.ragSteps.slice(-20).reverse().forEach(step => {
            const time = new Date(step.timestamp).toLocaleTimeString();
            let typeLabel = '';
            let color = '#e0e0e0';
            
            switch (step.type) {
                case 'context_building':
                    typeLabel = 'Context Building';
                    color = '#2196F3';
                    break;
                case 'prompt_enhancement':
                    typeLabel = 'Prompt Enhancement';
                    color = '#9C27B0';
                    break;
                case 'quality_evaluation':
                    typeLabel = 'Quality Evaluation';
                    color = '#ff9800';
                    break;
            }
            
            html += `<div style="margin-bottom: 8px; padding: 8px; background: #2d2d2d; border-radius: 4px; border-left: 3px solid ${color};">`;
            html += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`;
            html += `<span style="font-weight: 500; color: ${color};">${typeLabel}</span>`;
            html += `<span style="color: #888; font-size: 0.85em;">${time}</span>`;
            html += `</div>`;
            html += `<div style="color: #e0e0e0; font-size: 0.9em;">Step: ${this.escapeHtml(step.step)}</div>`;
            if (step.contextSources && step.contextSources.length > 0) {
                // contextSources may contain user data - escape each source
                const escapedSources = step.contextSources.map(s => this.escapeHtml(s)).join(', ');
                html += `<div style="color: #888; font-size: 0.85em; margin-top: 4px;">Sources: ${escapedSources}</div>`;
            }
            html += `</div>`;
        });
        
        // html contains user data (agent discussions, messages) - sanitize
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(container, html, { allowMarkdown: true });
        } else {
            container.innerHTML = html;
        }
    }
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

