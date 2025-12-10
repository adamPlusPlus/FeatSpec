# Atomic Feature Description Generation

**Purpose**: Create detailed, generic descriptions of atomic features ready for UX specification.

**Input**: Atomic features from Subsection 0b

**Prompt:**

```
Create detailed, platform-agnostic descriptions for the following atomic features.

Atomic Features:
[OUTPUT_FROM_SUBSECTION_0B]

For each atomic feature, create a comprehensive description that includes:

1. Feature Name: Clear, descriptive name
2. User Goal: What the user accomplishes
3. Trigger: What initiates the feature (use generic terms: action1, action2, etc.)
4. Interaction Flow: Step-by-step what happens
5. Visual Feedback: What the user sees
6. Haptic/Audio Feedback: What the user feels/hears (if applicable)
7. Timing: Durations, thresholds, delays
8. Edge Cases: What happens in unusual situations
9. Error States: What happens when things go wrong

Requirements:
- Use ONLY terminology from terminology key (Part 1 of feature-spec-reference.md) (feature-spec-reference.md (Part 1: Terminology))
- NO platform-specific terms (no "touch", "click", "iOS", "Android", etc.)
- Describe from user perspective, not technical
- Include all timing information (durations, thresholds)
- Cover all edge cases and error states

Output Format:
- One detailed description per atomic feature
- Ready to be used as input for UX Outline Generation (Section 1)
- Self-contained (can understand feature from description alone)

Example Structure:
[Feature Name]
- User Goal: [description]
- Trigger: [action1, action2, etc.]
- Flow: [step-by-step]
- Visual: [what user sees]
- Timing: [durations, thresholds]
- Edge Cases: [unusual situations]
- Errors: [error handling]
```

**Output Format:**
```markdown
## Atomic Feature Descriptions

### Atomic Feature: [Feature Name]
- **Feature ID**: [category]-[type]-[name]-[version] (using taxonomy)
- **User Goal**: [What user accomplishes]
- **Trigger**: [action1/action2/hold/drag/etc.]
- **Interaction Flow**:
  1. [Step 1]
  2. [Step 2]
  ...
- **Visual Feedback**: [What user sees]
- **Haptic/Audio Feedback**: [What user feels/hears]
- **Timing**:
  - Duration: [duration[value:Xms]]
  - Threshold: [threshold[value:Xms]]
  - Delays: [delay[value:Xms]]
- **Edge Cases**: [Unusual situations]
- **Error States**: [Error handling]

### Atomic Feature: [Next Feature]
...
```

**Quality Criteria:**
- All terminology from master key
- No platform-specific terms
- Complete timing information
- All edge cases covered
- Ready for UX specification

**Cross-Reference**: Output feeds into UX Outline Generation (UX Outline Generation)

---