# codebase-rag Modifier

**Type**: Base Modifier
**Applies To**: Research
**Case**: 1 (primary)

**Can Combine With**: 
- `enhancement-input` (when validating/enhancing previous case output)

**Instructions**:

Scan all documentation files and code to build a searchable knowledge base for retrieval-augmented generation.

**Research Tasks**:

1. **Scan Documentation Files**
   - Official documentation websites
   - API documentation
   - Developer documentation
   - README files
   - User guides and tutorials
   - Community resources (if relevant)

2. **Scan Code Comments**
   - Inline comments
   - Block comments
   - Documentation comments (JSDoc, docstrings, etc.)
   - Function/class documentation

3. **Scan Test Files**
   - Unit tests
   - Integration tests
   - Test descriptions and comments
   - Test data and fixtures

4. **Build Searchable Knowledge Base**
   - Index all scanned content
   - Enable retrieval-augmented generation for subsequent steps
   - Organize by feature area, component, or functionality
   - Tag content with relevant metadata

**Output Additions**:
- Knowledge base structure and organization
- Index of all scanned sources
- Retrieval capabilities for subsequent steps

**When Combined with `enhancement-input`**:
- First scan codebase documentation and code
- Then parse existing feature documentation (from enhancement-input)
- Cross-reference codebase findings with existing features
- Use Integration Loop to merge information

