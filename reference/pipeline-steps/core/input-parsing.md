# Input Parsing

**Purpose**: Parse raw user input from various sources and extract structured information.

**Input**: {INPUT_SOURCES}
**Output**: Parsed input data organized by type and source
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: N/A (first step)
- Next: Input Organization
- Process Steps: Validation Loop (after completion)

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Parsing Tasks**:

1. **Identify Input Types**
   - Free-form text descriptions
   - User stories
   - Feature requests
   - Bug reports
   - User feedback
   - VTT files (video transcripts)
   - Text transcripts
   - User observation recordings
   - Temporal flow descriptions

2. **Parse Each Input Type**
   For each input source:
   - Extract key actions mentioned
   - Identify user goals and intentions
   - Extract interaction patterns
   - Identify data entities mentioned
   - Extract timing information
   - Identify visual elements
   - Extract error scenarios
   - Identify edge cases
   - Note temporal sequences (for VTT/transcripts)

3. **Extract Structured Information**
   - User goals: List of goals with descriptions
   - Actions: List of actions with context
   - Data entities: List of data mentioned
   - Interaction patterns: Patterns identified
   - Visual elements: UI elements mentioned
   - Timing information: When actions occur
   - Error scenarios: Error cases mentioned
   - Edge cases: Edge cases identified
   - Temporal flows: Sequence information (if applicable)

**Output Format**:
```markdown
## Parsed Input Summary

### Input Sources
1. [Source Type]: [Description]
   - Source: [File/Text/URL]
   - Type: [text/vtt/transcript/user-story/etc]
   - Length: [character count/duration]

### Extracted Information

#### User Goals
1. [Goal description]
   - Context: [Where mentioned]
   - Priority: [High/Medium/Low if indicated]

#### Actions Identified
1. [Action description]
   - Context: [Where mentioned]
   - Related goals: [Goal IDs]
   - Timing: [When mentioned, if applicable]

#### Data Entities
1. [Entity name]
   - Attributes mentioned: [List]
   - Context: [Where mentioned]

#### Interaction Patterns
1. [Pattern description]
   - Context: [Where mentioned]
   - Related actions: [Action IDs]

#### Visual Elements
1. [Element description]
   - Context: [Where mentioned]
   - Related actions: [Action IDs]

#### Timing Information
1. [Timing description]
   - Context: [Where mentioned]
   - Related actions: [Action IDs]

#### Error Scenarios
1. [Error description]
   - Context: [Where mentioned]
   - Related actions: [Action IDs]

#### Edge Cases
1. [Edge case description]
   - Context: [Where mentioned]
   - Related actions: [Action IDs]

#### Temporal Flows (if applicable)
1. [Flow description]
   - Sequence: [Order of actions]
   - Timing: [Timestamps or relative timing]
   - Context: [Where mentioned]

### Parsing Quality Assessment
- Completeness: [High/Medium/Low]
- Ambiguities: [List any ambiguous items]
- Missing information: [What might be missing]
- Confidence: [High/Medium/Low]
```

**Quality Criteria**:
- All input sources are parsed
- Key information is extracted
- Relationships between extracted items are identified
- Temporal information is preserved (if applicable)
- Ambiguities are noted
- Confidence levels are assessed

