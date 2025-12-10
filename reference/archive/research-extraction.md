# Feature Extraction from Documentation

**Purpose**: Extract structured feature information from researched documentation.

**Input**: Research summary from Research Loopa

**Prompt:**

```
Extract structured feature information from the following research.

Research Summary:
[OUTPUT_FROM_SECTION_R1]

Reference Documents:
- Terminology: feature-spec-reference.md (Part 1: Terminology) (use generic terms)
- Taxonomy: feature-spec-reference.md (Part 2: Feature Taxonomy) (classify features)

Extraction Tasks:

1. **Feature Identification**
   For each feature found in documentation:
   - Feature Name: Clear, descriptive name
   - Feature Category: Using taxonomy (UI, Interaction, Data, System)
   - Feature Type: Atomic, Composite, or Meta
   - Source: Which documentation source(s) mentioned it
   - Confidence: High/Medium/Low (based on documentation clarity)

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

Output Format:
```markdown
## Extracted Features

### Feature 1: [Feature Name]
- **Feature ID**: [category]-[type]-[name]-[version] (using taxonomy)
- **Source**: [Documentation source(s)]
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

Extraction Guidelines:
- Use ONLY terminology from feature-spec-reference.md (Part 1: Terminology)
- Convert all platform-specific terms to generic
- Extract exact values when mentioned (don't approximate)
- Preserve timing information with proper notation
- Note confidence level based on documentation clarity
- Identify gaps for follow-up research
```

**Output Format:**
```markdown
## Extracted Features
[Structured feature list]

## Gap Analysis
[Missing information]

## Research Recommendations
[Additional research needed]
```

**Quality Criteria:**
- Features properly classified
- Generic terminology used
- Timing information extracted
- Gaps identified
- Confidence levels assigned

---