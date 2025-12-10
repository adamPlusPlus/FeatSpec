# Architecture Document Generation

**Purpose**: Create a rich architecture document that references the atomic document and describes system structure.

**Input**: Atomic document from atomic document step
**Output**: Complete architecture document with system structure, components, and relationships
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Atomic Document, Flow Document
- Next: Pseudocode Document
- Process Steps: Validation Loop (after completion)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Atomic Document** output from the atomization step
- Optionally paste the **Flow Document** for context
- The architecture should implement all features described in the atomic document

**Tip**: The architecture document should be platform-agnostic and focus on structure, not implementation details.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/architecture-document-output`
- **Files to Watch**: `architecture-document-draft.md`
- **Complete Files**: `architecture-document-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms
- **File Count**: 1

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Architecture Document Creation Tasks**:

1. **Analyze Atomic Features**
   - Review all atomic features from input
   - Identify feature groupings and relationships
   - Determine architectural patterns needed
   - Identify shared components and services

2. **Design System Structure**
   - Define high-level architecture
   - Identify major components/modules
   - Define component responsibilities
   - Establish component interfaces (with method signatures)
   - Design data flow and communication patterns
   - Define error handling architecture
   - Design state management approach
   - Plan event system design

3. **Map Features to Architecture**
   - Show how each atomic feature maps to components
   - Define component interactions for each feature
   - Show data flow for feature execution
   - Identify shared services and utilities
   - Map error handling requirements
   - Identify performance requirements

4. **Document Architecture**
   - System overview and design principles
   - Component descriptions and responsibilities
   - Interface definitions (with method signatures)
   - Data structures and models
   - Communication patterns
   - Feature-to-component mapping
   - Error handling architecture
   - State management approach
   - Event system design
   - Platform integration points (if applicable)

**Architecture Principles**:
- Modular and composable
- Platform-agnostic (use pseudocode concepts)
- Clear separation of concerns
- Well-defined interfaces
- Scalable and maintainable

**Output Format**:

```markdown
## Architecture Document

### System Overview
[High-level description of system architecture and design principles]

### Architecture Diagram
[Textual or structural description of system architecture]

### Components

#### Component: [Component Name]
**Purpose**: [What this component does]
**Responsibilities**:
- [Responsibility 1]
- [Responsibility 2]
...

**Interfaces**:
```
functionName(param1: Type1, param2: Type2): ReturnType
    Description: [What this does]
    Preconditions: [Required conditions]
    Postconditions: [Guaranteed results]
    Error Handling: [Error codes and conditions]
```

**Dependencies**: [Other components this depends on]

**Features Implemented**:
- References to atomic features: [Feature IDs]
- How features are implemented: [Description]

**Error Handling**:
- Error codes: [List of error codes this component can produce]
- Recovery strategies: [How errors are handled]

### Data Structures
[Platform-agnostic data structure definitions with complete types]

### Communication Patterns
[How components interact]
- Event system design
- Message passing patterns
- Synchronous vs. asynchronous communication

### State Management
[State management approach]
- State structure
- State transitions
- State persistence

### Error Handling Architecture
[System-wide error handling approach]
- Error code system
- Error propagation patterns
- Recovery strategies

### Platform Abstraction Points
[If applicable]
- Abstract system operations (platform-agnostic)
- Generic integration points
- External dependencies (described abstractly)

Note: All platform operations should be described in abstract terms.
Do NOT reference specific platforms or APIs.

### Feature-to-Component Mapping
[Table or list showing which components implement which atomic features]

### Performance Requirements
[Performance constraints and requirements]

### Security Considerations
[Security architecture and requirements]
```

---

## Quality Criteria

- All atomic features mapped to architecture
- Components clearly defined
- Interfaces well-specified
- Architecture is modular and scalable
- Ready for pseudocode generation

