# State Machine Inference from UI Behavior

**Purpose**: Infer state machines from UI behavior. Used as an Inference Step in Case 2 (UI/UX-Only Analysis) after Atomic Features step. This step is part of Case 2's inference phase, used when codebase is not available.

**Input**: 
- Atomic features: {PREVIOUS_OUTPUT}
- UX specifications: {UX_SPECIFICATIONS}

**Workflow Context**: 
- **Case**: Case 2 (UI/UX-Only Analysis)
- **Workflow Step**: Inference Step (after Atomic Features and Data Model Inference, before Behavioral Implementation Specification)
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
Infer state machines from UI behavior and state changes for the following features.

Atomic Features: {PREVIOUS_OUTPUT}
UX Specifications: {UX_SPECIFICATIONS}

For each feature, infer:

1. **States**
   - All UI states observed (from visual changes)
   - State properties (what differs between states)
   - Initial state (from default UI)
   - Terminal states (from end conditions)
   - Intermediate states (from transition points)

2. **Transitions**
   - Trigger actions (what causes state change)
   - Transition conditions (when transitions occur)
   - Transition effects (what changes during transition)
   - Transition timing (duration, delays)
   - Guard conditions (when transitions are allowed)

3. **State Properties**
   - What data is associated with each state
   - What UI elements are visible/hidden in each state
   - What actions are available in each state
   - What feedback is provided in each state

4. **State Hierarchy**
   - Parent/child state relationships
   - Parallel states (if any)
   - State groups
   - Nested states

5. **State Persistence**
   - Which states are persisted
   - Which states are transient
   - State restoration behavior

**Inference Guidelines:**
- Observe all UI state changes
- Document state entry/exit behaviors
- Note state-specific UI configurations
- Identify state transition triggers
- Document timing and conditions
- Note confidence levels for inferred states

**Output Format:**
```markdown
## State Machine Inference

### Feature: [Feature Name]
- **Feature ID**: [ID]
- **Confidence**: [High/Medium/Low]

#### States
- **State**: [Name]
  - **Properties**: [list of state-specific properties]
  - **UI Elements**: 
    - Visible: [list]
    - Hidden: [list]
    - Enabled: [list]
    - Disabled: [list]
  - **Available Actions**: [list of actions available in this state]
  - **Feedback**: [what feedback is provided]
  - **Initial**: [Yes/No]
  - **Terminal**: [Yes/No]
  - **Persistent**: [Yes/No]
  - **UI Evidence**: [how UI indicates this state]

#### Transitions
- **Transition**: [From State] → [To State]
  - **Trigger**: [action/event that causes transition]
  - **Condition**: [when transition occurs]
  - **Guard**: [conditions that must be met]
  - **Effect**: [what changes during transition]
  - **Duration**: [timing information]
  - **Animation**: [visual transition if any]
  - **UI Evidence**: [how UI shows transition]

#### State Hierarchy
- **Parent State**: [Name]
  - **Child States**: [list]
  - **Parallel States**: [list if any]
  - **State Groups**: [list if any]

#### State Persistence
- **Persisted States**: [list]
- **Transient States**: [list]
- **Restoration**: [how states are restored]
- **Persistence Scope**: [global/session/local]

#### State Diagram
```
[State Name] --[Trigger/Condition]--> [Next State]
```

#### Assumptions
- [Assumption 1]: [reasoning]
- [Assumption 2]: [reasoning]

#### Ambiguities
- [Ambiguity 1]: [what's unclear]
- [Ambiguity 2]: [what's unclear]
```

**Quality Criteria:**
- All states identified
- All transitions documented
- State properties clear
- Hierarchy documented
- Persistence behavior specified
- UI evidence provided
- Ready for implementation
```

---

## Quality Checklist

- ✓ All UI states identified
- ✓ All state transitions documented
- ✓ State properties specified
- ✓ State hierarchy mapped
- ✓ Persistence behavior documented
- ✓ Transition triggers and conditions clear
- ✓ UI evidence provided
- ✓ Assumptions and ambiguities noted

---

## Cross-Reference

- **Input**: 
  - Atomic Features (from Case 2 Core Workflow)
  - UX Specifications (from Case 2 Core Workflow)
- **Output**: 
  - Inferred state machines and transitions
  - Feeds into Behavioral Implementation Specification (final inference step)
- **Related**: 
  - Case 2 (UI/UX-Only Analysis) - this is an inference step in Case 2
  - Data Model Inference - previous inference step in Case 2
  - API Contract Inference - next inference step in Case 2
  - Behavioral Implementation Specification - final inference step that consolidates all inferences
- **Workflow Position**: After Data Model Inference, before API Contract Inference
- **Process Steps**: Validation Loop - after inference to check completeness

