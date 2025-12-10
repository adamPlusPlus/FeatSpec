# codebase-deep Modifier

**Type**: Base Modifier
**Applies To**: Feature Extraction
**Case**: 1 (primary)

**Can Combine With**: 
- `enhancement-input` (when validating/enhancing previous case output)

**Instructions**:

Extract features from codebase with deep analysis of architecture, patterns, and implementation details.

**Extraction Tasks**:

1. **Code Architecture Extraction**
   - Examine source structure and organization
   - Identify architectural patterns
   - Extract component relationships
   - Document module boundaries

2. **Code Formatting Analysis**
   - Extract formatting conventions
   - Identify style patterns
   - Note naming conventions
   - Document code organization patterns

3. **Atomic/Composite Identification**
   - Identify atomic vs composite boundaries in code
   - Map code components to feature boundaries
   - Extract feature dependencies from code structure
   - Identify feature interfaces

4. **Implementation Details Extraction**
   - Extract implementation patterns
   - Document algorithm approaches
   - Note data structure choices
   - Extract state management patterns

5. **Edge Case Identification**
   - Identify edge cases from code paths
   - Extract error handling patterns
   - Document validation logic
   - Note boundary conditions

**Explicit Code Examination Steps**:
- **Code Architecture Extraction**: Examine source structure, patterns, organization
- **Code Formatting Analysis**: Extract formatting conventions, style patterns
- **Atomic/Composite Identification**: Identify atomic vs composite elements in code

**Output Additions**:
- Architecture patterns extracted
- Formatting conventions documented
- Atomic/composite boundaries identified
- Implementation details extracted
- Edge cases from code paths

**When Combined with `enhancement-input`**:
- First extract from codebase
- Then parse existing features (from enhancement-input)
- Cross-reference codebase findings with existing features
- Use Integration Loop to validate/enhance

