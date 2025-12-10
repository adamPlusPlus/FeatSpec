# User Interrogation

**Purpose**: Conduct detailed, iterative questioning of the user to clarify the idea, fill gaps, and refine understanding.

**Input**: Idea capture summary and documentation review findings
**Output**: Comprehensive Q&A document with clarified requirements and refined feature understanding
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Documentation Review
- Next: Iterative Refinement
- Process Steps: Validation Loop (after completion), Refinement Loop (if complex elements found)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Idea Capture Summary** from the previous step
- Paste the **Documentation Review** findings
- The system will generate questions based on gaps and unclear areas
- You will answer questions in the output field, and the system will generate follow-up questions

**Tip**: Be thorough in your answers. The more detail you provide, the better the final specifications will be.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/user-interrogation-output`
- **Files to Watch**: `user-questions-draft.md`, `user-answers-draft.md`
- **Complete Files**: `user-interrogation-complete.md`
- **Wait Time**: 3000ms
- **Stability Time**: 15000ms (file must be unchanged for 15 seconds)
- **File Count**: 1

**Important Instructions for LLM Agents:**

1. **Create the target directory** as specified above
2. **Generate questions**: Create `user-questions-draft.md` with detailed questions
3. **Wait for answers**: System will detect when user provides answers
4. **Generate follow-ups**: Based on answers, generate follow-up questions if needed
5. **Signal completion**: When all questions answered and clarified, create `user-interrogation-complete.md`

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**User Interrogation Process**:

1. **Review Inputs**
   - Analyze idea capture summary
   - Review documentation findings
   - Identify all gaps and unclear areas
   - Note assumptions that need validation

2. **Generate Initial Questions**
   - Create comprehensive question set covering:
     - Feature details and behavior
     - User interactions and workflows
     - Edge cases and error handling
     - Technical constraints
     - Integration requirements
     - Performance expectations
   - Organize questions by category
   - Prioritize critical questions

3. **Conduct Iterative Q&A**
   - Present questions to user
   - Analyze user answers
   - Identify follow-up questions needed
   - Continue until all critical areas clarified

4. **Synthesize Understanding**
   - Compile all Q&A into structured document
   - Resolve contradictions
   - Fill identified gaps
   - Refine feature descriptions

**Question Categories**:

- **Feature Behavior**: How does each feature work?
- **User Interactions**: What actions can users take?
- **Workflows**: What are the step-by-step processes?
- **Edge Cases**: What happens in unusual situations?
- **Error Handling**: How are errors handled?
- **Constraints**: What limitations exist?
- **Integration**: How does this interact with other systems?
- **Performance**: What are performance requirements?

**Output Format**:

```markdown
## User Interrogation Summary

### Questions Asked
[Organized by category]

#### Feature Behavior
- **Q**: [Question]
  - **A**: [Answer]
  - **Follow-up**: [If any]

#### User Interactions
...

### Clarified Requirements
[Structured requirements based on Q&A]

### Refined Feature Descriptions
[Updated feature descriptions with new clarity]

### Resolved Gaps
- [Gap 1]: [Resolution]
- [Gap 2]: [Resolution]
...

### Remaining Assumptions
[Any assumptions that couldn't be validated]
```

---

## Quality Criteria

- All critical gaps addressed
- Feature behaviors clearly understood
- User interactions fully specified
- Edge cases identified
- Ready for iterative refinement phase

