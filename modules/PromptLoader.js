// Prompt Loader - Loads core steps, modifiers, and assembles prompts with modifier injection
class PromptLoader {
    constructor() {
        this.coreSteps = new Map(); // Cache: stepName -> content
        this.modifiers = new Map(); // Cache: stepName/modifierName -> content
        this.processSteps = new Map(); // Cache: processStepName -> content
        this.specializedPrompts = new Map(); // Cache: promptName -> content
        this.loaded = false;
        this.loading = false;
        this.basePath = 'reference/pipeline-steps/';
        this.referenceDocuments = null; // Will be set if ReferenceDocuments is available
    }
    
    // Load all core steps, modifiers, and process steps
    async loadTemplate() {
        if (this.loaded) {
            return;
        }
        
        if (this.loading) {
            // Wait for existing load to complete
            while (this.loading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }
        
        this.loading = true;
        
        try {
            // Core steps to load
            const coreStepNames = [
                'research',
                'feature-extraction',
                'validation',
                'app-analysis',
                'decomposition',
                'atomic-features',
                'ux-specification'
            ];
            
            // Process steps to load
            const processStepNames = [
                'validation-loop',
                'refinement-loop',
                'integration-loop'
            ];
            
            // Load core steps
            const corePromises = coreStepNames.map(stepName => 
                this.loadCoreStep(stepName)
            );
            
            // Load process steps
            const processPromises = processStepNames.map(stepName =>
                this.loadProcessStep(stepName)
            );
            
            await Promise.all([...corePromises, ...processPromises]);
            
            this.loaded = true;
            this.loading = false;
        } catch (error) {
            console.error('Error loading prompt templates:', error);
            this.loading = false;
            throw error;
        }
    }
    
    // Load a core step template
    async loadCoreStep(stepName) {
        if (this.coreSteps.has(stepName)) {
            return this.coreSteps.get(stepName);
        }
        
        const filePath = `core/${stepName}.md`;
        const content = await this.fetchFile(filePath);
        
        if (content) {
            this.coreSteps.set(stepName, content);
        }
        
        return content;
    }
    
    // Load a modifier
    async loadModifier(stepName, modifierName) {
        const cacheKey = `${stepName}/${modifierName}`;
        
        if (this.modifiers.has(cacheKey)) {
            return this.modifiers.get(cacheKey);
        }
        
        const filePath = `modifiers/${stepName}/${modifierName}.md`;
        const content = await this.fetchFile(filePath);
        
        if (content) {
            this.modifiers.set(cacheKey, content);
        }
        
        return content;
    }
    
    // Load a process step
    async loadProcessStep(processStepName) {
        if (this.processSteps.has(processStepName)) {
            return this.processSteps.get(processStepName);
        }
        
        const filePath = `process-steps/${processStepName}.md`;
        const content = await this.fetchFile(filePath);
        
        if (content) {
            this.processSteps.set(processStepName, content);
        }
        
        return content;
    }
    
    // Load a specialized prompt (Case 3)
    async loadSpecializedPrompt(promptName) {
        if (this.specializedPrompts.has(promptName)) {
            return this.specializedPrompts.get(promptName);
        }
        
        // promptName might be a full path (e.g., "case3-specialized/user-description-parsing.md")
        // or just a filename (e.g., "user-description-parsing")
        let filePath;
        if (promptName.includes('/')) {
            // Already a full path, use as-is (but remove .md if present since we'll add it)
            filePath = promptName.endsWith('.md') ? promptName : `${promptName}.md`;
        } else {
            // Just a filename, try case3-specialized directory first
            filePath = `case3-specialized/${promptName}.md`;
        }
        
        let content = await this.fetchFile(filePath);
        
        if (!content && !promptName.includes('/')) {
            // Try inference directory if it wasn't a full path
            filePath = `inference/${promptName}.md`;
            content = await this.fetchFile(filePath);
        }
        
        if (content) {
            this.specializedPrompts.set(promptName, content);
        }
        
        return content;
    }
    
    // Fetch a file with multiple path options
    async fetchFile(relativePath) {
        const pathOptions = [
            this.basePath + relativePath,
            './' + this.basePath + relativePath,
            '../feat-spec/' + this.basePath + relativePath,
            '/feat-spec/' + this.basePath + relativePath
        ];
        
        let lastError = null;
        let lastStatus = null;
        
        for (const path of pathOptions) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    return await response.text();
                } else {
                    lastStatus = response.status;
                }
            } catch (err) {
                lastError = err;
                continue;
            }
        }
        
        console.warn(`Failed to load ${relativePath}. Status: ${lastStatus || 'unknown'}. Tried paths: ${pathOptions.join(', ')}`);
        return null;
    }
    
    // Inject modifiers into a core step
    async injectModifiers(coreStepContent, modifiers, stepName) {
        if (!modifiers || modifiers.length === 0) {
            // Remove the injection placeholder if no modifiers
            return coreStepContent.replace(/{INJECT_MODIFIER_CONTENT_HERE}/g, '');
        }
        
        // Load all modifier contents
        const modifierContents = [];
        for (const modifierName of modifiers) {
            const modifierContent = await this.loadModifier(stepName, modifierName);
            if (modifierContent) {
                modifierContents.push(modifierContent);
            }
        }
        
        // Combine modifier contents
        const combinedModifiers = modifierContents.join('\n\n---\n\n');
        
        // Replace injection placeholder with modifier content
        return coreStepContent.replace(/{INJECT_MODIFIER_CONTENT_HERE}/g, combinedModifiers);
    }
    
    // Get assembled prompt for a section (with modifiers injected and variables substituted)
    async getPrompt(sectionId, sectionData = null, projectData = null, options = {}) {
        await this.loadTemplate();
        
        // Extract step name from section data or section ID
        const stepName = sectionData?.stepName || sectionId;
        
        let basePrompt = null;
        
        // Check if this is a process step
        if (sectionData?.isProcessStep && sectionData?.processStepType) {
            basePrompt = await this.loadProcessStep(sectionData.processStepType);
            if (!basePrompt) {
                console.warn(`Process step not found: ${sectionData.processStepType}`);
                return null;
            }
        }
        // Check if this is an inference step
        else if (sectionData?.isInferenceStep) {
            // Inference steps are in the inference/ directory
            const filePath = `inference/${stepName}.md`;
            basePrompt = await this.fetchFile(filePath);
            if (!basePrompt) {
                console.warn(`Inference step not found: ${stepName}`);
                return null;
            }
        }
        // Otherwise, try to load as core step
        else {
            basePrompt = await this.loadCoreStep(stepName);
            if (!basePrompt) {
                console.warn(`Core step not found: ${stepName}`);
                return null;
            }
        }
        
        // Get modifiers for this section
        const modifiers = sectionData?.modifiers || [];
        
        // Inject modifiers (only for core steps, not process steps or inference steps)
        let prompt = basePrompt;
        if (!sectionData?.isProcessStep && !sectionData?.isInferenceStep) {
            prompt = await this.injectModifiers(basePrompt, modifiers, stepName);
        }
        
        // Load specialized prompt if applicable
        if (sectionData?.specialized) {
            // specialized field may be a full path like "case3-specialized/user-description-parsing.md"
            // or just a filename like "user-description-parsing"
            const specializedContent = await this.loadSpecializedPrompt(sectionData.specialized);
            if (specializedContent) {
                // Append specialized content (or replace a placeholder if one exists)
                prompt = prompt + '\n\n---\n\n## Specialized Instructions\n\n' + specializedContent;
            }
        }
        
        // Extract prompt portion if needed (between **Prompt:** and **Output Format:**)
        const promptMatch = prompt.match(/\*\*Prompt:\*\*\s*```(?:\w+)?\n([\s\S]*?)\n```/);
        if (promptMatch) {
            prompt = promptMatch[1].trim();
        } else {
            // Fallback: try without code fences
            const promptMatch2 = prompt.match(/\*\*Prompt:\*\*\s*([\s\S]*?)\s*\*\*Output Format:\*\*/);
            if (promptMatch2) {
                prompt = promptMatch2[1].trim();
            }
        }
        
        // Substitute variables
        if (projectData && sectionData) {
            prompt = await this.substituteVariables(prompt, sectionData, projectData, options);
        }
        
        // Inject reference document content
        prompt = await this.injectReferenceContent(prompt, stepName, sectionData);
        
        return prompt;
    }
    
    // Inject reference document content into prompt
    async injectReferenceContent(prompt, stepName, sectionData) {
        // Try to get ReferenceDocuments from window or use instance
        const refDocs = window.ReferenceDocuments || this.referenceDocuments;
        if (!refDocs) {
            return prompt;
        }
        
        try {
            await refDocs.loadAll();
            
            const referenceContent = await refDocs.getDocument('feature-spec-reference');
            if (!referenceContent) {
                console.warn('Feature spec reference document not found');
                return prompt;
            }
            
            // Extract relevant parts based on step type
            const relevantParts = this.getRelevantReferenceParts(stepName, sectionData);
            
            // Build reference section
            const poiesisSteps = ['theoria', 'praxis', 'doctrine', 'poiesis'];
            const isPoiesisStep = poiesisSteps.includes(stepName);
            
            let referenceSection = '\n\n---\n\n## Required Reference Documents\n\n';
            if (isPoiesisStep) {
                referenceSection += '**CRITICAL**: This is a Poiesis step. Use cNode/cElement terminology and philosophical/cognitive frameworks. ';
                referenceSection += 'DO NOT use software/UI terminology (action1, action2, opacity, scale, timing, etc.).\n\n';
            } else {
                referenceSection += '**CRITICAL**: You MUST use the following reference materials for consistency. ';
                referenceSection += 'All terminology, taxonomy, quality metrics, and validation rules come from these documents.\n\n';
            }
            
            // Add each relevant part
            for (const partName of relevantParts) {
                const partContent = this.extractPartFromReference(referenceContent, partName);
                if (partContent) {
                    referenceSection += `### ${partName}\n\n`;
                    referenceSection += partContent;
                    referenceSection += '\n\n---\n\n';
                }
            }
            
            // Add full document reference for context (only for non-Poiesis steps)
            if (!isPoiesisStep && relevantParts.length > 0) {
                referenceSection += '### Complete Reference Document\n\n';
                referenceSection += 'The complete reference document (`feature-spec-reference.md`) contains:\n';
                referenceSection += '- **Part 1: Terminology** - All interaction terms, visual properties, timing notation\n';
                referenceSection += '- **Part 2: Feature Taxonomy** - Feature classification system\n';
                referenceSection += '- **Part 3: Dependency Mapping** - How features relate to each other\n';
                referenceSection += '- **Part 4: Quality Metrics & Validation** - Checklists and validation rules\n\n';
                referenceSection += '**You MUST use terminology from Part 1, classify features using Part 2, ';
                referenceSection += 'and validate outputs using Part 4.**\n\n';
            }
            
            // Insert reference section after the main prompt but before output format
            // Look for "Output Format" or "Quality Criteria" sections
            const outputFormatMatch = prompt.match(/(\n## Output Format|\n## Quality Criteria)/);
            if (outputFormatMatch) {
                const insertIndex = outputFormatMatch.index;
                prompt = prompt.slice(0, insertIndex) + referenceSection + prompt.slice(insertIndex);
            } else {
                // Append at the end if no output format section found
                prompt += referenceSection;
            }
            
        } catch (error) {
            console.warn('Failed to inject reference content:', error);
        }
        
        return prompt;
    }
    
    // Get relevant reference parts for a step
    getRelevantReferenceParts(stepName, sectionData) {
        const parts = [];
        
        // Poiesis steps (Case 6) don't use software/UI terminology
        const poiesisSteps = ['theoria', 'praxis', 'doctrine', 'poiesis'];
        const isPoiesisStep = poiesisSteps.includes(stepName);
        
        // All steps need terminology EXCEPT Poiesis steps
        if (!isPoiesisStep) {
            parts.push('Part 1: Terminology');
        }
        
        // Steps that classify or extract features need taxonomy
        if (['feature-extraction', 'app-analysis', 'decomposition', 'atomic-features', 'atomization', 'iterative-refinement'].includes(stepName)) {
            parts.push('Part 2: Feature Taxonomy');
        }
        
        // Steps that validate need quality metrics
        if (['validation', 'validation-loop'].includes(stepName) || sectionData?.isProcessStep) {
            parts.push('Part 4: Quality Metrics & Validation');
        }
        
        // UX specification needs all parts
        if (stepName === 'ux-specification') {
            parts.push('Part 2: Feature Taxonomy');
            parts.push('Part 3: Dependency Mapping');
            parts.push('Part 4: Quality Metrics & Validation');
        }
        
        // Remove duplicates
        return [...new Set(parts)];
    }
    
    // Extract a specific part from the reference document
    extractPartFromReference(content, partName) {
        // Match the part header and extract until next part or end
        const partPattern = new RegExp(`## ${partName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## Part |$)`, 'i');
        const match = content.match(partPattern);
        
        if (match) {
            let partContent = match[0];
            
            // Truncate if too long (keep first ~8000 chars to avoid token limits)
            if (partContent.length > 8000) {
                partContent = partContent.substring(0, 8000) + '\n\n... (content truncated, see full document) ...';
            }
            
            return partContent;
        }
        
        return null;
    }
    
    // Extract input guidance from a step file
    async getInputGuidance(stepName, isProcessStep = false, isInferenceStep = false, processStepType = null) {
        await this.loadTemplate();
        
        let fileContent = null;
        
        if (isProcessStep && processStepType) {
            fileContent = await this.loadProcessStep(processStepType);
        } else if (isInferenceStep) {
            const filePath = `inference/${stepName}.md`;
            fileContent = await this.fetchFile(filePath);
        } else {
            fileContent = await this.loadCoreStep(stepName);
        }
        
        if (!fileContent) return null;
        
        // Extract Input Guidance section
        const guidanceMatch = fileContent.match(/## Input Guidance\s*\n\n([\s\S]*?)(?=\n---|\n## |$)/);
        if (guidanceMatch) {
            return guidanceMatch[1].trim();
        }
        
        // Fallback: try to extract from **Input** field at the top
        const inputMatch = fileContent.match(/\*\*Input\*\*:\s*([^\n]+)/);
        if (inputMatch) {
            return `Enter: ${inputMatch[1].trim()}`;
        }
        
        return null;
    }
    
    // Get process step prompt
    async getProcessStepPrompt(processStepName, sectionData = null, projectData = null) {
        await this.loadTemplate();
        
        let prompt = await this.loadProcessStep(processStepName);
        if (!prompt) {
            console.warn(`Process step not found: ${processStepName}`);
            return null;
        }
        
        // Extract prompt portion
        const promptMatch = prompt.match(/\*\*Prompt:\*\*\s*```(?:\w+)?\n([\s\S]*?)\n```/);
        if (promptMatch) {
            prompt = promptMatch[1].trim();
        } else {
            const promptMatch2 = prompt.match(/\*\*Prompt:\*\*\s*([\s\S]*?)\s*\*\*Output Format:\*\*/);
            if (promptMatch2) {
                prompt = promptMatch2[1].trim();
            }
        }
        
        // Substitute variables
        if (projectData && sectionData) {
            prompt = await this.substituteVariables(prompt, sectionData, projectData);
        }
        
        return prompt;
    }
    
    // Substitute variables in prompt text
    async substituteVariables(prompt, sectionData, projectData, options = {}) {
        if (!prompt) return '';
        
        // Default: don't substitute input or automation ID (keep placeholders for display)
        const substituteInput = options.substituteInput || false;
        const substituteAutomationId = options.substituteAutomationId || false;
        
        let result = prompt;
        const project = projectData;
        const section = sectionData;
        const allSections = project?.sections || [];
        
        // Get variable definitions from PipelineConfig
        const pipelineConfig = window.PipelineConfig;
        let variableDefs = {};
        if (pipelineConfig) {
            try {
                variableDefs = await pipelineConfig.getVariableDefinitions();
            } catch (e) {
                console.warn('Could not load variable definitions:', e);
            }
        }
        
        // {CASE}
        if (result.includes('{CASE}')) {
            result = result.replace(/{CASE}/g, String(project?.case || ''));
        }
        
        // {MODIFIERS}
        if (result.includes('{MODIFIERS}')) {
            const modifiers = section?.modifiers || [];
            result = result.replace(/{MODIFIERS}/g, modifiers.join(', ') || 'none');
        }
        
        // {PREVIOUS_OUTPUT} or {PREVIOUS_STEP} - Use dependencies if available, otherwise fall back to position
        if (result.includes('{PREVIOUS_OUTPUT}') || result.includes('{PREVIOUS_STEP}')) {
            let previousOutput = '';
            let previousStepName = '';
            
            // First, try to use dependencies
            if (section?.dependencies && section.dependencies.length > 0) {
                // Use the first dependency's output (or combine if multiple)
                const dependencyOutputs = [];
                const dependencyNames = [];
                for (const depId of section.dependencies) {
                    const depSection = allSections.find(s => s.sectionId === depId);
                    if (depSection) {
                        if (depSection.output) {
                            dependencyOutputs.push(depSection.output);
                        }
                        dependencyNames.push(depSection.sectionName || depSection.sectionId);
                    }
                }
                previousOutput = dependencyOutputs.join('\n\n---\n\n') || '';
                previousStepName = dependencyNames.join(', ') || '';
            } else {
                // Fallback to position-based (for backward compatibility)
                const currentIndex = allSections.findIndex(s => s.sectionId === section?.sectionId);
                if (currentIndex > 0) {
                    const previousSection = allSections[currentIndex - 1];
                    previousOutput = previousSection?.output || '';
                    previousStepName = previousSection?.sectionName || '';
                }
            }
            
            result = result.replace(/{PREVIOUS_OUTPUT}/g, previousOutput);
            result = result.replace(/{PREVIOUS_STEP}/g, previousStepName);
        }
        
        // {PREVIOUS_STEPS} - List all previous steps with their outputs (for Case 6 flexible linking)
        if (result.includes('{PREVIOUS_STEPS}')) {
            const currentIndex = allSections.findIndex(s => s.sectionId === section?.sectionId);
            let previousStepsList = '';
            
            if (currentIndex > 0) {
                const previousSections = allSections.slice(0, currentIndex);
                previousStepsList = previousSections.map((prevSection, idx) => {
                    const output = prevSection?.output || '(No output yet)';
                    const outputPreview = output.length > 500 ? output.substring(0, 500) + '...' : output;
                    return `### ${idx + 1}. ${prevSection?.sectionName || prevSection?.sectionId || 'Unknown Step'}\n\n**Output:**\n${outputPreview}`;
                }).join('\n\n---\n\n');
            } else {
                previousStepsList = '(No previous steps completed yet)';
            }
            
            result = result.replace(/{PREVIOUS_STEPS}/g, previousStepsList);
        }
        
        // {INPUT_SOURCES}
        if (result.includes('{INPUT_SOURCES}')) {
            const caseNumber = project?.case;
            const inputSources = this.getInputSourcesDescription(caseNumber, section?.modifiers || []);
            result = result.replace(/{INPUT_SOURCES}/g, inputSources);
        }
        
        // {USER_INPUT} or {INPUT} - Use section's input field if available
        // Only substitute if explicitly requested (for copying, not for display)
        if (substituteInput && (result.includes('{USER_INPUT}') || result.includes('{INPUT}'))) {
            const userInput = section?.input || '';
            result = result.replace(/{USER_INPUT}/g, userInput);
            result = result.replace(/{INPUT}/g, userInput);
        }
        
        // {AUTOMATION_DIR} - Directory for automation file watching
        if (result.includes('{AUTOMATION_DIR}')) {
            const automationDir = project?.automationDirectory;
            if (automationDir && automationDir.trim()) {
                // If user provided a directory, replace the entire pattern including step-specific subdirectories
                // This handles patterns like "{AUTOMATION_DIR}/idea-capture-output" -> just the user's directory
                // Match {AUTOMATION_DIR} followed by / and any characters until whitespace, backtick, or newline
                result = result.replace(/{AUTOMATION_DIR}\/[^\s`\n]+/g, automationDir.trim());
                // Also replace any remaining standalone {AUTOMATION_DIR} references (not already replaced)
                result = result.replace(/{AUTOMATION_DIR}/g, automationDir.trim());
            } else {
                // No directory provided, use default pattern
                const defaultDir = './automation-output';
                result = result.replace(/{AUTOMATION_DIR}/g, defaultDir);
            }
        }
        
        // {AUTOMATION_ID} - Unique automation ID for this section
        // Only substitute when explicitly requested (for copying, not for display)
        if (substituteAutomationId && result.includes('{AUTOMATION_ID}')) {
            const automationId = section?.automationId || '';
            if (automationId) {
                result = result.replace(/{AUTOMATION_ID}/g, automationId);
            } else {
                // If no ID set, generate a default one
                const defaultId = this.generateDefaultId(project, section);
                result = result.replace(/{AUTOMATION_ID}/g, defaultId);
            }
        }
        
        // {EXISTING_FEATURES}
        if (result.includes('{EXISTING_FEATURES}')) {
            const existingFeatures = project?.caseChain?.previousCaseOutput || '';
            result = result.replace(/{EXISTING_FEATURES}/g, existingFeatures || '');
        }
        
        // {PROCESS_STEP_TRIGGERS}
        if (result.includes('{PROCESS_STEP_TRIGGERS}')) {
            const triggers = await this.getProcessStepTriggersDescription(project?.case, section?.stepName);
            result = result.replace(/{PROCESS_STEP_TRIGGERS}/g, triggers);
        }
        
        // {WORKFLOW_CONTEXT}
        if (result.includes('{WORKFLOW_CONTEXT}')) {
            const context = this.getWorkflowContextDescription(section, allSections);
            result = result.replace(/{WORKFLOW_CONTEXT}/g, context);
        }
        
        // {USER_DESCRIPTION}
        if (result.includes('{USER_DESCRIPTION}')) {
            const userDesc = section?.input || project?.userDescription || '';
            result = result.replace(/{USER_DESCRIPTION}/g, userDesc);
        }
        
        // {VTT_TRANSCRIPT}
        if (result.includes('{VTT_TRANSCRIPT}')) {
            const vtt = section?.vttTranscript || project?.vttTranscript || '';
            result = result.replace(/{VTT_TRANSCRIPT}/g, vtt);
        }
        
        // {UX_SPECIFICATIONS}
        if (result.includes('{UX_SPECIFICATIONS}')) {
            const uxSpec = allSections.find(s => s.stepName === 'ux-specification')?.output || '';
            result = result.replace(/{UX_SPECIFICATIONS}/g, uxSpec);
        }
        
        // {DATA_MODELS_OUTPUT}
        if (result.includes('{DATA_MODELS_OUTPUT}')) {
            const dataModels = allSections.find(s => s.sectionId === 'data-model-inference')?.output || '';
            result = result.replace(/{DATA_MODELS_OUTPUT}/g, dataModels);
        }
        
        // {STATE_MACHINES_OUTPUT}
        if (result.includes('{STATE_MACHINES_OUTPUT}')) {
            const stateMachines = allSections.find(s => s.sectionId === 'state-machine-inference')?.output || '';
            result = result.replace(/{STATE_MACHINES_OUTPUT}/g, stateMachines);
        }
        
        // {API_CONTRACTS_OUTPUT}
        if (result.includes('{API_CONTRACTS_OUTPUT}')) {
            const apiContracts = allSections.find(s => s.sectionId === 'api-contract-inference')?.output || '';
            result = result.replace(/{API_CONTRACTS_OUTPUT}/g, apiContracts);
        }
        
        // {ATOMIC_FEATURES_OUTPUT}
        if (result.includes('{ATOMIC_FEATURES_OUTPUT}')) {
            const atomicFeatures = allSections.find(s => s.stepName === 'atomic-features')?.output || '';
            result = result.replace(/{ATOMIC_FEATURES_OUTPUT}/g, atomicFeatures);
        }
        
        // Legacy placeholder support: [OUTPUT_FROM_SECTION_X]
        result = this.substituteLegacyPlaceholders(result, allSections);
        
        return result;
    }
    
    // Get input sources description based on case and modifiers
    getInputSourcesDescription(caseNumber, modifiers) {
        const caseDescriptions = {
            1: 'Source code files, documentation, implementation details, API specifications',
            2: 'Running application UI, user interactions, visual elements, interaction patterns',
            3: 'User-provided descriptions, VTT transcripts, unstructured text input'
        };
        
        let description = caseDescriptions[caseNumber] || 'Available input sources';
        
        if (modifiers.includes('enhancement-input')) {
            description += ', plus existing feature documentation from previous case';
        }
        
        return description;
    }
    
    // Get process step triggers description
    async getProcessStepTriggersDescription(caseNumber, stepName) {
        const pipelineConfig = window.PipelineConfig;
        if (!pipelineConfig) return '';
        
        try {
            const triggers = await pipelineConfig.getProcessStepTriggers(caseNumber, stepName);
            if (triggers.length === 0) return '';
            
            return triggers.map(t => 
                `- ${t.name} (${t.required ? 'required' : 'optional'})`
            ).join('\n');
        } catch (e) {
            return '';
        }
    }
    
    // Get workflow context description
    getWorkflowContextDescription(section, allSections) {
        const currentIndex = allSections.findIndex(s => s.sectionId === section?.sectionId);
        const total = allSections.length;
        const stepName = section?.stepName || section?.sectionId || 'unknown';
        
        return `Step ${currentIndex + 1} of ${total}: ${stepName}`;
    }
    
    // Legacy placeholder substitution (for backward compatibility)
    substituteLegacyPlaceholders(prompt, projectSections) {
        const placeholderPattern = /\[OUTPUT_FROM_SECTION_([\d._A-Za-z]+)\]/gi;
        
        return prompt.replace(placeholderPattern, (match, sectionRef) => {
            let sectionId = sectionRef.toLowerCase();
            
            // Map old format to new format
            const oldToNew = {
                '0_0a': 'research-initial', '0_0b': 'research-extraction', '0_0c': 'research-validation',
                '0a': 'discovery-inventory', '0b': 'discovery-decomposition', '0c': 'discovery-atomic',
                '1': 'ux-generation', '1_5': 'ux-validation', '1_6': 'ux-dependencies',
                '2': 'impl-generation', '2_5': 'impl-validation', '2_6': 'impl-interface',
                '3': 'final-assembly',
                '0_0A': 'research-initial', '0_0B': 'research-extraction', '0_0C': 'research-validation',
                '0A': 'discovery-inventory', '0B': 'discovery-decomposition', '0C': 'discovery-atomic',
                'R1': 'research-initial', 'R2': 'research-extraction', 'R3': 'research-validation'
            };
            
            if (oldToNew[sectionRef]) {
                sectionId = oldToNew[sectionRef];
            } else if (oldToNew[sectionRef.toUpperCase()]) {
                sectionId = oldToNew[sectionRef.toUpperCase()];
            }
            
            const section = projectSections.find(s => s.sectionId === sectionId);
            if (section && section.output) {
                return section.output;
            }
            
            return `[OUTPUT_FROM_SECTION_${sectionRef} - NOT FOUND]`;
        });
    }
    
    // Clear cache and reload
    async reload() {
        this.coreSteps.clear();
        this.modifiers.clear();
        this.processSteps.clear();
        this.specializedPrompts.clear();
        this.loaded = false;
        return await this.loadTemplate();
    }
}

// Export singleton instance
window.PromptLoader = new PromptLoader();
