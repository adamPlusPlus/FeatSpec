# Implementation Spec Validation

**Purpose**: Validate implementation specification for modularity, platform-agnostic design, and quality.

**Input**: Implementation specification from Section 2
**Output**: Validation report with issues and recommendations
**Cross-Reference**: Validates Implementation Specification Generation output. If valid, proceed to Integration Interface Definition

**Prompt:**

```
Validate the following implementation specification against quality criteria.

Implementation Specification:
[OUTPUT_FROM_SECTION_7]

Reference Documents:
- Quality Metrics: feature-spec-reference.md (Part 4: Quality Metrics & Validation)
- Validation Rules: feature-spec-reference.md (Part 4: Quality Metrics & Validation)
- Terminology: feature-spec-reference.md (Part 1: Terminology)

Validation Checklist:

1. **Modularity Check**
   - ✓ Components can be removed independently
   - ✓ No hidden dependencies between components
   - ✓ Clear component boundaries
   - ✓ Components communicate only through interfaces
   - ✓ Components can be tested in isolation

2. **Platform-Agnostic Check**
   - ✓ No platform-specific APIs (no React, Vue, iOS, Android APIs)
   - ✓ No language-specific syntax (no JavaScript, Swift, Kotlin specifics)
   - ✓ Generic data structures (Element, Position, not DOM, View)
   - ✓ Pseudocode only (no real code)
   - ✓ No framework assumptions

3. **Integration Interface Check**
   - ✓ Required interface clearly defined (what app must provide)
   - ✓ Provided interface clearly defined (what feature provides)
   - ✓ Interface is minimal (only what's needed)
   - ✓ Interface contracts specified
   - ✓ Integration points clear

4. **State Management Check**
   - ✓ State machine defined
   - ✓ All states identified
   - ✓ All transitions defined
   - ✓ State persistence specified
   - ✓ Error states included

5. **Event System Check**
   - ✓ Event types defined
   - ✓ Event flow documented
   - ✓ Event handlers specified
   - ✓ Event ordering clear
   - ✓ No event conflicts

6. **Abstraction Level Check**
   - ✓ Appropriate abstraction (not too low-level, not too high-level)
   - ✓ Conceptual descriptions (not implementation details)
   - ✓ Pseudocode where needed (not real code)
   - ✓ Focus on structure and relationships

7. **Completeness Check**
   - ✓ All components specified
   - ✓ All interfaces defined
   - ✓ All algorithms described
   - ✓ All edge cases handled
   - ✓ All error cases handled

For each validation item:
- Mark as PASS or FAIL
- If FAIL, provide specific issue and location
- Provide recommendation for fixing

Output Format:
```markdown
## Validation Report

### Modularity Check
- [✓/✗] Status
- Issues: [if any]
- Recommendations: [if any]

### Platform-Agnostic Check
- [✓/✗] Status
- Issues: [if any]
- Recommendations: [if any]

...

### Overall Status
- [PASS/FAIL/NEEDS_REVISION]
- Critical Issues: [list]
- Minor Issues: [list]
- Recommendations: [list]
```

If validation FAILS:
- Return to Section 2 with specific fixes needed
- Address all critical issues
- Re-validate

If validation PASSES:
- Proceed to Integration Interface Definition (Integration Interface Definition)
```

**Output Format:**
```markdown
## Validation Report

### [Validation Category]
- Status: [PASS/FAIL]
- Issues: [specific issues if any]
- Recommendations: [how to fix]

### Overall Status
- [PASS/FAIL/NEEDS_REVISION]
- Critical Issues: [list]
- Minor Issues: [list]
```

**Quality Criteria:**
- All checklist items validated
- Specific issues identified
- Clear recommendations provided
- Ready for revision or next step

**Cross-Reference**: If PASS, proceed to Integration Interface Definition. If FAIL, return to Implementation Specification Generation.

---