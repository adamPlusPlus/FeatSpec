# Feature Extraction

**Purpose**: Extract features from available sources based on active modifiers.

**Input**: Research summary from Research step
**Output**: Structured feature information with classifications, details, and gap analysis
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Research
- Next: Validation
- Process Steps: Validation Loop (after completion), Integration Loop (when combining with existing features)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Research Summary** output from the Research step
- If using `enhancement-input` modifier: Also include existing feature documentation from previous case output
- The research summary should contain identified sources, key findings, and gaps

**Tip**: Use "Paste from Previous" button to automatically copy the Research step output.

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Extraction Tasks**:

1. **Feature Identification**
   For each feature found:
   - Feature Name: Clear, descriptive name
   - Feature Category: Using taxonomy (UI, Interaction, Data, System)
   - Feature Type: Atomic, Composite, or Meta
   - Source: Which source(s) mentioned it
   - Confidence: High/Medium/Low (based on source clarity)

2. **Feature Details Extraction**
   For each feature, extract:
   - User Goal: What user accomplishes
   - Trigger: What initiates the feature (use generic terms: action1, action2, etc.)
   - Interaction Flow: Step-by-step what happens
   - Visual Feedback: What user sees (use terminology: opacity[value:X], scale[value:X], etc.)
   - Timing: Durations, thresholds, delays (use notation: duration[value:Xms])
   - Edge Cases: Unusual situations mentioned
   - Error States: Error handling described

3. **Interaction Pattern Extraction**
   - Identify all user interactions
   - Convert to generic terminology (action1, action2, pointer, etc.)
   - Extract timing information
   - Note visual properties mentioned

4. **Gap Analysis**
   - Identify features with incomplete information
   - Note what details are missing
   - Suggest additional research if needed

**Extraction Guidelines**:
- Use ONLY terminology from feature-spec-reference.md (Part 1: Terminology)
- Convert all platform-specific terms to generic
- Extract exact values when mentioned (don't approximate)
- Preserve timing information with proper notation
- Note confidence level based on source clarity
- Identify gaps for follow-up research

{PROCESS_STEP_TRIGGERS}

---

## Output Format

```markdown
## Extracted Features

### Feature 1: [Feature Name]
- **Feature ID**: [category]-[type]-[name]-[version] (using taxonomy)
- **Source**: [Source(s)]
- **Confidence**: [High/Medium/Low]
- **Category**: [UI/Interaction/Data/System]
- **Type**: [Atomic/Composite/Meta]
- **User Goal**: [What user accomplishes]
- **Trigger**: [action1/action2/hold/drag/etc.]
- **Interaction Flow**:
  1. [Step 1]
  2. [Step 2]
  ...
- **Visual Feedback**: 
  - [Property: value] (e.g., opacity[value:0.75])
  - [Property: value]
- **Timing**:
  - [Timing type: value] (e.g., duration[value:300ms])
  - [Timing type: value]
- **Edge Cases**: [Unusual situations]
- **Error States**: [Error handling]
- **Information Completeness**: [Complete/Partial/Missing details]
- **Missing Information**: [What's not documented]

### Feature 2: [Next Feature]
...

## Gap Analysis
- [Feature with incomplete info]: [What's missing]
- [Next gap]
...

## Research Recommendations
- [What needs further research]
- [Additional sources to check]
```

---

## Quality Criteria

- Features properly classified using taxonomy
- Generic terminology used throughout
- Timing information extracted with proper notation
- Gaps identified and documented
- Confidence levels assigned
- All modifier-specific extraction requirements met

---

## Process Step Triggers

**Validation Loop**: After feature extraction
- Assess completeness of extraction
- Check if all relevant features identified
- Verify terminology compliance
- Decision: CONTINUE to Validation or ITERATE Feature Extraction

**Integration Loop**: When {EXISTING_FEATURES} are provided
- Compare extracted features with existing features
- Resolve conflicts between new and existing information
- Integrate complementary information
- Decision: CONTINUE with integrated features

