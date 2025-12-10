# codebase-pseudocode Modifier

**Type**: Base Modifier
**Applies To**: Decomposition
**Case**: 1 (primary)

**Can Combine With**: 
- `enhancement-input` (when enhancing existing decomposition)

**Instructions**:

Convert relevant code to pseudocode and apply pseudocode atomization if needed.

**Decomposition Tasks**:

1. **Pseudocode Extraction**
   - Convert relevant code to pseudocode (only if it adds nuance to atomic definitions)
   - Extract pseudocode for complex logic
   - Focus on behavior, not implementation details
   - Preserve algorithm structure

2. **Pseudocode Atomization** (if pseudocode is complex)
   - Assess pseudocode complexity
   - If complex → Break into smaller pseudocode blocks
   - Repeat until each block is atomic
   - Map pseudocode blocks to atomic features

**Pseudocode Atomization Process**:
1. Assess pseudocode complexity
2. If complex → Break into smaller pseudocode blocks
3. Repeat until each block is atomic
4. Map pseudocode blocks to atomic features

**Refinement Loop Trigger**:
- When complex pseudocode is identified
- Continue atomization until all pseudocode is atomic
- Decision: CONTINUE decomposition or REFINE pseudocode

**Output Additions**:
- Pseudocode for relevant logic (if adds nuance)
- Atomized pseudocode blocks
- Mapping of pseudocode to atomic features

**When Combined with `enhancement-input`**:
- First decompose with pseudocode extraction
- Then enhance existing decomposition with new details
- Use Integration Loop to merge

