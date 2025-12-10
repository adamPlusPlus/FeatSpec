# App Analysis

**Purpose**: Create comprehensive feature inventory from extracted or observed features.

**Input**: Validated features from Validation step (or direct input if starting here)
**Output**: Feature inventory with user goals, interactions, visual indicators, and context
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Validation (or can be entry point for Case 3 enhancements)
- Next: Decomposition
- Process Steps: Validation Loop (after completion)

---

## Prompt

Analyze the following application and create a comprehensive feature inventory.

**Input Sources**:
- Extracted Features: {PREVIOUS_OUTPUT}
- Application Description: {INPUT_SOURCES}
- Existing Features: {EXISTING_FEATURES}

For each feature identified, provide:

1. **Feature Name**: Descriptive name of the feature
2. **Primary User Goal**: What the user is trying to accomplish
3. **Key Interactions**: What actions can the user take
4. **Visual Indicators**: What the user sees
5. **Context**: When/where this feature appears

**Analysis Guidelines**:
- Include both obvious and subtle features
- Group related features together
- Do not include implementation details
- Do not use platform-specific terminology
- Do not mix multiple features into one entry
- Do not skip minor or subtle features
- Use generic interaction terms (action1, action2, pointer, etc.) from terminology key

**Output Format**:
- List format with numbered features
- Each feature should be a distinct, user-facing capability
- Include both obvious and subtle features
- Group related features together

{PROCESS_STEP_TRIGGERS}

---

## Output Format

```markdown
## Feature Inventory

### Feature 1: [Feature Name]
- **User Goal**: [What user accomplishes]
- **Key Interactions**: [List of interactions]
- **Visual Indicators**: [What user sees]
- **Context**: [When/where it appears]

### Feature 2: [Feature Name]
...
```

---

## Quality Criteria

- All user-facing features identified
- No implementation details included
- Generic terminology used
- Clear feature boundaries
- Complete inventory for all accessible features

---

## Process Step Triggers

**Validation Loop**: After creating feature inventory
- Check inventory completeness
- Verify all accessible features are included
- Identify any missing features
- Decision: CONTINUE to Decomposition or ITERATE App Analysis

