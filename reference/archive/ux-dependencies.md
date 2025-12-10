# Dependency Analysis

**Purpose**: Identify and document all dependencies for the feature.

**Input**: Validated UX specification from UX Outline Validation
**Output**: Dependency map with all dependencies classified
**Cross-Reference**: Uses UX Outline Validation output. Output feeds into Implementation Specification Generation

**Prompt:**

```
Analyze dependencies for the following feature.

UX Specification:
[OUTPUT_FROM_SECTION_5_VALIDATED]

Reference Documents:
- Feature Taxonomy: feature-spec-reference.md (Part 2: Feature Taxonomy)
- Dependency Mapping: feature-spec-reference.md (Part 3: Dependency Mapping)
- Terminology: feature-spec-reference.md (Part 1: Terminology)

Dependency Analysis Process:

1. **Identify Prerequisites**
   What must exist for this feature to work?
   - State management systems
   - Event systems
   - Input handlers
   - Visual systems
   - Other features

2. **Identify Optional Dependencies**
   What enhances this feature but isn't required?
   - Haptic feedback systems
   - Audio feedback systems
   - Animation systems
   - Other optional features

3. **Identify Conflicts**
   What features cannot coexist with this feature?
   - Conflicting modes
   - Conflicting states
   - Conflicting behaviors

4. **Identify Compositions**
   What features work well with this feature?
   - Features that enhance it
   - Features it enhances
   - Features that compose together

For each dependency, provide:
- **Feature ID**: Using taxonomy format ([category]-[type]-[name]-[version])
- **Dependency Type**: prerequisite, optional, conflicting, composable
- **Interface Required**: What interface must be provided
- **Interface Provided**: What interface this feature provides
- **Reason**: Why this dependency exists
- **Impact**: What happens if dependency is missing

Output Format:
```markdown
## Dependency Map

### Prerequisites
- **Feature**: [feature-id]
  - **Interface Required**: [required interface]
  - **Reason**: [why required]
  - **Impact**: [what happens if missing]

### Optional Dependencies
- **Feature**: [feature-id]
  - **Interface Used**: [interface used]
  - **Enhancement**: [what it adds]
  - **Fallback**: [behavior without it]

### Conflicts
- **Feature**: [feature-id]
  - **Reason**: [why they conflict]
  - **Resolution**: [how to handle]

### Compositions
- **Feature**: [feature-id]
  - **Relationship**: [how they work together]
  - **Behavior**: [combined behavior]
```

Quality Checklist:
- ✓ All prerequisites identified
- ✓ All optional dependencies identified
- ✓ All conflicts identified
- ✓ All compositions identified
- ✓ Interfaces clearly specified
- ✓ Dependency types correctly classified
```

**Output Format:**
```markdown
## Dependency Map

### Prerequisites
[Required features with interfaces]

### Optional Dependencies
[Optional features with fallbacks]

### Conflicts
[Conflicting features with resolution]

### Compositions
[Composable features with relationships]
```

**Quality Criteria:**
- All dependencies identified
- Dependency types correctly classified
- Interfaces clearly specified
- Ready for implementation specification

**Cross-Reference**: Output feeds into Implementation Specification Generation (Implementation Specification Generation)

---