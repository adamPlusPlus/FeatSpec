# Iterative Refinement

**Purpose**: Refine the idea through multiple iterations, incorporating documentation findings and user interrogation results.

**Input**: User interrogation summary and documentation review
**Output**: Refined idea document with clarified features and requirements
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: User Interrogation
- Next: Atomization
- Process Steps: Validation Loop (after completion), Refinement Loop (if complex elements found)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **User Interrogation Summary** from the previous step
- Paste the **Documentation Review** findings
- The system will refine the idea based on all gathered information

**Tip**: This step may iterate multiple times. Each iteration refines the understanding further.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/iterative-refinement-output`
- **Files to Watch**: `refinement-iteration-draft.md`
- **Complete Files**: `refinement-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms
- **File Count**: 1

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Iterative Refinement Tasks**:

1. **Synthesize All Inputs**
   - Combine idea capture, documentation review, and user interrogation
   - Resolve contradictions
   - Fill remaining gaps
   - Integrate all information

2. **Refine Feature Descriptions**
   - Update feature descriptions with new clarity
   - Add missing details
   - Clarify ambiguous areas
   - Define feature boundaries

3. **Identify Complex Elements**
   - Identify features that need further decomposition
   - Note composite features
   - Flag areas needing atomization
   - Identify dependencies

4. **Prepare for Atomization**
   - Organize features for atomization
   - Group related features
   - Identify atomic vs. composite features
   - Prepare feature hierarchy

**Output Format**:

```markdown
## Refined Idea Document

### Core Concept (Refined)
[Updated and clarified core concept]

### User Goals (Refined)
- [Refined goal 1]
- [Refined goal 2]
...

### Refined Feature Descriptions

#### Feature: [Feature Name]
**Description**: [Clarified description]
**User Goal**: [What user accomplishes]
**Interactions**: [User interactions]
**Behavior**: [How it works]
**Edge Cases**: [Edge cases identified]
**Dependencies**: [Other features it depends on]
**Complexity**: [Atomic / Composite / Needs decomposition]

[Continue for all features...]

### Feature Hierarchy
[How features relate and group together]

### Ready for Atomization
[List of features ready to be atomized]
```

---

## Quality Criteria

- All information synthesized
- Features clearly described
- Complex elements identified
- Ready for atomization phase

