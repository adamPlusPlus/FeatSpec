# UX Outline Generation

**Purpose**: Generate comprehensive UX specification from atomic feature descriptions.

**Input**: Atomic feature descriptions from Atomic Feature Description Generation
**Output**: Complete UX specification document
**Cross-Reference**: Uses Atomic Feature Description Generation output. Output feeds into UX Outline Validation

**Prompt:**

```
Create an extremely detailed UX specification document for the following feature(s).

Atomic Feature Descriptions:
[OUTPUT_FROM_SECTION_10]

Reference Documents:
- Terminology Key: feature-spec-reference.md (Part 1: Terminology) (USE ONLY TERMS FROM THIS KEY)
- Feature Taxonomy: feature-spec-reference.md (Part 2: Feature Taxonomy) (classify features)
- Quality Metrics: feature-spec-reference.md (Part 4: Quality Metrics & Validation) (ensure completeness)

Document Structure Requirements:

1. **Interaction Terminology Key**
   - Include terminology key at document start
   - Reference feature-spec-reference.md (Part 1: Terminology)
   - Define all terms used in document

2. **Overview**
   - High-level description of feature
   - User goals and outcomes
   - Context and use cases

3. **Phase-by-Phase Breakdown**
   - Break feature into logical phases
   - Each phase covers one aspect of interaction
   - Example phases: Activation, Interaction, Completion, Error Handling

4. **Detailed Phase Specifications**
   For each phase, include:
   - **Trigger**: What initiates this phase (use action1, action2, etc.)
   - **Visual Feedback**: Every visual change (opacity, scale, position, etc.)
   - **Haptic Feedback**: All haptic responses (haptic_feedback[type:X, duration:Y])
   - **Audio Feedback**: Any audio cues
   - **Timing**: Exact durations, thresholds, delays (duration[value:Xms])
   - **State Changes**: What states are entered/exited
   - **Edge Cases**: Unusual situations
   - **Error Handling**: What happens on errors

5. **User Journey**
   - Typical user flow
   - Alternative paths
   - Error recovery paths

6. **Visual Design Details**
   - All visual properties (opacity[value:X], scale[value:X], etc.)
   - Color specifications (color[hex:#XXXXXX])
   - Animation details (animation[type:X, duration:Y, easing:Z])
   - Layout specifications

7. **Feedback Specifications**
   - Haptic feedback types and timing
   - Audio feedback specifications
   - Visual feedback animations

8. **Edge Cases and Error States**
   - All edge cases documented
   - Error states and recovery
   - Invalid action handling

Critical Requirements:

1. **Terminology**: Use ONLY terms from feature-spec-reference.md (Part 1: Terminology)
   - ❌ Never use: touch, click, swipe, tap, iOS, Android, etc.
   - ✅ Always use: action1, action2, pointer, hold, drag, release, etc.

2. **Timing**: Specify ALL timing information
   - Durations: duration[value:300ms]
   - Thresholds: threshold[hold_duration:500ms]
   - Delays: delay[value:100ms]
   - Intervals: interval[value:16ms]

3. **Visual Properties**: Use exact notation
   - Opacity: opacity[value:0.75]
   - Scale: scale[value:1.1]
   - Position: position[x:100, y:200]
   - Colors: color[hex:#007AFF]

4. **Completeness**: Document EVERYTHING
   - Every visual change
   - Every timing value
   - Every state transition
   - Every edge case
   - Every error condition

5. **User Perspective**: Write from user experience
   - What user sees, feels, hears
   - Not technical implementation
   - Focus on perception and experience

Output Format:
- Complete markdown document
- Ready for validation (UX Outline Validation)
- Self-contained (can understand UX from document alone)
- Follows structure of example: ios-home-screen-hold-to-edit-ux.md

Quality Checklist (from feature-spec-reference.md (Part 4: Quality Metrics & Validation)):
- ✓ All terms from master terminology
- ✓ All timing specified
- ✓ All visual properties specified
- ✓ All edge cases covered
- ✓ No platform-specific terms
- ✓ Complete user journey documented
```

**Output Format:**
```markdown
# [Feature Name] UX Specification

## Interaction Terminology Key
[Reference to feature-spec-reference.md (Part 1: Terminology), include key terms used]

## Overview
[High-level description]

## Phase 1: [Phase Name]
[Detailed phase specification]

## Phase 2: [Phase Name]
[Detailed phase specification]

...
```

**Quality Criteria:**
- All terminology from master key
- Complete timing information
- All visual properties specified
- All edge cases covered
- No platform-specific terms

**Cross-Reference**: Output feeds into UX Outline Validation (UX Outline Validation)

---