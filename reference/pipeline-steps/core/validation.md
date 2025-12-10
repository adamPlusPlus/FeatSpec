# Validation

**Purpose**: Validate extracted features for completeness, terminology compliance, and quality.

**Input**: Extracted features from Feature Extraction step
**Output**: Validation report with completeness assessment, terminology check, gap analysis, and continuation decision
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Feature Extraction
- Next: App Analysis (if validation passes) or return to Feature Extraction (if validation fails)
- Process Steps: Validation Loop (this step itself)

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Validation Tasks**:

1. **Completeness Check**
   For each extracted feature:
   - Is interaction flow complete?
   - Are timing values specified?
   - Are visual properties documented?
   - Are edge cases covered?
   - Are error states handled?

2. **Terminology Check**
   - Are all terms from master terminology (feature-spec-reference.md Part 1)?
   - Are platform-specific terms converted?
   - Is notation correct (term[parameter:value])?

3. **Confidence Assessment**
   - High confidence: Complete information, clear sources
   - Medium confidence: Most information present, some gaps
   - Low confidence: Significant gaps, unclear sources

4. **Gap Identification**
   - What information is missing?
   - Which features need more work?
   - What additional sources should be checked?

5. **Validation Decision**
   - Are gaps significant enough to require iteration?
   - Can missing information be inferred?
   - Should workflow continue or return to previous step?

**Validation Guidelines**:
- Cross-reference with available sources based on active modifiers
- Validate against implementation (if codebase available)
- Validate against UI observations (if UI-only)
- Validate against existing features (if enhancing)
- Use quality metrics from feature-spec-reference.md (Part 4)

{PROCESS_STEP_TRIGGERS}

---

## Output Format

```markdown
## Validation Report

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

### Validation Decision
- **Decision**: [CONTINUE / ITERATE]
- **Reasoning**: [Why]
- **Next Steps**: 
  - If CONTINUE: [Proceed to App Analysis]
  - If ITERATE: [Return to Feature Extraction with gap information]
```

---

## Quality Criteria

- All features validated
- Gaps clearly identified
- Terminology compliance verified
- Clear decision on continuation
- Ready for next step or iteration

---

## Process Step Triggers

**Validation Loop**: This step IS the validation loop
- Assess completeness of extracted features
- Identify gaps or missing information
- Determine if iteration is needed
- Decision: CONTINUE to App Analysis or ITERATE Feature Extraction

