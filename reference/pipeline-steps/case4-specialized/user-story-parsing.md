# User Story Parsing

**Purpose**: Specialized parsing instructions for structured user stories in standard format.

**Input**: User stories (As a... I want... So that...)
**Output**: Structured parsed user story data

---

## Specialized Instructions

When parsing user stories:

1. **Parse Standard Format**
   - Extract actor (As a...)
   - Extract action (I want...)
   - Extract benefit (So that...)
   - Extract acceptance criteria (if present)
   - Extract priority (if present)

2. **Extract Structured Information**
   - **Actor**: User role or persona
   - **Action**: Desired functionality
   - **Benefit**: Expected outcome or value
   - **Acceptance Criteria**: Conditions for completion
   - **Priority**: Importance level

3. **Identify Implicit Information**
   - Infer data entities from action
   - Infer interaction patterns from action
   - Infer visual elements from action
   - Infer error scenarios from acceptance criteria

4. **Map to Feature Components**
   - Map actor to user role
   - Map action to feature goal
   - Map benefit to feature value
   - Map acceptance criteria to feature requirements

