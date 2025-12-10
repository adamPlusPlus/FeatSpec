# enhancement-input Modifier

**Type**: Layering Modifier (can combine with base modifiers)
**Applies To**: Feature Extraction
**Case**: 3 (when enhancing), 1/2 (when validating previous case output)

**Combines With**: 
- `user-input` (most common - Case 3 enhancing with user descriptions)
- `codebase-deep` (Case 1 validating Case 3 output)
- `ui-only` (Case 2 validating Case 3 output)

**Layering Instructions**:

When combined with another modifier:
1. **First process**: Handle base modifier instructions (codebase-deep, ui-only, or user-input)
2. **Then process**: Extract enhancement opportunities from existing features
3. **Integration**: Use Integration Loop to merge enhancements

**Standalone Instructions** (when used alone):

Extract enhancement opportunities from existing features from previous case output.

**Extraction Tasks**:

1. **Extract Enhancement Opportunities**
   - Identify missing details in existing features
   - Find gaps in feature documentation
   - Note areas needing refinement
   - Identify incomplete features

2. **Identify Missing Details**
   - Find missing timing information
   - Identify missing visual details
   - Note missing edge cases
   - Identify missing error states

3. **Extract Attributes to Add**
   - Attributes that should be added to existing features
   - Additional context information
   - Enhanced descriptions
   - Additional edge cases or error states

**Output Additions**:
- Enhancement opportunities identified
- Missing details documented
- Attributes to add specified
- Integration points with new information

**When Combined with `user-input`**:
- First extract enhancement opportunities from existing features
- Then extract features from user descriptions
- Map user descriptions to existing features
- Use Integration Loop to merge enhancements

**When Combined with `codebase-deep`**:
- First extract from codebase
- Then extract enhancement opportunities from existing features
- Cross-reference codebase with existing features
- Use Integration Loop to validate/enhance

**When Combined with `ui-only`**:
- First extract from UI observations
- Then extract enhancement opportunities from existing features
- Cross-reference UI with existing features
- Use Integration Loop to validate/enhance

