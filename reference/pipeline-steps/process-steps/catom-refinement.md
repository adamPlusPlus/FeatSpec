# cAtom Refinement

**Purpose**: Collaboratively refine and interpret cAtoms with the user to clarify their axiomatic foundations, anchors, and functional roles.

**When to Invoke**: 
- After Theoria step when cAtoms are extracted
- When cAtoms are ambiguous or need clarification
- When user wants to refine cAtom interpretations
- When cAtoms need to be validated or expanded

**Input**: cAtoms from previous steps (especially Theoria)
**Output**: Refined cAtoms with clarified foundations, anchors, and roles

**Collaboration Mode**: LLM presents findings and questions → User provides feedback → LLM refines

---

## Prompt

You are collaborating with the user to refine and interpret cAtoms. Present your analysis, ask clarifying questions, and refine based on user feedback.

**cAtoms to Refine:**
{CATOMS_TO_REFINE}

**Context:**
- Step: {STEP_NAME}
- Case: {CASE}
- Previous Steps: {PREVIOUS_STEPS}
- Modifiers: {MODIFIERS}

**User Feedback (if any):**
{USER_FEEDBACK}

---

## Refinement Process

### Phase 1: Analysis (LLM)

1. **Analyze Each cAtom**
   - **Interpret the Surface Statement**: What foundational premise does this statement actually represent?
   - **Extract the Axiomatic Core**: What non-negotiable assumption underlies this statement?
   - **Identify Context**: What context makes this a foundational claim rather than just an opinion?
   - **Assess Completeness**: Does the current cAtom capture the full axiomatic foundation, or is it just a surface statement?
   - **Evaluate Anchors**: What structures actually depend on this foundation?
   - **Note Ambiguities**: Which cAtoms are too literal, too vague, or missing their foundational core?

2. **Identify Refinement Needs**
   - **Surface-Level Issues**: Which cAtoms are just literal statements without interpreted foundations?
   - **Missing Interpretation**: Which need context to reveal their axiomatic nature?
   - **Vague Foundations**: Which are too generic or lack specificity?
   - **Incomplete Anchors**: Which don't clearly show what they anchor?
   - **Missing cAtoms**: Are there deeper foundations that should be extracted?

3. **Prepare Questions for User**
   - What needs user input to clarify?
   - What interpretations need validation?
   - What additional context is needed?

### Phase 2: Presentation (LLM → User)

Present your analysis and questions:

**Analysis Format:**
```markdown
## cAtom Refinement Analysis

### cAtom: [Name]
**Current Axiomatic Foundation:**
- [current statement]

**Current Anchors:**
- [what it currently anchors]

**Current Functional Role:**
- [current role description]

**Analysis:**
- **Surface Statement**: [the literal statement/quote]
- **Interpreted Foundation**: [what axiomatic foundation does this actually represent?]
- **Axiomatic Core**: [what non-negotiable assumption underlies this?]
- **Context Needed**: [what context makes this foundational?]
- **Clarity**: [Clear/Unclear/Too Literal/Needs Interpretation] - [why]
- **Completeness**: [Complete/Incomplete/Missing Core] - [what's missing]
- **Anchors**: [Well-defined/Unclear/Missing] - [what actually depends on this foundation?]
- **Functional Role**: [Clear/Needs elaboration] - [why is this an axiomatic foundation?]

**Issues Identified:**
- [Issue 1: e.g., "Too literal - needs interpretation of what foundational premise this represents"]
- [Issue 2: e.g., "Missing context - what makes this a non-negotiable assumption?"]
- [Issue 3: e.g., "Vague - needs specificity about what it actually anchors"]

**Questions for User:**
- [Question 1: e.g., "What foundational premise does 'overleaf-is-unacceptable' actually represent?"]
- [Question 2: e.g., "What context makes this an axiomatic foundation rather than just a preference?"]
- [Question 3: e.g., "What structures actually depend on this foundation?"]

**Suggested Refinements:**
- [Suggestion 1: e.g., "Refine to: 'Academic writing tools must support collaborative version control and seamless formatting'"]
- [Suggestion 2: e.g., "Add context: This anchors all academic document workflows"]
- [Suggestion 3: e.g., "Clarify functional role: This is non-negotiable because it determines what tools are acceptable for academic work"]

---

### cAtom: [Next Name]
...
```

### Phase 3: User Feedback

User provides feedback on:
- Clarifications needed
- Interpretations to validate
- Additional context
- Refinements to apply
- New cAtoms to create

### Phase 4: Refinement (LLM)

Based on user feedback, refine each cAtom:

**Refinement Tasks:**

1. **Interpret and Refine Axiomatic Foundations**
   - **Interpret Surface Statements**: Transform literal statements into their underlying axiomatic foundations
   - **Extract the Core Premise**: Identify what non-negotiable assumption the statement represents
   - **Add Context**: Provide the context that makes this a foundational claim
   - **Refine Based on User Input**: Incorporate user's interpretation and clarification
   - **Make Implicit Explicit**: Reveal hidden foundational premises
   - **Example Transformations**:
     - "overleaf-is-unacceptable" → "Academic writing tools must support collaborative version control and seamless formatting without requiring specialized editors"
     - "document is silly when db" → "Document formats that persist redundant information are structurally flawed when data is managed by a database"

2. **Expand Anchors**
   - Clarify what structures depend on this cAtom
   - Add missing anchors identified by user
   - Remove incorrect anchors

3. **Elaborate Functional Roles**
   - Explain why this statement functions as an axiomatic foundation
   - Describe what makes it non-negotiable
   - Clarify its foundational nature

4. **Create New cAtoms** (if user identifies them)
   - Extract new axiomatic foundations from user input
   - Identify their anchors
   - Define their functional roles

**Output Format:**
```markdown
## Refined cAtoms

### cAtom: [Name]
**Type:** `cAtom`
**Source:** [original source] + [refinement source]

**Original Surface Statement:**
- [the literal statement/quote that was extracted]

**Interpreted Axiomatic Foundation:**
- [the refined foundational statement that captures the underlying premise]
- [context that makes this a non-negotiable assumption]

**Axiomatic Core:**
- [the non-negotiable premise this represents]
- [why this is foundational rather than just an opinion or preference]

**Anchors:**
- [what structures, claims, or reasoning depend on this foundation]
- [what this foundation makes possible or constrains]

**Functional Role:**
- [why this functions as an axiomatic foundation]
- [what makes it non-negotiable]
- [its foundational nature in the system]

**Refinement Process:**
- **Interpretation Applied**: [how the surface statement was interpreted into a foundation]
- **Context Added**: [what context was added to reveal the foundation]
- **Changes Made**: [what was changed and why]
- **User Feedback Incorporated**: [how user feedback shaped the refinement]

---

### cAtom: [New Name] (if created)
**Type:** `cAtom`
**Source:** user feedback

**Axiomatic Foundation:**
- [new foundational statement]

**Anchors:**
- [what it anchors]

**Functional Role:**
- [why it functions as an axiomatic foundation]

**Creation Notes:**
- [why this cAtom was created]
- [user input that led to its creation]

---
```

---

## Quality Criteria

- cAtoms are clearly articulated as axiomatic foundations
- Anchors are well-defined and accurate
- Functional roles are explained
- User feedback is incorporated
- Refinements improve clarity without changing meaning
- New cAtoms (if created) follow the same structure

---

## Collaboration Guidelines

**For LLM:**
- **Interpret, Don't Just Quote**: Transform literal statements into their underlying axiomatic foundations
- **Identify the Core Premise**: Extract what non-negotiable assumption each statement represents
- **Add Context**: Provide context that makes each cAtom a foundational claim
- **Ask About Interpretation**: Ask user to validate interpretations of what foundational premises statements represent
- **Propose Concrete Refinements**: Suggest specific transformations from surface statements to foundations
- **Incorporate User Feedback**: Accurately incorporate user's interpretation and clarification
- **Don't Assume**: Ask when uncertain about what foundational premise a statement represents

**For User:**
- **Validate Interpretations**: Confirm or correct the LLM's interpretation of what foundational premise each statement represents
- **Provide Context**: Add context that makes statements into non-negotiable assumptions
- **Clarify Ambiguities**: Help resolve vague or literal statements
- **Guide Refinement**: Direct how surface statements should be transformed into coherent foundations
- **Identify Missing Foundations**: Point out deeper foundations that should be extracted
- **Ensure Coherence**: Ensure refined cAtoms are useful and coherent, not random literal statements

