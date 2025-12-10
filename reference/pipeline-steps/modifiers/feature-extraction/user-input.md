# user-input Modifier

**Type**: Base Modifier
**Applies To**: Feature Extraction
**Case**: 3 (primary), 1/2 (supplementary)

**Can Combine With**: 
- `enhancement-input` (when enhancing existing features)

**Instructions**:

Extract features from parsed user descriptions and map to existing features if available.

**Extraction Tasks**:

1. **Extract Features from Parsed Descriptions**
   - Identify features from user descriptions
   - Extract feature requirements
   - Document user goals as features
   - Map descriptions to feature concepts

2. **Map to Existing Features** (if available)
   - Match descriptions to existing atomic features
   - Match descriptions to existing composite features
   - Identify partial matches
   - Calculate match confidence

3. **Identify Gaps in Existing Documentation**
   - Find aspects not covered by existing features
   - Identify missing details
   - Note feature variations
   - Document edge cases not covered

4. **Capture Non-Feature Attributes**
   - Extract context information
   - Capture "feel" and subjective descriptions
   - Document timing from descriptions
   - Note visual descriptions

**Output Additions**:
- Features extracted from user descriptions
- Feature mappings to existing features (if applicable)
- Gap analysis
- Non-feature attributes (context, feel, timing)

**When Combined with `enhancement-input`**:
- First parse existing features (from enhancement-input)
- Then extract features from user descriptions
- Map user descriptions to existing features
- Use Integration Loop to merge enhancements

**Note**: For detailed user description parsing, see case3-specialized/user-description-parsing.md.

