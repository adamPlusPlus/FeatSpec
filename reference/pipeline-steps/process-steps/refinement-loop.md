# Refinement Loop

**Purpose**: Identify and refine complex elements that need further decomposition or atomization.

**When to Invoke**: When complex elements are identified (pseudocode, composite features, complex descriptions)

**Input**: Complex elements from Decomposition or other steps
**Output**: Refined/atomized elements or decision to mark as atomic

---

## Prompt

Identify complex elements that need further refinement and apply atomization process.

**Complex Elements**:
{COMPLEX_ELEMENTS}

**Context**:
- Step: {STEP_NAME}
- Case: {CASE}
- Modifiers: {MODIFIERS}

**Refinement Tasks**:

1. **Identify Complex Elements**
   - Find elements that are too complex
   - Identify pseudocode that needs atomization
   - Find composite features that can be decomposed further
   - Identify descriptions that are too complex

2. **Assess if Element Can be Atomized Further**
   - Can the element be broken down?
   - Would atomization improve clarity?
   - Is the element truly atomic?
   - Would further decomposition add value?

3. **Apply Atomization Process** (if needed)
   - Break complex element into smaller parts
   - Continue until each part is atomic
   - Map refined elements to atomic features
   - Document refinement process

4. **Make Decision**
   - REFINE: Element can be atomized further
   - ATOMIC: Element is atomic and should not be refined further

**Atomization Process**:
1. Assess element complexity
2. If complex → Break into smaller blocks/components
3. Repeat until each block/component is atomic
4. Map refined elements to atomic features

**Output Format**:
```markdown
## Refinement Loop Report

### Complex Elements Identified
- **Element 1**: [Description]
  - **Complexity**: [High/Medium/Low]
  - **Can Atomize**: [Yes/No]
  - **Reasoning**: [Why]
  
- **Element 2**: [Description]
  ...

### Refinement Results
- **Elements Refined**: [Count] - [List]
- **Elements Marked Atomic**: [Count] - [List]
- **Refinement Process**: [Description of refinement applied]

### Decision
- **Decision**: [REFINE / ATOMIC]
- **Reasoning**: [Why]
- **Next Steps**: 
  - If REFINE: [Continue refinement process]
  - If ATOMIC: [Mark as atomic and continue]
```

---

## Quality Criteria

- Complex elements accurately identified
- Atomization assessment is correct
- Refinement process is clear
- Decision is justified

