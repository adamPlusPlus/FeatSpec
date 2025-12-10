# ui-only Modifier

**Type**: Base Modifier
**Applies To**: Feature Extraction
**Case**: 2 (primary)

**Can Combine With**: 
- `enhancement-input` (when validating/enhancing previous case output)

**Instructions**:

Extract features from UI observations when codebase is not available.

**Extraction Tasks**:

1. **Extract Features from UI Observations**
   - Identify features from visible UI behavior
   - Document interaction patterns observed
   - Extract feature boundaries from UI structure
   - Note feature relationships from UI connections

2. **Infer Feature Boundaries**
   - Determine feature scope from UI behavior
   - Identify feature entry and exit points
   - Map UI components to features
   - Document feature flow from UI

3. **Document Visual and Interaction Patterns**
   - Extract visual patterns (layouts, styles, animations)
   - Document interaction patterns (gestures, clicks, navigation)
   - Note feedback patterns (visual, haptic, audio)
   - Extract timing patterns from observations

**Output Additions**:
- Features inferred from UI behavior
- Feature boundaries from UI structure
- Visual and interaction patterns documented
- Confidence levels for inferred features

**When Combined with `enhancement-input`**:
- First extract from UI observations
- Then parse existing features (from enhancement-input)
- Cross-reference UI findings with existing features
- Use Integration Loop to validate/enhance

