# Flow Document Generation

**Purpose**: Create a plain-language flow document describing every action and how it works in human speech.

**Input**: Atomic document from atomic document step
**Output**: Complete flow document in plain human language
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Atomic Document
- Next: Architecture Document
- Process Steps: Validation Loop (after completion)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Atomic Document** output from the atomization step
- This document contains all atomic features that need to be described in flow format

**Tip**: The flow document should be readable by non-technical stakeholders.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/flow-document-output`
- **Files to Watch**: `flow-document-draft.md`
- **Complete Files**: `flow-document-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms
- **File Count**: 1

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Flow Document Creation Tasks**:

1. **Parse Atomic Features**
   - Review all atomic features from input
   - Understand feature relationships and dependencies
   - Identify user workflows and interaction flows

2. **Create Flow Descriptions**
   For each atomic feature and workflow:
   - Describe in plain, human language
   - Explain what happens step-by-step
   - Describe user actions and system responses
   - Explain the "why" behind each action
   - Use conversational, accessible language

3. **Organize by Workflow**
   - Group related features into workflows
   - Show how features connect and flow together
   - Describe complete user journeys
   - Show decision points and branches

4. **Add Context**
   - Explain when each flow is used
   - Describe prerequisites
   - Note any special conditions
   - Explain outcomes and results

**Writing Guidelines**:
- Use plain language (avoid technical jargon)
- Write in second person ("You do X, then Y happens")
- Be conversational and accessible
- Explain the "why" not just the "what"
- Use examples and scenarios
- Break complex flows into smaller steps

**Output Format**:

```markdown
## Flow Document

### Overview
[High-level description of the system and its purpose]

### Workflow 1: [Workflow Name]
**When**: [When this workflow is used]
**Purpose**: [What the user accomplishes]

**Flow**:
1. You [action description]
   - The system [response description]
   - This happens because [explanation]

2. Then you [next action]
   - The system [response]
   - This allows you to [outcome]

[Continue for all steps...]

**Outcome**: [What the user accomplishes]

### Workflow 2: [Workflow Name]
...

### Feature Flows

#### Feature: [Feature Name]
**What it does**: [Plain language description]

**How it works**:
- You [action]
- The system [response]
- This enables [capability]

[Continue for all features...]
```

---

## Quality Criteria

- All features described in plain language
- Workflows clearly explained
- Step-by-step flows complete
- Accessible to non-technical readers
- Ready for architecture document creation

