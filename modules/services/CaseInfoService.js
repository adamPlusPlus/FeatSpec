// Case Info Service - Handles case information processing
class CaseInfoService {
    /**
     * Get display name for a case number
     * @param {number} caseNumber - Case number (1-7)
     * @returns {string} Display name
     */
    getCaseDisplayName(caseNumber) {
        const caseNames = {
            1: 'Codebase Analysis',
            2: 'UI/UX-Only Analysis',
            3: 'User Input Analysis',
            4: 'Enhancement',
            5: 'Iterative Idea Refinement',
            6: 'Poiesis',
            7: 'Physis'
        };
        return caseNames[caseNumber] || `Case ${caseNumber}`;
    }
    
    /**
     * Render case badge HTML
     * @param {number} caseNumber - Case number
     * @param {Object|null} caseChain - Case chain information
     * @returns {string} HTML string for case badge
     */
    renderCaseBadge(caseNumber, caseChain = null) {
        const caseName = this.getCaseDisplayName(caseNumber);
        const caseClass = `case-badge case-${caseNumber}`;
        const chainIndicator = caseChain ? ` (from Case ${caseChain.previousCase})` : '';
        return `<span class="${caseClass}" title="${this.escapeHtml(caseName + chainIndicator)}">Case ${caseNumber}</span>`;
    }
    
    /**
     * Get case chain info HTML
     * @param {Object|null} caseChain - Case chain information
     * @returns {string} HTML string for case chain info
     */
    getCaseChainInfo(caseChain) {
        if (!caseChain) {
            return '';
        }
        
        return `<span class="case-chain-info" title="Enhanced from Case ${caseChain.previousCase}">🔗 Enhanced from Case ${caseChain.previousCase}</span>`;
    }
    
    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        // This function returns HTML string, not setting innerHTML
        // Create element, set textContent (escapes HTML), then return innerHTML
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML; // Safe: textContent already escaped any HTML
    }
}
