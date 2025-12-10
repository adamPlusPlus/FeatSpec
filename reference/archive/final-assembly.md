# Final Document Assembly

**Purpose**: Assemble complete feature specification document from all pipeline outputs.

**Input**: 
- UX Specification (UX Outline Validation validated)
- Dependency Map (Dependency Analysis)
- Implementation Specification (Implementation Spec Validation validated)
- Integration Interface (Integration Interface Definition)

**Output**: Complete feature specification document ready for LLM implementation

**Prompt:**

```
Assemble the complete feature specification document from the following pipeline outputs.

Pipeline Outputs:
- UX Specification: [OUTPUT_FROM_SECTION_5]
- Dependency Map: [OUTPUT_FROM_SECTION_6]
- Implementation Specification: [OUTPUT_FROM_SECTION_8]
- Integration Interface: [OUTPUT_FROM_SECTION_9]

Reference Documents:
- All previous sections
- Quality Metrics: feature-spec-reference.md (Part 4: Quality Metrics & Validation)

Assembly Requirements:

1. **Document Structure**
   - Title and overview
   - Table of contents
   - All sections from pipeline
   - Appendices if needed

2. **Section Organization**
   - UX Specification (from UX Outline Generation - validated)
   - Dependency Map (from Dependency Analysis)
   - Implementation Specification (from Implementation Specification Generation - validated)
   - Integration Interface (from Integration Interface Definition)
   - Quality Validation Status (summary only - validation passed/failed, not full reports)

3. **Remove Superseded Intermediate Steps**
   The following intermediate outputs should NOT be included in the final document as they are superseded by later steps:
   - **Research Loop outputs** (R1, R2, R3) - Superseded by Feature Discovery outputs
   - **Feature Discovery intermediate outputs** (App Analysis, Feature Decomposition) - Superseded by Atomic Feature Descriptions, which are then superseded by UX Specification
   - **Atomic Feature Descriptions** - Information is incorporated into UX Specification
   - **Detailed validation reports** - Only include validation status (PASS/FAIL), not full validation details
   - **Interface sections from Implementation Specification** - Superseded by the formalized Integration Interface Definition document
   
   **Rationale**: The final document should be self-contained and focused on what's needed for implementation. Intermediate steps are useful during the pipeline but redundant in the final specification. Later steps consolidate and refine earlier outputs, making the earlier outputs unnecessary in the final document.

4. **Cross-References**
   - Link related sections
   - Reference dependencies
   - Connect UX to implementation
   - Link interfaces to components

5. **Completeness Check**
   - All sections included
   - All dependencies documented
   - All interfaces defined
   - All validations passed

6. **Documentation Quality**
   - Clear structure
   - Consistent formatting
   - Complete information
   - Ready for implementation
   - No redundant intermediate steps

Output Format:
```markdown
# [Feature Name] Complete Specification

## Overview
[High-level description]

## Table of Contents
[Links to all sections]

## Part 1: UX Specification
[Complete UX spec from Section 1]

## Part 2: Dependency Map
[Complete dependency map from Dependency Analysis]

## Part 3: Implementation Specification
[Complete implementation spec from Section 2]

## Part 4: Integration Interface
[Complete integration interface from Integration Interface Definition]

## Part 5: Quality Validation Status
- UX Specification Validation: [PASS/FAIL] (from UX Outline Validation)
- Implementation Specification Validation: [PASS/FAIL] (from Implementation Spec Validation)
- Note: Full validation reports are not included as they are intermediate quality checks. Only final status is documented.

## Appendices
[Any additional information]
```

Quality Checklist:
- ✓ All sections included
- ✓ All cross-references valid
- ✓ Document is self-contained
- ✓ Ready for LLM implementation
- ✓ Follows quality metrics
- ✓ Intermediate steps removed (Research Loop, Feature Discovery intermediates, Atomic Descriptions, detailed validation reports)
- ✓ Only final validated outputs included
```

**Output Format:**
```markdown
# [Feature Name] Complete Specification

[Complete assembled document with all sections]
```

**Quality Criteria:**
- All sections included
- Cross-references valid
- Self-contained document
- Ready for implementation

**Usage**: This complete document can now be used with code-aware LLMs (like Cursor) to implement the feature in any codebase.

---