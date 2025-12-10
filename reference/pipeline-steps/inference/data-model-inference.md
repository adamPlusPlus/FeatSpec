# Data Model Inference from UI/UX

**Purpose**: Infer data structures from UI observations. Used as an Inference Step in Case 2 (UI/UX-Only Analysis) after Atomic Features step. This step is part of Case 2's inference phase, used when codebase is not available.

**Input**: 
- Atomic features: {PREVIOUS_OUTPUT}
- UX specifications: {UX_SPECIFICATIONS}

**Workflow Context**: 
- **Case**: Case 2 (UI/UX-Only Analysis)
- **Workflow Step**: Inference Step (after Atomic Features, before Behavioral Implementation Specification)
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
Infer data models and structures from UI/UX observations for the following features.

Atomic Features: {PREVIOUS_OUTPUT}
UX Specifications: {UX_SPECIFICATIONS}

For each feature, infer:

1. **Data Entities**
   - What data objects exist (from UI fields, lists, displays)
   - Entity properties (from visible fields)
   - Entity relationships (from UI connections)
   - Entity identifiers (from UI behavior)

2. **Data Types**
   - Types inferred from UI (text fields = string, numbers = int/float, etc.)
   - Validation constraints (from error messages, input restrictions)
   - Default values (from initial UI state)
   - Nullable vs required (from UI validation behavior)

3. **Data Structures**
   - Collections (lists, dictionaries) inferred from UI
   - Nested structures (from hierarchical UI)
   - Optional vs required fields (from UI validation)
   - Indexed vs keyed access (from UI interaction patterns)

4. **State Data**
   - What state is tracked (from UI state changes)
   - State transitions (from UI behavior)
   - State persistence (from save/load behavior)
   - State scope (global, session, local)

5. **Data Flow**
   - Data sources (where data comes from)
   - Data transformations (how data changes)
   - Data destinations (where data goes)
   - Data validation points (where validation occurs)

6. **Data Relationships**
   - One-to-one relationships (from UI connections)
   - One-to-many relationships (from lists, collections)
   - Many-to-many relationships (from complex UI)
   - Hierarchical relationships (from tree structures)

**Inference Guidelines:**
- Base inferences on observable UI behavior
- Document confidence level (High/Medium/Low)
- Note assumptions made
- Identify ambiguous cases
- Reference specific UI elements when possible

**Output Format:**
```markdown
## Data Model Inference

### Feature: [Feature Name]
- **Feature ID**: [ID]
- **Confidence**: [High/Medium/Low]

#### Data Entities
- **Entity**: [Name]
  - **Properties**: 
    - [propertyName]: [inferredType] (required/optional, default: [value])
    - [propertyName]: [inferredType] (required/optional, default: [value])
  - **Relationships**: 
    - [relationshipType]: [relatedEntity]
  - **Validation**: [constraints inferred from UI]
  - **UI Evidence**: [specific UI elements that indicate this entity]

#### Data Structures
- **Structure**: [Name]
  - **Type**: [List/Dictionary/Object/Array]
  - **Fields**: 
    - [fieldName]: [type] (required/optional)
  - **Access Pattern**: [indexed/keyed/iterated]
  - **UI Evidence**: [how UI indicates this structure]

#### State Data
- **State**: [Name]
  - **Properties**: [list of state properties]
  - **Transitions**: 
    - [fromState] → [toState] (trigger: [action])
  - **Persistence**: [saved/loaded/transient/session]
  - **Scope**: [global/session/local]
  - **UI Evidence**: [how UI shows state changes]

#### Data Flow
- **Source**: [where data originates]
- **Transformations**: 
  - [transformation step]: [what changes]
- **Destination**: [where data ends up]
- **Validation Points**: [where validation occurs]

#### Relationships
- **Relationship**: [Name]
  - **Type**: [one-to-one/one-to-many/many-to-many/hierarchical]
  - **Entities**: [entity1] ↔ [entity2]
  - **UI Evidence**: [how UI shows relationship]

#### Assumptions
- [Assumption 1]: [reasoning]
- [Assumption 2]: [reasoning]

#### Ambiguities
- [Ambiguity 1]: [what's unclear, possible interpretations]
- [Ambiguity 2]: [what's unclear, possible interpretations]
```

**Quality Criteria:**
- All visible data captured
- Types inferred from UI with confidence levels
- Relationships identified
- State transitions documented
- Assumptions and ambiguities noted
- UI evidence provided for inferences
```

---

## Quality Checklist

- ✓ All data entities identified from UI
- ✓ Data types inferred with confidence levels
- ✓ Data structures documented
- ✓ State data and transitions captured
- ✓ Data flow mapped
- ✓ Relationships identified
- ✓ Assumptions documented
- ✓ Ambiguities noted
- ✓ UI evidence provided

---

## Cross-Reference

- **Input**: 
  - Atomic Features (from Case 2 Core Workflow)
  - UX Specifications (from Case 2 Core Workflow)
- **Output**: 
  - Inferred data models and structures
  - Feeds into Behavioral Implementation Specification (final inference step)
- **Related**: 
  - Case 2 (UI/UX-Only Analysis) - this is an inference step in Case 2
  - State Machine Inference - next inference step in Case 2
  - API Contract Inference - next inference step in Case 2
  - Behavioral Implementation Specification - final inference step that consolidates all inferences
- **Workflow Position**: After Atomic Features, before State Machine Inference
- **Process Steps**: Validation Loop - after inference to check completeness

