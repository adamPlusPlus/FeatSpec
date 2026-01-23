// Placeholder Service - Handles input placeholder logic
class PlaceholderService {
    constructor(promptLoader) {
        this.promptLoader = promptLoader || window.PromptLoader;
    }
    
    /**
     * Get input placeholder text for a section
     * @param {Object} section - Section object
     * @param {Object} project - Project object
     * @returns {Promise<string>} Placeholder text
     */
    async getInputPlaceholder(section, project) {
        const stepName = section.stepName || section.sectionId;
        
        // Try to load input guidance from the step file
        if (this.promptLoader) {
            try {
                const guidance = await this.promptLoader.getInputGuidance(
                    stepName,
                    section.isProcessStep,
                    section.isInferenceStep,
                    section.processStepType
                );
                
                if (guidance) {
                    // Extract the first meaningful line for placeholder (usually the bullet point)
                    const lines = guidance.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        // Look for bullet points or bold text
                        const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
                        if (cleanLine && cleanLine.length < AppConstants.TEXT.TRUNCATE_LONG) {
                            // Use first reasonable line, but truncate if too long
                            return cleanLine.length > AppConstants.TEXT.TRUNCATE_LENGTH ? cleanLine.substring(0, AppConstants.TEXT.TRUNCATE_LENGTH - 3) + '...' : cleanLine;
                        }
                    }
                    // If no good line found, use first line truncated
                    if (lines.length > 0) {
                        const firstLine = lines[0].replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
                        return firstLine.length > AppConstants.TEXT.TRUNCATE_LENGTH ? firstLine.substring(0, AppConstants.TEXT.TRUNCATE_LENGTH - 3) + '...' : firstLine;
                    }
                }
            } catch (error) {
                console.warn('Failed to load input guidance:', error);
            }
        }
        
        // Fallback to generic placeholder
        return 'Enter input for this section...';
    }
}
