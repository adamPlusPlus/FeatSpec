# Atomization

**Purpose**: Break down refined features into atomic elements using the feature specification system.

**Input**: Refined idea document from iterative refinement
**Output**: Rich atomic document with all atomic features fully specified
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Iterative Refinement
- Next: Flow Document, Architecture Document
- Process Steps: Validation Loop (after completion), Refinement Loop (if further decomposition needed)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Refined Idea Document** from the iterative refinement step
- This document contains all features that need to be atomized

**Tip**: The atomization process will break composite features into atomic elements following the feature specification system.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/atomization-output`
- **Files to Watch**: `atomization-draft.md`
- **Complete Files**: `atomization-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms
- **File Count**: 1

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Atomization Tasks**:

1. **Analyze Refined Features**
   - Review all features from refined idea document
   - Identify which are atomic vs. composite
   - Determine decomposition strategy
   - Identify feature relationships

2. **Decompose Composite Features**
   - Break composite features into atomic components
   - Identify atomic interactions
   - Define atomic feature boundaries
   - Ensure each atomic feature is self-contained

3. **Create Atomic Feature Descriptions**
   For each atomic feature:
   - Feature ID (using taxonomy)
   - User goal
   - Trigger (using terminology)
   - Interaction flow
   - Visual feedback
   - Timing
   - Edge cases
   - Error states

4. **Document Feature Relationships**
   - Map dependencies between features
   - Show how features compose
   - Document feature hierarchy
   - Note integration points

**Requirements**:
- Use ONLY terminology from feature-spec-reference.md (Part 1: Terminology)
- Classify features using taxonomy (Part 2: Feature Taxonomy)
- Follow quality metrics (Part 4: Quality Metrics & Validation)
- All features must be truly atomic (cannot be decomposed further)

**Output Format**:

```markdown
## Atomic Document

### Feature Taxonomy
[Overview of feature classification]

### Atomic Features

#### Feature: [Feature Name]
**Feature ID**: [category]-[type]-[name]-[version]
**User Goal**: [What user accomplishes]
**Trigger**: [action1/action2/etc. using terminology]
**Interaction Flow**:
1. User [action using terminology]
2. System [response]
...

**Visual Feedback**: [What user sees, using terminology]
**Timing**: [Durations, thresholds, using notation]
**Edge Cases**: [Unusual situations]
**Error States**: [Error handling]

**Dependencies**: [Other features this depends on]
**Composes With**: [Other features this combines with]

[Continue for all atomic features...]

### Feature Relationships
[Map showing how features relate and compose]
```

---

## Quality Criteria

- All features atomized
- Terminology compliance verified
- Taxonomy classification correct
- Feature relationships documented
- Ready for flow document and architecture document creation

