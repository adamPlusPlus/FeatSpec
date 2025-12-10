# Atomic Document Generation

**Purpose**: Format and finalize the rich atomic document from atomization output.

**Input**: Atomization output (atomic features)
**Output**: Final rich atomic document with all atomic features fully specified
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Atomization
- Next: Flow Document, Architecture Document
- Process Steps: Validation Loop (after completion)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Atomization** output from the previous step
- This contains all atomic features that need to be formatted into the final atomic document

**Tip**: This step formats and validates the atomic features into the final rich atomic document.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/atomic-document-output`
- **Files to Watch**: `atomic-document-draft.md`
- **Complete Files**: `atomic-document-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms
- **File Count**: 1

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Atomic Document Creation Tasks**:

1. **Review Atomization Output**
   - Review all atomic features from atomization step
   - Verify terminology compliance
   - Check taxonomy classification
   - Validate feature completeness

2. **Format Atomic Document**
   - Organize features by category/type
   - Create comprehensive feature descriptions
   - Include all required information for each feature
   - Add feature relationship diagrams/maps

3. **Enrich with Details**
   - Add any missing details
   - Expand feature descriptions where needed
   - Include examples and use cases
   - Document feature interactions

4. **Finalize Document**
   - Ensure all features are truly atomic
   - Verify all terminology is correct
   - Check taxonomy classifications
   - Validate against quality metrics

**Requirements**:
- Use ONLY terminology from feature-spec-reference.md (Part 1: Terminology)
- Classify features using taxonomy (Part 2: Feature Taxonomy)
- Follow quality metrics (Part 4: Quality Metrics & Validation)
- All features must be truly atomic (cannot be decomposed further)

**Output Format**:

```markdown
## Atomic Document

### Document Overview
[Overview of all atomic features and their organization]

### Feature Taxonomy
[Overview of feature classification and organization]

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
**Haptic/Audio Feedback**: [If applicable]
**Timing**: [Durations, thresholds, using notation]
**Edge Cases**: [Unusual situations]
**Error States**: [Error handling]

**Dependencies**: [Other features this depends on]
**Composes With**: [Other features this combines with]

[Continue for all atomic features...]

### Feature Relationships
[Comprehensive map showing how features relate and compose]

### Feature Index
[Index of all features by ID, name, and category]
```

---

## Quality Criteria

- All features properly formatted
- Terminology compliance verified
- Taxonomy classification correct
- Feature relationships documented
- Ready for flow document and architecture document creation
