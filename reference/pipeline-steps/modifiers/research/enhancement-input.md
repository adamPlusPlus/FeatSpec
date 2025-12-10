# enhancement-input Modifier

**Type**: Layering Modifier (can combine with base modifiers)
**Applies To**: Research, Feature Extraction, Decomposition, Atomic Features
**Case**: 3 (when enhancing), 1/2 (when validating previous case output)

**Combines With**: 
- `user-input` (most common - Case 3 enhancing with user descriptions)
- `codebase-rag` (Case 1 validating Case 3 output)
- `ui-only` (Case 2 validating Case 3 output)

**Layering Instructions**:

When combined with another modifier:
1. **First process**: Handle base modifier instructions (codebase-rag, ui-only, or user-input)
2. **Then process**: Parse existing feature documentation from previous case output
3. **Integration**: Use Integration Loop to merge information

**Standalone Instructions** (when used alone):

Parse existing feature documentation from a previous case output.

**Research Tasks**:

1. **Parse Existing Feature Documentation**
   - Extract structured information from previous case output
   - Identify feature boundaries and classifications
   - Extract feature details (goals, interactions, visual feedback, timing)
   - Note existing edge cases and error states

2. **Identify Enhancement Opportunities**
   - Find gaps in existing features
   - Identify areas needing more detail
   - Note missing edge cases or error states
   - Identify features that need refinement

3. **Build Context for Enhancement**
   - Understand existing feature structure
   - Map relationships between features
   - Identify dependencies
   - Note existing terminology and conventions

**Output Additions**:
- Parsed existing features with structure
- Enhancement opportunities identified
- Context for enhancement work
- Integration points with new information

**When Combined with `user-input`**:
- First parse existing features
- Then parse user descriptions/VTT
- Map user descriptions to existing features
- Use Integration Loop to merge enhancements

**When Combined with `codebase-rag`**:
- First scan codebase
- Then parse existing features (from Case 3 output)
- Cross-reference codebase with existing features
- Use Integration Loop to validate/enhance

**When Combined with `ui-only`**:
- First document UI observations
- Then parse existing features (from Case 3 output)
- Cross-reference UI with existing features
- Use Integration Loop to validate/enhance

