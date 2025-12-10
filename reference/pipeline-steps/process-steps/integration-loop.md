# Integration Loop

**Purpose**: Combine outputs from multiple sources or cases, resolving conflicts and integrating complementary information.

**When to Invoke**: When combining outputs from multiple sources or cases (e.g., Case 1 → Case 3, Case 2 → Case 3, Case 3 → Case 1/2)

**Input**: Multiple outputs to integrate (existing features + new information)
**Output**: Integrated output or flagged conflicts

---

## Prompt

Integrate the following outputs from multiple sources, resolving conflicts and merging complementary information.

**Outputs to Integrate**:
- Existing Features: {EXISTING_FEATURES}
- New Information: {NEW_INFORMATION}

**Context**:
- Case: {CASE}
- Modifiers: {MODIFIERS}
- Integration Type: {INTEGRATION_TYPE} (e.g., Case 1 → Case 3, Case 2 → Case 3)

**Integration Tasks**:

1. **Identify Conflicting Information**
   - Find contradictions between existing and new information
   - Identify conflicting descriptions
   - Note conflicting timing or visual properties
   - Document conflict types

2. **Resolve Conflicts**
   - Prioritize information sources (codebase > UI > user descriptions)
   - Merge compatible information
   - Flag unresolvable conflicts for manual review
   - Document resolution strategy

3. **Integrate Complementary Information**
   - Merge non-conflicting information
   - Add new details to existing features
   - Enhance existing features with new information
   - Combine related information

4. **Validate Integrated Output**
   - Check integration completeness
   - Verify no information lost
   - Ensure consistency
   - Validate terminology compliance

5. **Make Decision**
   - INTEGRATED: Integration successful, proceed
   - FLAGGED: Conflicts need manual review

**Conflict Resolution Strategies**:
- **Prioritize**: Use priority order (codebase > UI > user descriptions)
- **Merge**: Combine compatible information
- **Flag**: Mark conflicts for manual review
- **Enhance**: Add new information to existing features

**Output Format**:
```markdown
## Integration Loop Report

### Conflicts Identified
- **Conflict 1**: [Description]
  - **Type**: [Contradiction / Timing / Visual / Other]
  - **Resolution**: [How resolved or FLAGGED]
  - **Reasoning**: [Why]
  
- **Conflict 2**: [Description]
  ...

### Integration Results
- **Features Enhanced**: [Count] - [List]
- **New Features Added**: [Count] - [List]
- **Information Merged**: [Description]
- **Conflicts Resolved**: [Count]
- **Conflicts Flagged**: [Count]

### Integrated Output
[Integrated feature documentation]

### Decision
- **Decision**: [INTEGRATED / FLAGGED]
- **Reasoning**: [Why]
- **Next Steps**: 
  - If INTEGRATED: [Proceed with integrated output]
  - If FLAGGED: [Manual review needed for: [list of flagged conflicts]]
```

---

## Quality Criteria

- Conflicts accurately identified
- Resolution strategies are appropriate
- Integration is complete
- No information lost in integration
- Flagged conflicts are clearly documented

