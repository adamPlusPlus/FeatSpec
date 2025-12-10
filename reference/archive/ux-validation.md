# UX Outline Validation

**Purpose**: Validate UX specification for completeness, genericity, and quality.

**Input**: UX specification from Section 1
**Output**: Validation report with issues and recommendations
**Cross-Reference**: Validates UX Outline Generation output. If valid, proceed to Dependency Analysis

**Prompt:**

```
Validate the following UX specification against quality criteria.

UX Specification:
[OUTPUT_FROM_SECTION_4]

Reference Documents:
- Terminology Key: feature-spec-reference.md (Part 1: Terminology)
- Quality Metrics: feature-spec-reference.md (Part 4: Quality Metrics & Validation)
- Validation Rules: feature-spec-reference.md (Part 4: Quality Metrics & Validation)

Validation Checklist:

1. **Terminology Check**
   - ✓ All terms from feature-spec-reference.md (Part 1: Terminology)
   - ✓ No platform-specific terms (touch, click, iOS, Android, etc.)
   - ✓ Proper use of qualifiers (term[parameter:value])
   - ✓ Consistent terminology throughout

2. **Completeness Check**
   - ✓ All interactions documented
   - ✓ All visual feedback specified
   - ✓ All haptic/audio feedback specified
   - ✓ All timing values provided (durations, thresholds, delays)
   - ✓ All state changes documented
   - ✓ All edge cases covered
   - ✓ All error states handled

3. **Timing Specification Check**
   - ✓ Every animation has duration[value:Xms]
   - ✓ Every threshold has threshold[value:Xms]
   - ✓ Every delay has delay[value:Xms]
   - ✓ Timing relationships clear (simultaneous, sequential, stagger)

4. **Visual Property Check**
   - ✓ All visual properties use exact notation (opacity[value:X], scale[value:X])
   - ✓ All colors specified (color[hex:#XXXXXX])
   - ✓ All positions specified (position[x:X, y:Y])
   - ✓ All animations specified (animation[type:X, duration:Y, easing:Z])

5. **Edge Case Coverage**
   - ✓ Boundary conditions handled
   - ✓ Invalid inputs handled
   - ✓ Error recovery documented
   - ✓ Interruption scenarios covered

6. **Multi-Input Support**
   - ✓ Works with action1 (touch/click)
   - ✓ Works with mouse (if applicable)
   - ✓ Works with gamepad (if applicable)
   - ✓ Input method doesn't change behavior

7. **User Perspective**
   - ✓ Written from user experience, not technical
   - ✓ Focuses on perception and feel
   - ✓ Describes what user sees/feels/hears

For each validation item:
- Mark as PASS or FAIL
- If FAIL, provide specific issue and location
- Provide recommendation for fixing

Output Format:
```markdown
## Validation Report

### Terminology Check
- [✓/✗] Status
- Issues: [if any]
- Recommendations: [if any]

### Completeness Check
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
- Return to Section 1 with specific fixes needed
- Address all critical issues
- Re-validate

If validation PASSES:
- Proceed to Dependency Analysis (Dependency Analysis)
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

**Cross-Reference**: If PASS, proceed to Dependency Analysis. If FAIL, return to UX Outline Generation.

---