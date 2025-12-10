/**
 * Specification Quality Checker
 * 
 * Validates specification documents for:
 * - Completeness (all required sections present)
 * - Specificity (no vague terms)
 * - Consistency (no contradictions)
 * - Coverage (all edge cases mentioned)
 */

class SpecQualityChecker {
    constructor() {
        this.issues = [];
        this.scores = {
            completeness: 0,
            specificity: 0,
            consistency: 0,
            coverage: 0,
            overall: 0
        };
        
        // Vague terms to flag
        this.vagueTerms = [
            'maybe', 'perhaps', 'might', 'could', 'possibly',
            'some', 'various', 'several', 'many', 'few',
            'etc', 'and so on', 'similar', 'like',
            'appropriate', 'suitable', 'reasonable', 'adequate',
            'as needed', 'when necessary', 'if required'
        ];
        
        // Required sections for Complete Implementation Specification
        this.requiredSections = [
            'System Architecture',
            'Complete Component Specifications',
            'Complete Feature Implementations',
            'Complete Data Specifications',
            'Complete Integration Specifications',
            'Complete Error Handling System',
            'Complete Validation System',
            'Complete Testing Requirements'
        ];
        
        // Required subsections per component
        this.requiredComponentSubsections = [
            'Purpose and Responsibilities',
            'Complete Data Structures',
            'Complete State Machine',
            'Complete API Specification',
            'Complete Algorithm Specifications',
            'Complete Business Logic Rules',
            'Complete Validation Rules',
            'Complete Error Handling',
            'Complete Integration Points'
        ];
    }
    
    /**
     * Check specification quality
     */
    checkQuality(specText) {
        this.issues = [];
        this.scores = {
            completeness: 0,
            specificity: 0,
            consistency: 0,
            coverage: 0,
            overall: 0
        };
        
        // Run all checks
        this.checkCompleteness(specText);
        this.checkSpecificity(specText);
        this.checkConsistency(specText);
        this.checkCoverage(specText);
        
        // Calculate overall score
        this.scores.overall = (
            this.scores.completeness * 0.3 +
            this.scores.specificity * 0.3 +
            this.scores.consistency * 0.2 +
            this.scores.coverage * 0.2
        );
        
        return {
            scores: this.scores,
            issues: this.issues,
            passed: this.scores.overall >= 80
        };
    }
    
    /**
     * Check completeness - all required sections present
     */
    checkCompleteness(specText) {
        const missingSections = [];
        let foundSections = 0;
        
        for (const section of this.requiredSections) {
            const regex = new RegExp(`##?\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
            if (regex.test(specText)) {
                foundSections++;
            } else {
                missingSections.push(section);
                this.issues.push({
                    type: 'completeness',
                    severity: 'high',
                    message: `Missing required section: ${section}`,
                    section: section
                });
            }
        }
        
        // Check component subsections
        const componentMatches = specText.match(/##\s+Component:\s+([^\n]+)/g) || [];
        for (const match of componentMatches) {
            const componentName = match.replace(/##\s+Component:\s+/, '').trim();
            for (const subsection of this.requiredComponentSubsections) {
                const regex = new RegExp(`###?\\s+${subsection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
                if (!regex.test(specText)) {
                    this.issues.push({
                        type: 'completeness',
                        severity: 'medium',
                        message: `Component "${componentName}" missing subsection: ${subsection}`,
                        component: componentName,
                        subsection: subsection
                    });
                }
            }
        }
        
        // Check for method signatures
        const methodSignaturePattern = /function\s+\w+\s*\([^)]*\)\s*:/g;
        const methodCount = (specText.match(methodSignaturePattern) || []).length;
        if (methodCount === 0) {
            this.issues.push({
                type: 'completeness',
                severity: 'high',
                message: 'No method signatures found in specification'
            });
        }
        
        // Check for data structures
        const dataStructurePattern = /Structure\s+\w+|struct\s+\w+|class\s+\w+/gi;
        const dataStructureCount = (specText.match(dataStructurePattern) || []).length;
        if (dataStructureCount === 0) {
            this.issues.push({
                type: 'completeness',
                severity: 'high',
                message: 'No data structures found in specification'
            });
        }
        
        // Calculate completeness score
        const sectionScore = (foundSections / this.requiredSections.length) * 100;
        const methodScore = methodCount > 0 ? 100 : 0;
        const dataStructureScore = dataStructureCount > 0 ? 100 : 0;
        
        this.scores.completeness = (sectionScore * 0.5 + methodScore * 0.25 + dataStructureScore * 0.25);
    }
    
    /**
     * Check specificity - no vague terms
     */
    checkSpecificity(specText) {
        const vagueTermMatches = [];
        const lines = specText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase();
            
            for (const vagueTerm of this.vagueTerms) {
                const regex = new RegExp(`\\b${vagueTerm}\\b`, 'i');
                if (regex.test(lowerLine)) {
                    vagueTermMatches.push({
                        line: i + 1,
                        term: vagueTerm,
                        context: line.trim()
                    });
                }
            }
        }
        
        // Check for incomplete specifications
        const incompletePatterns = [
            /\[.*?\]/g,  // Placeholder brackets
            /TODO/i,
            /TBD/i,
            /FIXME/i,
            /XXX/i
        ];
        
        const incompleteMatches = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of incompletePatterns) {
                if (pattern.test(line)) {
                    incompleteMatches.push({
                        line: i + 1,
                        context: line.trim()
                    });
                }
            }
        }
        
        // Report issues
        for (const match of vagueTermMatches.slice(0, 20)) { // Limit to first 20
            this.issues.push({
                type: 'specificity',
                severity: 'medium',
                message: `Vague term found: "${match.term}"`,
                line: match.line,
                context: match.context
            });
        }
        
        for (const match of incompleteMatches.slice(0, 20)) {
            this.issues.push({
                type: 'specificity',
                severity: 'high',
                message: 'Incomplete specification (placeholder or TODO)',
                line: match.line,
                context: match.context
            });
        }
        
        // Calculate specificity score
        const totalLines = lines.length;
        const vagueLineCount = new Set(vagueTermMatches.map(m => m.line)).size;
        const incompleteLineCount = new Set(incompleteMatches.map(m => m.line)).size;
        
        const vagueScore = Math.max(0, 100 - (vagueLineCount / totalLines * 100 * 10));
        const incompleteScore = Math.max(0, 100 - (incompleteLineCount / totalLines * 100 * 20));
        
        this.scores.specificity = (vagueScore * 0.6 + incompleteScore * 0.4);
    }
    
    /**
     * Check consistency - no contradictions
     */
    checkConsistency(specText) {
        const contradictions = [];
        
        // Check for conflicting type definitions
        const typeDefinitions = {};
        const typePattern = /(\w+):\s*(\w+)/g;
        let match;
        while ((match = typePattern.exec(specText)) !== null) {
            const fieldName = match[1];
            const typeName = match[2];
            if (typeDefinitions[fieldName] && typeDefinitions[fieldName] !== typeName) {
                contradictions.push({
                    type: 'consistency',
                    severity: 'high',
                    message: `Conflicting type for "${fieldName}": ${typeDefinitions[fieldName]} vs ${typeName}`
                });
            }
            typeDefinitions[fieldName] = typeName;
        }
        
        // Check for conflicting error codes
        const errorCodes = {};
        const errorCodePattern = /(ErrorCode|ERROR)_(\w+)\s*=\s*(\d+)/gi;
        while ((match = errorCodePattern.exec(specText)) !== null) {
            const codeName = match[2];
            const codeValue = match[3];
            if (errorCodes[codeName] && errorCodes[codeName] !== codeValue) {
                contradictions.push({
                    type: 'consistency',
                    severity: 'high',
                    message: `Conflicting error code value for "${codeName}": ${errorCodes[codeName]} vs ${codeValue}`
                });
            }
            errorCodes[codeName] = codeValue;
        }
        
        // Check for method signature conflicts
        const methodSignatures = {};
        const methodPattern = /function\s+(\w+)\s*\([^)]*\)\s*:\s*([^\n]+)/g;
        while ((match = methodPattern.exec(specText)) !== null) {
            const methodName = match[1];
            const returnType = match[2].trim();
            if (methodSignatures[methodName] && methodSignatures[methodName] !== returnType) {
                contradictions.push({
                    type: 'consistency',
                    severity: 'high',
                    message: `Conflicting return type for method "${methodName}": ${methodSignatures[methodName]} vs ${returnType}`
                });
            }
            methodSignatures[methodName] = returnType;
        }
        
        // Report contradictions
        for (const contradiction of contradictions) {
            this.issues.push(contradiction);
        }
        
        // Calculate consistency score
        const contradictionCount = contradictions.length;
        this.scores.consistency = Math.max(0, 100 - (contradictionCount * 10));
    }
    
    /**
     * Check coverage - all edge cases mentioned
     */
    checkCoverage(specText) {
        const coverageIssues = [];
        
        // Check for edge case sections
        const edgeCasePattern = /edge\s+case|edge\s+cases/i;
        const hasEdgeCaseSection = edgeCasePattern.test(specText);
        
        if (!hasEdgeCaseSection) {
            coverageIssues.push({
                type: 'coverage',
                severity: 'medium',
                message: 'No edge case section found'
            });
        }
        
        // Check for error handling sections
        const errorHandlingPattern = /error\s+handling|error\s+states|error\s+codes/i;
        const hasErrorHandling = errorHandlingPattern.test(specText);
        
        if (!hasErrorHandling) {
            coverageIssues.push({
                type: 'coverage',
                severity: 'high',
                message: 'No error handling section found'
            });
        }
        
        // Check for validation sections
        const validationPattern = /validation|validate|constraint/i;
        const hasValidation = validationPattern.test(specText);
        
        if (!hasValidation) {
            coverageIssues.push({
                type: 'coverage',
                severity: 'medium',
                message: 'No validation section found'
            });
        }
        
        // Check for state machine definitions
        const stateMachinePattern = /state\s+machine|states?:|state\s+transition/i;
        const hasStateMachine = stateMachinePattern.test(specText);
        
        // Count edge cases mentioned
        const edgeCaseCount = (specText.match(/edge\s+case/gi) || []).length;
        const errorCaseCount = (specText.match(/error\s+case|error\s+condition/gi) || []).length;
        
        // Report issues
        for (const issue of coverageIssues) {
            this.issues.push(issue);
        }
        
        if (edgeCaseCount < 3) {
            this.issues.push({
                type: 'coverage',
                severity: 'medium',
                message: `Only ${edgeCaseCount} edge case(s) mentioned - consider adding more`
            });
        }
        
        if (errorCaseCount < 5) {
            this.issues.push({
                type: 'coverage',
                severity: 'medium',
                message: `Only ${errorCaseCount} error case(s) mentioned - consider adding more`
            });
        }
        
        // Calculate coverage score
        let score = 0;
        if (hasEdgeCaseSection) score += 25;
        if (hasErrorHandling) score += 25;
        if (hasValidation) score += 25;
        if (hasStateMachine) score += 25;
        
        // Bonus for multiple edge/error cases
        score += Math.min(10, edgeCaseCount * 2);
        score += Math.min(10, errorCaseCount * 2);
        
        this.scores.coverage = score;
    }
    
    /**
     * Generate quality report
     */
    generateReport(specText) {
        const result = this.checkQuality(specText);
        
        const report = {
            summary: {
                overallScore: Math.round(result.scores.overall),
                passed: result.passed,
                completeness: Math.round(result.scores.completeness),
                specificity: Math.round(result.scores.specificity),
                consistency: Math.round(result.scores.consistency),
                coverage: Math.round(result.scores.coverage)
            },
            issues: {
                high: result.issues.filter(i => i.severity === 'high'),
                medium: result.issues.filter(i => i.severity === 'medium'),
                low: result.issues.filter(i => i.severity === 'low')
            },
            recommendations: this.generateRecommendations(result)
        };
        
        return report;
    }
    
    /**
     * Generate recommendations based on issues
     */
    generateRecommendations(result) {
        const recommendations = [];
        
        if (result.scores.completeness < 80) {
            recommendations.push({
                priority: 'high',
                category: 'completeness',
                message: 'Add missing required sections to improve completeness',
                action: 'Review required sections list and add missing ones'
            });
        }
        
        if (result.scores.specificity < 80) {
            recommendations.push({
                priority: 'high',
                category: 'specificity',
                message: 'Replace vague terms with specific details',
                action: 'Search for vague terms and replace with concrete specifications'
            });
        }
        
        if (result.scores.consistency < 80) {
            recommendations.push({
                priority: 'high',
                category: 'consistency',
                message: 'Resolve contradictions in the specification',
                action: 'Review identified contradictions and standardize definitions'
            });
        }
        
        if (result.scores.coverage < 80) {
            recommendations.push({
                priority: 'medium',
                category: 'coverage',
                message: 'Add more edge cases and error handling',
                action: 'Consider all possible failure modes and edge conditions'
            });
        }
        
        const highPriorityIssues = result.issues.filter(i => i.severity === 'high');
        if (highPriorityIssues.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'critical',
                message: `${highPriorityIssues.length} high-priority issues need attention`,
                action: 'Address high-priority issues before using specification for implementation'
            });
        }
        
        return recommendations;
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpecQualityChecker;
} else if (typeof window !== 'undefined') {
    window.SpecQualityChecker = SpecQualityChecker;
}

