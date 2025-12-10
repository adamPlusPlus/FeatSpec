# enhancement-input Modifier

**Type**: Layering Modifier (can combine with base modifiers)
**Applies To**: Decomposition
**Case**: 3 (when enhancing), 1/2 (when validating previous case output)

**Combines With**: 
- `codebase-pseudocode` (Case 1 enhancing)
- `standard` (Case 2/3 enhancing)

**Layering Instructions**:

When combined with another modifier:
1. **First process**: Handle base modifier instructions (codebase-pseudocode or standard)
2. **Then process**: Enhance existing decomposition with new details
3. **Integration**: Use Integration Loop to merge enhancements

**Standalone Instructions** (when used alone):

Enhance existing decomposition with new details from previous case output.

**Decomposition Tasks**:

1. **Decompose Enhancement Opportunities**
   - Break down missing details into atomic components
   - Decompose new information from previous case
   - Identify atomic components to add
   - Document enhancement decomposition

2. **Break Down Missing Details**
   - Decompose gaps in existing decomposition
   - Break down incomplete components
   - Identify missing atomic features
   - Document what needs to be added

3. **Map Enhancements to Existing Atomic Features**
   - Map new details to existing atomic features
   - Identify which atomic features need enhancement
   - Document enhancement relationships
   - Note integration points

**Output Additions**:
- Enhanced decomposition with new details
- Missing components identified
- Enhancement mappings to atomic features

**When Combined with `codebase-pseudocode`**:
- First decompose with pseudocode extraction
- Then enhance existing decomposition
- Use Integration Loop to merge

**When Combined with `standard`**:
- First perform standard decomposition
- Then enhance existing decomposition
- Use Integration Loop to merge

