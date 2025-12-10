# Input Structuring

**Purpose**: Structure organized input into standardized formats suitable for injection into pipeline steps.

**Input**: {PREVIOUS_OUTPUT}
**Output**: Structured input files organized by target pipeline step
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Input Organization
- Next: Output Mapping
- Process Steps: Validation Loop (after completion)

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Structuring Tasks**:

1. **Map to Pipeline Steps**
   - Identify which information belongs to Research step
   - Identify which information belongs to Feature Extraction step
   - Identify which information belongs to App Analysis step
   - Identify which information belongs to Decomposition step
   - Identify which information belongs to Atomic Features step
   - Identify which information belongs to UX Specification step

2. **Create Structured Outputs**
   For each target pipeline step:
   - Format information according to step requirements
   - Include relevant context and relationships
   - Preserve temporal information (if applicable)
   - Include source references
   - Include confidence indicators

3. **Standardize Formats**
   - Use consistent terminology
   - Use consistent structure
   - Include metadata (source, confidence, timestamps)
   - Include cross-references

**Output Format**:
```markdown
## Structured Input Files

### For Research Step
```json
{
  "sources": [
    {
      "id": "source-1",
      "type": "user-description",
      "content": "[Original content]",
      "parsed": {
        "goals": [...],
        "actions": [...],
        "data": [...]
      },
      "confidence": "high"
    }
  ],
  "keyFindings": [...],
  "gaps": [...],
  "nextSteps": [...]
}
```

### For Feature Extraction Step
```json
{
  "featureCandidates": [
    {
      "id": "feature-1",
      "name": "[Name]",
      "goals": [...],
      "actions": [...],
      "data": [...],
      "patterns": [...],
      "confidence": "high",
      "sources": ["source-1", "source-2"]
    }
  ],
  "relationships": [...],
  "gaps": [...]
}
```

### For App Analysis Step
```json
{
  "features": [
    {
      "id": "feature-1",
      "name": "[Name]",
      "description": "[Description]",
      "goals": [...],
      "keyInteractions": [...],
      "visualIndicators": [...],
      "context": "[Context]"
    }
  ]
}
```

### For Decomposition Step
```json
{
  "features": [
    {
      "id": "feature-1",
      "components": [
        {
          "id": "component-1",
          "type": "action",
          "description": "[Description]",
          "input": "[Input]",
          "output": "[Output]",
          "userExperience": "[UX description]"
        }
      ]
    }
  ]
}
```

### For Atomic Features Step
```json
{
  "atomicFeatures": [
    {
      "id": "atomic-1",
      "userGoal": "[Goal]",
      "trigger": "[Trigger]",
      "interactionFlow": [...],
      "visualFeedback": [...],
      "timing": "[Timing]",
      "edgeCases": [...],
      "errorStates": [...]
    }
  ]
}
```

### For UX Specification Step
```json
{
  "uxSpecification": {
    "interactions": [...],
    "visualFeedback": [...],
    "timing": [...],
    "stateChanges": [...],
    "edgeCases": [...],
    "errorHandling": [...]
  }
}
```

### Metadata
- Created: [Timestamp]
- Source: [Input sources]
- Processing confidence: [High/Medium/Low]
- Completeness: [High/Medium/Low]
```

**Quality Criteria**:
- All organized information is structured
- Formats match target pipeline step requirements
- Information is complete and consistent
- Metadata is included
- Cross-references are maintained
- Temporal information is preserved

