# Idea Capture

**Purpose**: Capture and structure the initial idea, whether it's a formatted design document or a rough concept.

**Input**: {USER_INPUT} - Can be a formatted design document, rough idea, user story, or unstructured description
**Output**: Structured idea document with key concepts, goals, and initial feature identification
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: (Entry point)
- Next: Documentation Review
- Process Steps: Validation Loop (after completion)

---

## Input Guidance

**What to enter in the Input field:**

- **Formatted Design Document**: Paste a complete design document, specification, or requirements document
- **Rough Idea**: Paste a rough concept, user story, feature request, or unstructured description
- **Existing Documentation**: Paste links to or content from existing documentation that describes the idea
- **Mixed Input**: Combine any of the above

**Tip**: The more detail you provide initially, the fewer interrogation cycles will be needed later.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/idea-capture-output`
- **Files to Watch**: `idea-capture-draft.md`
- **Complete Files**: `idea-capture-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms (file must be unchanged for 10 seconds)
- **File Count**: 1

**Important Instructions for LLM Agents:**

1. **Create the target directory** as specified above
2. **Start with draft files**: Begin writing to files with `-draft` suffix
3. **Edit incrementally**: You may edit the draft file multiple times as you compose the document
4. **Signal completion**: When finished, rename the file to use `-complete` suffix
5. **File stability**: The system waits for files to be stable (unchanged) before processing

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Idea Capture Tasks**:

1. **Parse Input**
   - Identify input type (formatted document, rough idea, mixed)
   - Extract key concepts and goals
   - Identify stated features or capabilities
   - Note any constraints or requirements mentioned

2. **Structure the Idea**
   - **Core Concept**: What is the main idea or goal?
   - **User Goals**: What problems does this solve? What do users accomplish?
   - **Key Features**: What capabilities are mentioned or implied?
   - **Constraints**: Any technical, business, or design constraints?
   - **Context**: Where/how would this be used?

3. **Initial Feature Identification**
   - List all features mentioned (even if vague)
   - Note which features are well-defined vs. unclear
   - Identify relationships between features
   - Flag areas that need clarification

4. **Gap Analysis**
   - What information is missing?
   - What needs clarification?
   - What assumptions are being made?
   - What questions should be asked in user interrogation?

**Output Format**:

```markdown
## Idea Capture Summary

### Core Concept
[Clear statement of the main idea]

### User Goals
- [Goal 1]
- [Goal 2]
...

### Key Features Identified
1. **[Feature Name]**
   - Description: [What it does]
   - Clarity: [Well-defined / Vague / Needs clarification]
   - Dependencies: [Other features it relates to]

2. **[Feature Name]**
   ...

### Constraints
- [Constraint 1]
- [Constraint 2]
...

### Context
[Where/how this would be used]

### Gap Analysis
**Missing Information:**
- [Gap 1]
- [Gap 2]
...

**Questions for User Interrogation:**
- [Question 1]
- [Question 2]
...

**Assumptions Made:**
- [Assumption 1]
- [Assumption 2]
...
```

---

## Quality Criteria

- All key concepts extracted
- Features identified (even if vague)
- Gaps clearly identified
- Questions for user interrogation prepared
- Ready for documentation review and user interrogation phases

