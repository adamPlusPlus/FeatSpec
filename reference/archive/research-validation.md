# Research Validation and Gap Analysis

**Purpose**: Validate extracted features and determine if additional research is needed.

**Input**: Extracted features from Research Loopb

**Prompt:**

```
Validate the extracted features and determine research completeness.

Extracted Features:
[OUTPUT_FROM_SECTION_R2]

Reference Documents:
- Quality Metrics: feature-spec-reference.md (Part 4: Quality Metrics & Validation)
- Validation Rules: feature-spec-reference.md (Part 4: Quality Metrics & Validation)

Validation Tasks:

1. **Completeness Check**
   For each extracted feature:
   - Is interaction flow complete?
   - Are timing values specified?
   - Are visual properties documented?
   - Are edge cases covered?
   - Are error states handled?

2. **Terminology Check**
   - Are all terms from master terminology?
   - Are platform-specific terms converted?
   - Is notation correct (term[parameter:value])?

3. **Confidence Assessment**
   - High confidence: Complete information, clear documentation
   - Medium confidence: Most information present, some gaps
   - Low confidence: Significant gaps, unclear documentation

4. **Gap Identification**
   - What information is missing?
   - Which features need more research?
   - What additional sources should be checked?

5. **Research Continuation Decision**
   - Are gaps significant enough to require more research?
   - Can missing information be inferred?
   - Should research loop continue or proceed to Feature Discovery?

Output Format:
```markdown
## Research Validation Report

### Completeness Assessment
- **High Confidence Features**: [Count] - [List]
- **Medium Confidence Features**: [Count] - [List]
- **Low Confidence Features**: [Count] - [List]

### Terminology Validation
- **Status**: [PASS/FAIL/NEEDS_REVISION]
- **Issues**: [If any]
- **Recommendations**: [How to fix]

### Gap Analysis
- **Critical Gaps**: [Missing critical information]
- **Important Gaps**: [Missing important details]
- **Minor Gaps**: [Missing nice-to-have details]

### Research Continuation Decision
- **Decision**: [CONTINUE_RESEARCH / PROCEED_TO_SECTION_0 / MIXED]
- **Reasoning**: [Why]
- **Next Steps**: 
  - If CONTINUE_RESEARCH: [What to research next]
  - If PROCEED_TO_SECTION_0: [Use extracted features as-is]
  - If MIXED: [High confidence features proceed, low confidence need more research]
```

Decision Criteria:
- **CONTINUE_RESEARCH**: If >30% features have low confidence or critical gaps
- **PROCEED_TO_SECTION_0**: If >70% features have high/medium confidence
- **MIXED**: If some features complete, others need research
```

**Output Format:**
```markdown
## Research Validation Report

### Completeness Assessment
[Confidence breakdown]

### Terminology Validation
[Validation results]

### Gap Analysis
[Missing information]

### Research Continuation Decision
[Decision and next steps]
```

**Quality Criteria:**
- All features validated
- Gaps clearly identified
- Clear decision on continuation
- Ready for next step

**Cross-Reference**: 
- If CONTINUE_RESEARCH: Return to Research Loopa with specific research targets
- If PROCEED_TO_SECTION_0: Use extracted features in Section 1
- If MIXED: Proceed with high-confidence features, continue research for others

---