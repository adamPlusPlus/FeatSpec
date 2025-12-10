# Complete Implementation Specification

**Purpose**: Create a comprehensive, production-ready implementation specification that provides complete structure, specificity, detailed scope, and rules for LLM-based implementation.

**Input**: Architecture document, pseudocode document, atomic document, and detailed pseudocode (if available)
**Output**: Complete implementation specification with all details needed for single-pass LLM implementation
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Pseudocode Document (and Detailed Pseudocode if used)
- Next: (Final output - ready for LLM implementation)
- Process Steps: Validation Loop (after completion)

**Note**: This step consolidates and expands all previous documents into a single, comprehensive specification that eliminates ambiguity and provides complete structure for LLM implementation.

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Architecture Document** output
- Paste the **Pseudocode Document** output
- Paste the **Atomic Document** output
- If **Detailed Pseudocode** was created, paste it as well
- This step will create a unified, complete specification

**Tip**: This is the final consolidation step that ensures nothing is missing for implementation.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/implementation-specification-output`
- **Files to Watch**: `implementation-specification-draft.md`
- **Complete Files**: `implementation-specification-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms
- **File Count**: 1

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Implementation Specification Creation Tasks**:

1. **Consolidate All Documents**
   - Merge architecture, pseudocode, and atomic documents
   - Resolve any contradictions or inconsistencies
   - Ensure all information is present and complete
   - Create unified structure

2. **Complete State Machine Definitions**
   - Define ALL states for every component
   - Define ALL state transitions with conditions
   - Define ALL state entry/exit actions
   - Document state persistence requirements
   - Include state diagrams or detailed state tables

3. **Complete Data Structure Specifications**
   - Define ALL data structures with complete field definitions
   - Specify ALL data types, constraints, and validation rules
   - Define ALL data relationships and references
   - Specify ALL default values and initialization
   - Document ALL data transformations

4. **Complete Algorithm Specifications**
   - Specify ALL algorithms step-by-step
   - Include ALL edge cases and special conditions
   - Define ALL input validation rules
   - Specify ALL output validation rules
   - Document ALL error conditions and handling
   - Include ALL performance optimizations

5. **Complete Business Logic Rules**
   - Define ALL business rules and constraints
   - Specify ALL calculations and formulas
   - Define ALL conditional logic (if/then/else)
   - Specify ALL validation rules
   - Document ALL transformation rules

6. **Complete API Specifications**
   - Define ALL method signatures with complete types
   - Specify ALL parameters with constraints and validation
   - Define ALL return types and possible values
   - Document ALL preconditions and postconditions
   - Specify ALL error codes and conditions
   - Document ALL side effects

7. **Complete Error Handling Specifications**
   - Define ALL possible error conditions
   - Specify ALL error codes and meanings
   - Define ALL error recovery strategies
   - Document ALL error propagation paths
   - Specify ALL error logging requirements

8. **Complete Integration Specifications**
   - Define ALL component interactions in detail
   - Specify ALL data flow between components
   - Document ALL event flows
   - Define ALL callback mechanisms
   - Specify ALL synchronization points

9. **Complete Validation Rules**
   - Define ALL input validation rules
   - Specify ALL output validation rules
   - Define ALL data validation rules
   - Specify ALL business rule validations
   - Document ALL validation error messages

10. **Complete Testing Requirements**
    - Define ALL unit test requirements
    - Specify ALL integration test requirements
    - Define ALL edge case test scenarios
    - Specify ALL error case test scenarios
    - Document ALL performance test requirements

**Critical Requirements for LLM Implementation**:

- **NO AMBIGUITY**: Every detail must be explicitly specified
- **NO GAPS**: Every possible case must be covered
- **COMPLETE STRUCTURE**: Every component, method, and data structure fully defined
- **COMPLETE RULES**: Every validation, constraint, and business rule specified
- **COMPLETE SCOPE**: Every feature, edge case, and error condition documented
- **COMPLETE SPECIFICITY**: Every type, constraint, and value explicitly defined

**Output Format**:

```markdown
## Complete Implementation Specification

### Document Overview
[Overview of the complete specification and its organization]

### Table of Contents
[Complete table of contents with links to all sections]

---

## 1. System Architecture

### 1.1 High-Level Architecture
[Complete system architecture description]

### 1.2 Component Overview
[Complete list of all components with brief descriptions]

### 1.3 Architecture Principles
[All architectural principles and constraints]

---

## 2. Complete Component Specifications

### 2.1 Component: [Component Name]

#### 2.1.1 Purpose and Responsibilities
[Complete description of component purpose and all responsibilities]

#### 2.1.2 Complete Data Structures
```
[ALL data structures with complete field definitions]

Structure ComponentData:
    field1: Type1
        Description: [Complete description]
        Constraints: [All constraints]
        Default: [Default value]
        Validation: [All validation rules]
        Example: [Example value]
    
    field2: Type2
        ...
```

#### 2.1.3 Complete State Machine
```
[Complete state machine definition]

States:
    - State1: [Complete description]
        Entry Actions: [All entry actions]
        Exit Actions: [All exit actions]
        Persistence: [Persistence requirements]
    
    - State2: [Complete description]
        ...

Transitions:
    - State1 -> State2
        Condition: [Complete condition specification]
        Actions: [All actions during transition]
        Guard: [All guard conditions]
    
    - State2 -> State3
        ...
```

#### 2.1.4 Complete API Specification
```
[ALL methods with complete specifications]

function methodName(
    param1: Type1,           // [Complete description]
        Constraints: [All constraints]
        Validation: [All validation rules]
        Example: [Example value]
    param2: Type2,           // [Complete description]
        ...
): ReturnType | ErrorCode

Purpose: [Complete purpose description]

Preconditions:
    - [Precondition 1]: [Complete specification]
    - [Precondition 2]: [Complete specification]
    ...

Postconditions:
    - [Postcondition 1]: [Complete guarantee]
    - [Postcondition 2]: [Complete guarantee]
    ...

Side Effects:
    - [Side effect 1]: [Complete description]
    - [Side effect 2]: [Complete description]
    ...

Error Conditions:
    - ErrorCode1: [When it occurs - complete specification]
        Recovery: [Recovery strategy]
        Logging: [Logging requirements]
    - ErrorCode2: [When it occurs - complete specification]
        ...

Returns:
    - Success: [Return value description with all possible values]
    - Error: [Error code and complete description]

Thread Safety:
    - [Complete thread safety guarantees]
    - [Concurrency notes]

Performance:
    - Time Complexity: [O notation with explanation]
    - Space Complexity: [O notation with explanation]
    - Constraints: [All performance requirements]

Example Usage:
    [Complete example with all scenarios]
```

#### 2.1.5 Complete Algorithm Specifications
```
[ALL algorithms with complete step-by-step specifications]

Algorithm: algorithmName
Input: [Complete input specification]
Output: [Complete output specification]

Steps:
    1. [Step 1 - complete specification]
        Conditions: [All conditions]
        Actions: [All actions]
        Error Handling: [All error cases]
    
    2. [Step 2 - complete specification]
        ...
    
    3. [Step 3 - complete specification]
        ...

Edge Cases:
    - Edge Case 1: [Complete specification]
        Handling: [Complete handling]
    - Edge Case 2: [Complete specification]
        ...

Error Handling:
    - Error Case 1: [Complete specification]
        Recovery: [Recovery strategy]
    - Error Case 2: [Complete specification]
        ...

Performance Considerations:
    - [All performance optimizations]
    - [All performance constraints]
```

#### 2.1.6 Complete Business Logic Rules
```
[ALL business logic rules]

Rule: ruleName
    Condition: [Complete condition specification]
    Action: [Complete action specification]
    Priority: [Priority if multiple rules apply]
    Validation: [All validation requirements]
    Error Handling: [All error cases]

[Continue for all business rules...]
```

#### 2.1.7 Complete Validation Rules
```
[ALL validation rules]

Validation: validationName
    Target: [What is validated]
    Rules: [All validation rules]
    Error Messages: [All error messages]
    Recovery: [Recovery actions]

[Continue for all validations...]
```

#### 2.1.8 Complete Error Handling
```
[ALL error handling specifications]

Error: ErrorCode
    Condition: [When it occurs - complete specification]
    Detection: [How it is detected]
    Handling: [Complete handling strategy]
    Recovery: [Recovery strategy]
    Logging: [Logging requirements]
    User Notification: [If applicable]

[Continue for all errors...]
```

#### 2.1.9 Complete Integration Points
```
[ALL integration points with complete specifications]

Integration: integrationName
    Component: [Component name]
    Method: [Method name]
    Data Flow: [Complete data flow specification]
    Events: [All events]
    Callbacks: [All callbacks]
    Synchronization: [All synchronization points]
    Error Propagation: [All error propagation paths]

[Continue for all integrations...]
```

[Continue for all components...]

---

## 3. Complete Feature Implementations

### 3.1 Feature: [Feature Name] (from Atomic Document)

#### 3.1.1 Feature Overview
[Complete feature description from atomic document]

#### 3.1.2 Complete Implementation Flow
```
[Complete step-by-step implementation flow]

1. [Step 1 - complete specification]
    Component: [Component name]
    Method: [Method name]
    Input: [Complete input]
    Output: [Complete output]
    Error Handling: [All error cases]
    
2. [Step 2 - complete specification]
    ...

[Continue for all steps...]
```

#### 3.1.3 Complete Component Interactions
```
[Complete component interaction specification]

Interaction: interactionName
    Components: [All components involved]
    Data Flow: [Complete data flow]
    Events: [All events]
    Sequence: [Complete sequence diagram or description]
    Error Handling: [All error cases]

[Continue for all interactions...]
```

#### 3.1.4 Complete State Changes
```
[Complete state change specification]

State Change: stateChangeName
    From State: [State name]
    To State: [State name]
    Condition: [Complete condition]
    Actions: [All actions]
    Side Effects: [All side effects]
    Error Handling: [All error cases]

[Continue for all state changes...]
```

#### 3.1.5 Complete Edge Case Handling
```
[ALL edge cases with complete specifications]

Edge Case: edgeCaseName
    Condition: [Complete condition specification]
    Detection: [How it is detected]
    Handling: [Complete handling strategy]
    User Feedback: [All user feedback]
    Error Handling: [All error cases]

[Continue for all edge cases...]
```

#### 3.1.6 Complete Error Handling
```
[ALL error cases with complete specifications]

Error: errorName
    Condition: [When it occurs - complete specification]
    Detection: [How it is detected]
    Handling: [Complete handling strategy]
    Recovery: [Recovery strategy]
    User Notification: [Complete user notification]
    Logging: [Logging requirements]

[Continue for all errors...]
```

[Continue for all features...]

---

## 4. Complete Data Specifications

### 4.1 All Data Structures
[Complete specification of all data structures with all fields, types, constraints, validation, defaults, examples]

### 4.2 All Data Relationships
[Complete specification of all data relationships, references, and dependencies]

### 4.3 All Data Transformations
[Complete specification of all data transformations with complete algorithms]

### 4.4 All Data Validation Rules
[Complete specification of all data validation rules]

---

## 5. Complete Integration Specifications

### 5.1 All Component Interactions
[Complete specification of all component interactions]

### 5.2 All Event Flows
[Complete specification of all event flows]

### 5.3 All Data Flows
[Complete specification of all data flows]

### 5.4 All Synchronization Points
[Complete specification of all synchronization points]

---

## 6. Complete Error Handling System

### 6.1 All Error Codes
[Complete specification of all error codes with meanings, conditions, recovery]

### 6.2 All Error Recovery Strategies
[Complete specification of all error recovery strategies]

### 6.3 All Error Propagation Paths
[Complete specification of all error propagation paths]

### 6.4 All Error Logging Requirements
[Complete specification of all error logging requirements]

---

## 7. Complete Validation System

### 7.1 All Input Validation Rules
[Complete specification of all input validation rules]

### 7.2 All Output Validation Rules
[Complete specification of all output validation rules]

### 7.3 All Data Validation Rules
[Complete specification of all data validation rules]

### 7.4 All Business Rule Validations
[Complete specification of all business rule validations]

---

## 8. Complete Testing Requirements

### 8.1 All Unit Test Requirements
[Complete specification of all unit test requirements with test cases]

### 8.2 All Integration Test Requirements
[Complete specification of all integration test requirements with test cases]

### 8.3 All Edge Case Test Scenarios
[Complete specification of all edge case test scenarios]

### 8.4 All Error Case Test Scenarios
[Complete specification of all error case test scenarios]

### 8.5 All Performance Test Requirements
[Complete specification of all performance test requirements]

---

## 9. Complete Performance Specifications

### 9.1 All Performance Requirements
[Complete specification of all performance requirements]

### 9.2 All Performance Constraints
[Complete specification of all performance constraints]

### 9.3 All Performance Optimizations
[Complete specification of all performance optimizations]

---

## 10. Complete Security Specifications

### 10.1 All Security Requirements
[Complete specification of all security requirements]

### 10.2 All Security Patterns
[Complete specification of all security patterns]

### 10.3 All Security Validations
[Complete specification of all security validations]

---

## 11. Implementation Checklist

### 11.1 Component Implementation Checklist
[Complete checklist for implementing each component]

### 11.2 Feature Implementation Checklist
[Complete checklist for implementing each feature]

### 11.3 Integration Checklist
[Complete checklist for implementing all integrations]

### 11.4 Testing Checklist
[Complete checklist for all testing requirements]

### 11.5 Validation Checklist
[Complete checklist for all validation requirements]

---

## 12. Quick Reference

### 12.1 All Components
[Quick reference of all components]

### 12.2 All Methods
[Quick reference of all methods]

### 12.3 All Data Structures
[Quick reference of all data structures]

### 12.4 All Error Codes
[Quick reference of all error codes]

### 12.5 All Validation Rules
[Quick reference of all validation rules]
```

---

## Quality Criteria

- **NO AMBIGUITY**: Every detail explicitly specified
- **NO GAPS**: Every possible case covered
- **COMPLETE STRUCTURE**: Every component, method, and data structure fully defined
- **COMPLETE RULES**: Every validation, constraint, and business rule specified
- **COMPLETE SCOPE**: Every feature, edge case, and error condition documented
- **COMPLETE SPECIFICITY**: Every type, constraint, and value explicitly defined
- Ready for single-pass LLM implementation without hallucination

