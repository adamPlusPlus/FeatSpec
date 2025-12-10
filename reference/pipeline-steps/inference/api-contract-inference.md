# API Contract Inference from Interactions

**Purpose**: Infer API contracts from user interactions. Used as an Inference Step in Case 2 (UI/UX-Only Analysis) after Atomic Features step. This step is part of Case 2's inference phase, used when codebase is not available.

**Input**: 
- Atomic features: {PREVIOUS_OUTPUT}
- UX specifications: {UX_SPECIFICATIONS}

**Workflow Context**: 
- **Case**: Case 2 (UI/UX-Only Analysis)
- **Workflow Step**: Inference Step (after Atomic Features, Data Model Inference, and State Machine Inference, before Behavioral Implementation Specification)
- **Modifiers Used**: None (this is a post-atomic-features inference step)
- **Process Steps**: Validation Loop (after inference to check completeness)
- **Reference**: See [WORKFLOW-GUIDE.md](WORKFLOW-GUIDE.md) for complete workflow context

**Cross-Reference**: 
- Uses Atomic Features output from Case 2 Core Workflow
- Output feeds into Behavioral Implementation Specification (final inference step)
- Part of Case 2 inference phase (Data Model → State Machine → API Contract → Behavioral Implementation)
- Used when codebase is not available (UI/UX-only scenario)

---

## Prompt

```
Infer API contracts and operation signatures from user interactions and system responses.

Atomic Features: {PREVIOUS_OUTPUT}
UX Specifications: {UX_SPECIFICATIONS}

For each feature, infer:

1. **Operations**
   - What operations exist (from user actions)
   - Operation names (inferred from behavior)
   - Operation types (Create/Read/Update/Delete/Execute/Query)
   - Operation categories (CRUD, navigation, state management, etc.)

2. **Parameters**
   - Input parameters (from user input fields)
   - Parameter types (inferred from UI)
   - Required vs optional (from validation)
   - Parameter constraints (from validation rules)
   - Default values (from UI defaults)

3. **Return Values**
   - What data is returned (from UI updates)
   - Return types (inferred from displayed data)
   - Success/failure indicators
   - Error return values
   - Null/empty return cases

4. **Side Effects**
   - What changes as a result (from UI updates)
   - What other operations are affected
   - What state is modified
   - What events are triggered
   - What UI elements are updated

5. **Error Handling**
   - What errors can occur (from error messages)
   - Error types (from error UI)
   - Error recovery (from UI behavior)
   - Error propagation (from error handling flow)

6. **Operation Dependencies**
   - What operations depend on this one
   - What operations this one depends on
   - Operation ordering requirements
   - Preconditions and postconditions

**Inference Guidelines:**
- Base inferences on observable interactions
- Document confidence levels
- Note assumptions about operation behavior
- Identify synchronous vs asynchronous patterns
- Document timing requirements

**Output Format:**
```markdown
## API Contract Inference

### Feature: [Feature Name]
- **Feature ID**: [ID]
- **Confidence**: [High/Medium/Low]

#### Operations
- **Operation**: [Name]
  - **Type**: [CRUD/Execute/Query/etc.]
  - **Category**: [category]
  - **Confidence**: [High/Medium/Low]
  - **UI Evidence**: [how UI indicates this operation]

#### Parameters
- **Parameter**: [name]
  - **Type**: [inferredType]
  - **Required**: [Yes/No]
  - **Default**: [value if any]
  - **Constraints**: [validation rules]
  - **UI Evidence**: [UI element that represents this parameter]

#### Return Values
- **Return Type**: [inferredType]
  - **Success Case**: [what is returned on success]
  - **Failure Case**: [what is returned on failure]
  - **Null Case**: [when null/empty is returned]
  - **UI Evidence**: [how UI shows return value]

#### Side Effects
- **State Changes**: [list of state modifications]
- **UI Updates**: [list of UI elements updated]
- **Events Triggered**: [list of events]
- **Other Operations Affected**: [list]

#### Error Handling
- **Error Types**: [list of possible errors]
- **Error Messages**: [observed error messages]
- **Error Recovery**: [how errors are handled]
- **Error Propagation**: [how errors flow]

#### Dependencies
- **Depends On**: [list of prerequisite operations]
- **Required By**: [list of dependent operations]
- **Preconditions**: [what must be true before operation]
- **Postconditions**: [what is true after operation]

#### API Contract
```typescript
// Inferred API contract
operationName(
  param1: Type1,        // required
  param2?: Type2,       // optional
  param3: Type3 = defaultValue  // optional with default
): ReturnType {
  // Side effects: [list]
  // Errors: [list]
  // Preconditions: [list]
  // Postconditions: [list]
}
```

#### Assumptions
- [Assumption 1]: [reasoning]
- [Assumption 2]: [reasoning]

#### Ambiguities
- [Ambiguity 1]: [what's unclear]
- [Ambiguity 2]: [what's unclear]
```

**Quality Criteria:**
- All operations identified
- Parameters inferred with types
- Return types documented
- Side effects specified
- Error handling documented
- Dependencies mapped
- UI evidence provided
```

---

## Quality Checklist

- ✓ All operations identified from interactions
- ✓ Parameters inferred with types and constraints
- ✓ Return types documented
- ✓ Side effects specified
- ✓ Error handling documented
- ✓ Operation dependencies mapped
- ✓ API contracts defined
- ✓ Assumptions and ambiguities noted

---

## Cross-Reference

- **Input**: 
  - Atomic Features (from Case 2 Core Workflow)
  - UX Specifications (from Case 2 Core Workflow)
- **Output**: 
  - Inferred API contracts and operation signatures
  - Feeds into Behavioral Implementation Specification (final inference step)
- **Related**: 
  - Case 2 (UI/UX-Only Analysis) - this is an inference step in Case 2
  - Data Model Inference - previous inference step in Case 2
  - State Machine Inference - previous inference step in Case 2
  - Behavioral Implementation Specification - final inference step that consolidates all inferences
- **Workflow Position**: After State Machine Inference, before Behavioral Implementation Specification
- **Process Steps**: Validation Loop - after inference to check completeness

