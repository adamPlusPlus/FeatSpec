# Input Organization

**Purpose**: Organize parsed input into logical groups and identify relationships.

**Input**: {PREVIOUS_OUTPUT}
**Output**: Organized input data with relationships and groupings
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Input Parsing
- Next: Input Structuring
- Process Steps: Validation Loop (after completion)

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Organization Tasks**:

1. **Group Related Information**
   - Group goals by theme or feature area
   - Group actions by goal or feature
   - Group data entities by domain
   - Group interaction patterns by type
   - Group visual elements by screen/area
   - Group timing information by flow
   - Group error scenarios by feature
   - Group edge cases by feature

2. **Identify Relationships**
   - Map actions to goals
   - Map data entities to actions
   - Map interaction patterns to actions
   - Map visual elements to actions
   - Map timing to flows
   - Map errors to actions/features
   - Map edge cases to actions/features
   - Identify dependencies between groups

3. **Create Feature Candidates**
   - Identify potential features from goal groups
   - Identify potential features from action groups
   - Identify potential features from interaction patterns
   - Note feature boundaries
   - Identify feature relationships

4. **Resolve Conflicts and Ambiguities**
   - Identify conflicting information
   - Resolve ambiguities where possible
   - Note unresolved conflicts
   - Note unresolved ambiguities

**Output Format**:
```markdown
## Organized Input Summary

### Feature Candidate Groups

#### Feature Candidate 1: [Name]
- Goals: [Goal IDs]
- Actions: [Action IDs]
- Data Entities: [Entity IDs]
- Interaction Patterns: [Pattern IDs]
- Visual Elements: [Element IDs]
- Timing: [Timing IDs]
- Error Scenarios: [Error IDs]
- Edge Cases: [Edge Case IDs]
- Confidence: [High/Medium/Low]
- Source: [Which input sources contributed]

#### Feature Candidate 2: [Name]
[...]

### Relationships

#### Goal-Action Mappings
- Goal [ID]: [Actions that support this goal]
- Goal [ID]: [Actions that support this goal]

#### Action-Data Mappings
- Action [ID]: [Data entities used]
- Action [ID]: [Data entities used]

#### Action-Pattern Mappings
- Action [ID]: [Interaction patterns]
- Action [ID]: [Interaction patterns]

#### Flow Sequences
- Flow 1: [Sequence of actions with timing]
- Flow 2: [Sequence of actions with timing]

### Conflicts
- Conflict 1: [Description]
  - Items in conflict: [IDs]
  - Resolution: [If resolved, how]
  - Status: [Resolved/Unresolved]

### Ambiguities
- Ambiguity 1: [Description]
  - Items involved: [IDs]
  - Possible interpretations: [List]
  - Status: [Resolved/Unresolved]

### Organization Quality Assessment
- Grouping quality: [High/Medium/Low]
- Relationship completeness: [High/Medium/Low]
- Feature candidate quality: [High/Medium/Low]
- Conflict resolution: [Complete/Partial/None]
- Ambiguity resolution: [Complete/Partial/None]
```

**Quality Criteria**:
- All parsed information is organized into groups
- Relationships are identified and mapped
- Feature candidates are identified
- Conflicts are identified and resolved where possible
- Ambiguities are noted and resolved where possible
- Organization is logical and consistent

