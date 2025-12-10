# Implementation Specification Generation

**Purpose**: Generate modular, platform-agnostic implementation specification.

**Input**: Validated UX specification (UX Outline Validation) + Dependency map (Dependency Analysis)
**Output**: Complete implementation specification
**Cross-Reference**: Uses Dependency Analysis output. Output feeds into Implementation Spec Validation

**Prompt:**

```
Create a detailed implementation specification for the following feature.

UX Specification:
[OUTPUT_FROM_SECTION_5]

Dependency Map:
[OUTPUT_FROM_SECTION_6]

Reference Documents:
- Terminology: feature-spec-reference.md (Part 1: Terminology)
- Taxonomy: feature-spec-reference.md (Part 2: Feature Taxonomy)
- Dependencies: feature-spec-reference.md (Part 3: Dependency Mapping)
- Quality Metrics: feature-spec-reference.md (Part 4: Quality Metrics & Validation)

Critical Requirements:

1. **Modularity**
   - Each component must be independently removable
   - Components communicate only through well-defined interfaces
   - No hidden dependencies or side effects
   - Components can be tested in isolation

2. **Platform-Agnostic**
   - Use pseudocode, not real code
   - No platform-specific APIs or frameworks
   - No language-specific syntax
   - Focus on structure and relationships, not syntax

3. **Integration Approach**
   - Assume existing codebase with unknown architecture
   - Integration through minimal interface (Adapter pattern)
   - Clear integration points (what app must implement)
   - Document what feature provides vs requires

4. **Abstraction Level**
   - Describe data structures generically (Element, Position, Event)
   - Describe algorithms conceptually
   - Use pseudocode for complex logic
   - Focus on behavior, not implementation details

Document Structure:

1. **Architecture Overview**
   - System layers
   - Component relationships
   - Data flow

2. **Core Components**
   For each component:
   - Purpose
   - Structure (pseudocode)
   - Responsibilities
   - Interfaces (input/output)

3. **State Management**
   - State machine definition
   - State transitions
   - State persistence
   - Error states

4. **Event System**
   - Event types
   - Event flow
   - Event handlers
   - Event ordering

5. **Data Structures**
   - Generic data structures
   - Relationships
   - Operations

6. **Algorithms**
   - Conceptual descriptions
   - Pseudocode where needed
   - Input/output specifications

7. **Integration Interface** (Note: Interface details will be extracted and formalized in Integration Interface Definition step, so keep this section concise. The formalized interface document will supersede this section in the final assembly.)
   - Required interface (what app must provide)
   - Provided interface (what feature provides)
   - Contract specifications

8. **Module System**
   - Feature modules
   - Module registration
   - Module dependencies
   - Module lifecycle

Pseudocode Guidelines:
- Use generic types (Element, Position, Event, State)
- Use descriptive function names
- Use comments for complex logic
- Focus on structure, not syntax
- Avoid platform-specific concepts

Example Pseudocode Style:
```
function handleHoldDetection(position: Position): Event {
    // Check if hold threshold reached
    if (holdDuration >= holdThreshold) {
        return createEvent(HOLD_THRESHOLD_REACHED, position)
    }
    return null
}
```

NOT:
```
function onTouchStart(e: TouchEvent) {  // ❌ Platform-specific
    if (Date.now() - startTime > 500) {  // ❌ Platform API
        dispatch(new CustomEvent('hold'));  // ❌ Platform API
    }
}
```

Output Format:
- Complete implementation specification
- Ready for validation (Implementation Spec Validation)
- Self-contained (can implement from specification)
- Follows structure of example: ios-home-screen-hold-to-edit-implementation.md

Quality Checklist:
- ✓ Modular components (independent removal)
- ✓ Platform-agnostic (no platform assumptions)
- ✓ Clear interfaces (required and provided)
- ✓ State machine defined
- ✓ Event system defined
- ✓ Integration points clear
- ✓ Pseudocode only (no real code)
```

**Output Format:**
```markdown
# [Feature Name] Implementation Specification

## Architecture Overview
[System structure]

## Core Components
[Component specifications]

## State Management
[State machine]

## Event System
[Event flow]

## Data Structures
[Generic structures]

## Integration Interface
[Required and provided interfaces]

...
```

**Quality Criteria:**
- Modular components
- Platform-agnostic
- Clear interfaces
- Complete state machine
- Complete event system

**Cross-Reference**: Output feeds into Implementation Spec Validation (Implementation Spec Validation)

---