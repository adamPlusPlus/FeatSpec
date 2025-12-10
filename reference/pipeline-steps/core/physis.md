# Physis

**Purpose**: Transform poiesis (creative expression) into physis (implementable form). Physis is the materialization of poiesis—the concrete, physical manifestation that can be used to create an actual application or system. It bridges the gap between creative expression and practical implementation.

**Input**: {USER_INPUT} or portions from previous steps ({PREVIOUS_OUTPUT}), especially from Poiesis
**Output**: Implementable specification document, concrete design, or physical blueprint
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**:

- Can link to: Theoria, Praxis, Doctrine, Poiesis
- Can be repeated to refine or expand the implementable form
- Previous steps: {PREVIOUS_STEPS}

---

## Input Guidance

**What to enter in the Input field:**

- **Poiesis output**: Enter the output from a Poiesis step to materialize it into an implementable form
- **Creative expressions**: Enter creative expressions, generative structures, or emergent forms that need to be made concrete
- **Portions from previous steps**: Reference Theoria (for conceptual grounding), Praxis (for method), Doctrine (for constraints), or Poiesis (for creative expression)
- **Mixed input**: Combine poiesis output with additional requirements or constraints
- **Empty input**: Begin with pure materialization pressure and let the implementable form emerge

**Tip**: Physis is the materialization of poiesis. It takes the creative expression and makes it concrete, implementable, and usable as a blueprint for creation. Physis is the **implementation mode** of creative expression.

**CRITICAL**: Your task is to **TRANSFORM** the poiesis (creative expression) into physis (implementable form). Extract the creative expression from the input and materialize it into a concrete, implementable specification that can be used to create an application or system.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/physis-output`
- **Files to Watch**: `physis-{AUTOMATION_ID}-draft.md`
- **Complete Files**: `physis-{AUTOMATION_ID}-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms (file must be unchanged for 10 seconds)
- **File Count**: 1

**Important Instructions for LLM Agents:**

1. **Create the target directory** as specified above
2. **Use the automation ID**: The automation ID for this step is `{AUTOMATION_ID}`. You MUST include this ID in all filenames.
3. **Start with draft files**: Begin writing to files with the pattern `physis-{AUTOMATION_ID}-draft.md` (replace `{AUTOMATION_ID}` with the actual ID shown above)
4. **Edit incrementally**: You may edit the draft file multiple times as you compose the document
5. **Signal completion**: When finished, create the file `physis-{AUTOMATION_ID}-complete.md` (replace `{AUTOMATION_ID}` with the actual ID)
6. **File stability**: The system waits for files to be stable (unchanged) before processing
7. **CRITICAL**: The automation ID must be included in the filename exactly as shown. Do not omit it or use a different format.

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Physis Tasks:**

**CRITICAL INSTRUCTION**: Your output must be an **implementable specification document** that can be used to create an application or system. Transform the poiesis (creative expression) from the input into concrete, material form.

1. **Extract Poiesis Elements** (from the input)
   - Identify creative expressions, generative structures, or emergent forms from Poiesis output
   - Extract the core creative impulse that needs to be materialized
   - Identify the expression form, content, style, and symbolic load that must be preserved

2. **Materialize into Implementable Form**
   - Transform creative expression into concrete specifications
   - Define physical structure, components, and architecture
   - Specify implementation requirements, constraints, and boundaries
   - Create material form that preserves the creative essence while being implementable

3. **Create Implementation Blueprint**
   - Define system architecture and component structure
   - Specify interfaces, data flows, and interaction patterns
   - Identify technology requirements and implementation constraints
   - Create a document that can be directly used to build the application

4. **Preserve Creative Essence**
   - Ensure the implementable form maintains the creative impulse from poiesis
   - Preserve symbolic meaning and expressive qualities in material form
   - Bridge the gap between creative expression and practical implementation

5. **Link to Source Poiesis**
   - Reference the poiesis cNodes that were materialized
   - Show how creative expression maps to implementable form
   - Document the transformation from poiesis to physis

**Output Format:**

```markdown
## Physis Specification Document

### Overview

**Source Poiesis**: [Reference to poiesis cNodes that were materialized]
**Purpose**: [What this implementable form will create]
**Target Application**: [Type of application or system to be built]

---

### Implementation Architecture

#### System Structure
- **Components**: [List of main components]
- **Architecture Pattern**: [Architectural approach]
- **Technology Stack**: [Technologies required]

#### Data Model
- **Entities**: [Data entities and their relationships]
- **Data Flow**: [How data moves through the system]

#### Interface Specifications
- **User Interfaces**: [UI components and interactions]
- **API Interfaces**: [API endpoints and contracts]
- **Integration Points**: [External system integrations]

---

### Materialized Components

#### Component: [Component Name]
**Source Poiesis**: [Which poiesis cNode this materializes]
**Purpose**: [What this component does]
**Specification**: [Concrete implementation details]
**Dependencies**: [What this component depends on]

---

### Implementation Requirements

#### Functional Requirements
- [Requirement 1]
- [Requirement 2]

#### Non-Functional Requirements
- **Performance**: [Performance requirements]
- **Scalability**: [Scalability requirements]
- **Security**: [Security requirements]

#### Constraints
- [Constraint 1]
- [Constraint 2]

---

### Implementation Roadmap

#### Phase 1: [Phase Name]
- [Task 1]
- [Task 2]

#### Phase 2: [Phase Name]
- [Task 1]
- [Task 2]

---

### Transformation Mapping

**Poiesis → Physis Mapping**:
- [Poiesis cNode] → [Physis Component]
- [Creative Expression] → [Concrete Implementation]

**Preserved Elements**:
- [What creative essence is preserved in the material form]

**Materialized Elements**:
- [What new concrete elements were added for implementation]
```

---

## Quality Criteria

- Poiesis elements clearly identified and referenced
- Implementable form is concrete and actionable
- Architecture and components are well-defined
- Implementation requirements are clear and complete
- Creative essence is preserved in material form
- Document can be directly used to create the application
- Transformation from poiesis to physis is documented
- Ready for use in another case to create the application

---

## Linking Instructions

**To use this Physis in other cases:**

- **For Case 1 (Codebase Analysis)**: Use this physis as input to analyze existing codebase
- **For Case 2 (UI/UX Analysis)**: Use this physis to guide UI/UX analysis
- **For Case 3 (User Input)**: Use this physis to structure user input collection
- **For Case 4 (Input Preparation)**: Use this physis to prepare structured inputs
- **For Implementation**: Use this physis document directly to build the application

**To reference previous steps:**

- Use specific sections from previous Theoria, Praxis, Doctrine, or Poiesis outputs
- Reference the poiesis cNodes that were materialized into this physis

