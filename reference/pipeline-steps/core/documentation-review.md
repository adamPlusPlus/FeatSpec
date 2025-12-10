# Documentation Review

**Purpose**: Review existing documentation, design documents, and related atomization documents to understand context and requirements.

**Input**: Idea capture summary
**Output**: Documentation review findings, related documents identified, and context extracted
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Idea Capture
- Next: User Interrogation
- Process Steps: Validation Loop (after completion)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Idea Capture Summary** from the previous step
- Optionally paste links to or content from existing documentation
- The system will identify what documentation is needed and may request access to related atomization documents

**Tip**: If you have existing design documents, specifications, or related feature documentation, include them here.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/documentation-review-output`
- **Files to Watch**: `documentation-review-draft.md`
- **Complete Files**: `documentation-review-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms
- **File Count**: 1

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Documentation Review Tasks**:

1. **Identify Documentation Needs**
   - Review idea capture summary
   - Identify what documentation would be helpful
   - Determine if related atomization documents exist
   - Note any design documents or specifications mentioned

2. **Review Available Documentation**
   - Analyze any provided documentation
   - Extract relevant information
   - Identify patterns and conventions
   - Note terminology and concepts used

3. **Search for Related Documents**
   - Identify if related atomization documents exist
   - Determine if they should be referenced
   - Extract relevant patterns or features
   - Note how current idea relates to existing work

4. **Extract Context**
   - Document design patterns found
   - Extract terminology and conventions
   - Identify architectural patterns
   - Note any constraints or requirements

5. **Prepare for User Interrogation**
   - Identify questions that documentation can't answer
   - Note areas needing user clarification
   - Prepare context for interrogation phase

**Output Format**:

```markdown
## Documentation Review Summary

### Documentation Reviewed
- [Document 1]: [Key findings]
- [Document 2]: [Key findings]
...

### Related Atomization Documents
- [Document reference]: [How it relates]
...

### Design Patterns Identified
- [Pattern 1]: [Description]
- [Pattern 2]: [Description]
...

### Terminology and Conventions
[Terminology and conventions extracted from documentation]

### Context Extracted
[Relevant context that informs the idea]

### Questions for User Interrogation
[Questions that documentation couldn't answer]
```

---

## Quality Criteria

- All available documentation reviewed
- Related documents identified
- Context extracted
- Ready for user interrogation phase

