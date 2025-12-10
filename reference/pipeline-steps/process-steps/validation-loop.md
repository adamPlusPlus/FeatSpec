# Validation Loop

**Purpose**: Assess completeness of workflow step output and determine if iteration is needed.

**When to Invoke**: After any step that produces output (Research, Feature Extraction, App Analysis, Decomposition, Atomic Features, UX Specification)

**Input**: Output from the previous workflow step
**Output**: Decision (CONTINUE / ITERATE) with gap analysis

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **output from the previous workflow step** that you want to validate
- This should be the complete output from Research, Feature Extraction, App Analysis, Decomposition, Atomic Features, or UX Specification step
- The validation loop will assess completeness and identify gaps

**Tip**: Use "Paste from Previous" button to automatically copy the previous step's output.

---

## Prompt

Assess the completeness of the following workflow step output and determine if iteration is needed.

**Step Output**:
{PREVIOUS_OUTPUT}

**Step Context**:
- Step: {STEP_NAME}
- Case: {CASE}
- Modifiers: {MODIFIERS}

**Validation Tasks**:

1. **Assess Completeness**
   - Is the output complete for this step?
   - Are all required elements present?
   - Are all modifier-specific requirements met?
   - Is the output ready for the next step?

2. **Identify Gaps or Missing Information**
   - What information is missing?
   - What details are incomplete?
   - What aspects need more work?
   - What requirements are not met?

3. **Determine if Iteration is Needed**
   - Are gaps significant enough to require iteration?
   - Can missing information be inferred or skipped?
   - Would iteration improve output quality?
   - Is output acceptable to proceed?

4. **Make Decision**
   - CONTINUE: Output is complete and ready for next step
   - ITERATE: Return to previous step with gap information

**Decision Criteria**:
- **CONTINUE**: If output is complete, all requirements met, and gaps are minor
- **ITERATE**: If output is incomplete, critical gaps exist, or requirements not met

**Output Format**:
```markdown
## Validation Loop Report

### Completeness Assessment
- **Status**: [COMPLETE / INCOMPLETE]
- **Completeness Score**: [Percentage or High/Medium/Low]
- **Requirements Met**: [Count] / [Total]

### Gap Analysis
- **Critical Gaps**: [Missing critical information]
- **Important Gaps**: [Missing important details]
- **Minor Gaps**: [Missing nice-to-have details]

### Decision
- **Decision**: [CONTINUE / ITERATE]
- **Reasoning**: [Why this decision]
- **Next Steps**: 
  - If CONTINUE: [Proceed to next step]
  - If ITERATE: [Return to {STEP_NAME} with following gap information: [list of gaps]]
```

---

## Quality Criteria

- Completeness accurately assessed
- Gaps clearly identified and prioritized
- Decision is justified
- Gap information is actionable if iterating

