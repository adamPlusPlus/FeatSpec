# VTT/Transcript Processing and Feature Expansion

**Purpose**: Process VTT/transcripts as input source for Case 3 (User Input Analysis). VTT files are processed as part of the `user-input` modifier in the Research step. This is merged into Case 3, not a separate case.

**Input**: 
- VTT files (video transcripts with timestamps)
- Text transcripts
- User observation recordings
- Temporal flow descriptions
- Existing feature documentation (optional - when enhancing features from Case 1 or Case 2)

**Workflow Context**: 
- **Case**: Case 3 (User Input Analysis) - VTT/transcripts are input sources, not a separate case
- **Workflow Step**: Research (with `user-input` modifier) - VTT processing happens here
- **Modifiers Used**: `user-input` (VTT is processed as part of user-input), `enhancement-input` + `user-input` (when enhancing existing features)
- **Process Steps**: Integration Loop (when combining with Case 1/2 outputs), Validation Loop (after processing)
- **Reference**: See [WORKFLOW-GUIDE.md](WORKFLOW-GUIDE.md) for complete workflow context

**Cross-Reference**: 
- Part of Case 3 (User Input Analysis) - merged with user description parsing
- Uses existing features from Case 1 or Case 2 when enhancing (with `enhancement-input` modifier)
- Output feeds into Core Workflow steps (App Analysis, Decomposition, or Atomic Features)
- See Combining Cases section in WORKFLOW-GUIDE.md for chaining with other cases

---

## Prompt

```
Process VTT/transcript descriptions and expand feature documentation systematically.

VTT/Transcript: {VTT_TRANSCRIPT}
Existing Features: {EXISTING_FEATURES}
Existing Atomic Features: {ATOMIC_FEATURES}

For the VTT/transcript, perform:

1. **Transcript Analysis**
   - Extract temporal information (timestamps, sequence)
   - Identify user actions described
   - Extract flow descriptions
   - Identify "feel" and subjective descriptions
   - Extract visual descriptions
   - Identify timing information
   - Extract error scenarios mentioned
   - Identify edge cases described

2. **Flow Extraction**
   - Map described flows to existing features
   - Identify flow sequences
   - Extract flow variations
   - Identify alternative paths
   - Extract decision points
   - Identify flow interruptions

3. **Feel and Experience Extraction**
   - Extract subjective descriptions (smooth, fast, confusing, etc.)
   - Identify emotional responses
   - Extract usability observations
   - Identify pain points
   - Extract positive experiences
   - Identify improvement suggestions

4. **Feature Mapping**
   - Map descriptions to existing features
   - Identify which features are being described
   - Calculate coverage (what's already documented)
   - Identify gaps (what's new)
   - Identify enhancements (what adds detail)

5. **Redundancy Detection**
   - Compare to existing documentation
   - Identify duplicate information
   - Identify conflicting information
   - Identify complementary information
   - Identify missing information

6. **Documentation Expansion**
   - Add new details to existing features
   - Add new edge cases
   - Add new timing information
   - Add new visual descriptions
   - Add new error scenarios
   - Add new flow variations
   - Create new features only if truly new

**Processing Guidelines:**
- Preserve temporal sequence from VTT
- Extract both objective (what happens) and subjective (how it feels)
- Map to existing features before creating new ones
- Avoid redundancy by comparing to existing docs
- Enhance existing features rather than duplicating
- Document confidence levels for extracted information
- **When using `user-input` modifier**: VTT processing is part of the Research step
- **When using `enhancement-input` + `user-input` modifiers**: Process existing features first, then enhance with VTT content
- **Integration Loop**: When combining with Case 1/2 outputs, resolve conflicts and integrate temporal/experiential details
- **Validation Loop**: After processing, check completeness and identify gaps

**Output Format:**
```markdown
## VTT/Transcript Processing

### Source Information
- **Source**: [VTT file/transcript name]
- **Duration**: [total duration]
- **Timestamp Range**: [start] - [end]
- **Speaker**: [if applicable]

### Transcript Analysis

#### Temporal Sequence
- **00:00-00:30**: [description of what happens]
- **00:30-01:00**: [description of what happens]
- [Continue for all segments]

#### User Actions Identified
- [Timestamp]: [action] - [description]
- [Timestamp]: [action] - [description]

#### Flow Descriptions
- **Flow**: [flow name]
  - **Sequence**: [step-by-step]
  - **Timing**: [duration information]
  - **Variations**: [alternative paths]

#### Feel and Experience
- **Subjective Descriptions**: 
  - [Timestamp]: "[quote]" - [interpretation]
- **Emotional Responses**: 
  - [Timestamp]: [emotion] - [trigger]
- **Usability Observations**: 
  - [Observation]: [impact]
- **Pain Points**: 
  - [Issue]: [description]
- **Positive Experiences**: 
  - [Aspect]: [description]

#### Visual Descriptions
- [Timestamp]: [visual element] - [description]
- [Timestamp]: [animation/transition] - [description]

### Feature Mapping

#### Existing Features Enhanced
- **Feature**: [Feature ID] - [Feature Name]
  - **New Details Added**:
    - [Detail 1]: [description]
    - [Detail 2]: [description]
  - **Edge Cases Added**:
    - [Edge case]: [description]
  - **Timing Refined**:
    - [Aspect]: [new timing information]
  - **Visual Details Added**:
    - [Element]: [description]
  - **Flow Variations Added**:
    - [Variation]: [description]
  - **Confidence**: [High/Medium/Low]

#### New Information (Not in Existing Features)
- **Information**: [description]
  - **Category**: [System/UI/Interaction/Data]
  - **Potential Feature**: [Yes/No]
  - **Confidence**: [High/Medium/Low]

#### Redundancy Check
- **Duplicate Information**: 
  - [Info]: Already documented in [Feature ID]
- **Conflicting Information**: 
  - [Info]: Conflicts with [Feature ID] - [resolution]
- **Complementary Information**: 
  - [Info]: Adds to [Feature ID] without duplication

### Documentation Updates

#### Features to Enhance
- **Feature**: [Feature ID]
  - **Additions**:
    - [Section]: [new content]
  - **Modifications**:
    - [Section]: [updated content]
  - **Reason**: [why this adds value]

#### New Features Needed
- **Feature**: [Proposed Name]
  - **Category**: [System/UI/Interaction/Data]
  - **Type**: [Atomic/Composite]
  - **Reason**: [why new feature needed]
  - **Requirements**: [what it must do]

### Recommendations
- **Priority Updates**: [which features to update first]
- **New Features**: [if any truly new features needed]
- **Clarifications**: [what needs follow-up]
- **Confidence**: [overall confidence in processing]
```

**Quality Criteria:**
- All temporal information preserved
- Flow sequences extracted
- Feel and experience captured
- Features mapped accurately
- Redundancy detected and avoided
- Documentation updates specified
- Confidence levels documented
```

---

## Processing Workflow

### Case 3: Creating New Features (No Existing Features)

**Workflow Steps**:
1. **Research** (with `user-input` modifier)
   - Extract text content from VTT file (preserve timestamps for temporal analysis)
   - Or use existing transcript text
   - Process VTT/transcript as part of user-input modifier
   - Extract temporal sequence, flows, feel, visual descriptions
   - Build research knowledge base
   - **Validation Loop**: Check if all VTT content processed

2. **Feature Extraction** (with `user-input` modifier)
   - Extract features from VTT content
   - Map temporal sequences to features
   - Extract feel and experience
   - **Validation Loop**: Check extraction completeness

3. Continue through Core Workflow (App Analysis → Decomposition → Atomic Features → UX Specification)

### Case 3: Enhancing Existing Features (With Case 1/2 Output)

**Shortcut Options** (can start at any appropriate step):

**Option A: Start at App Analysis** (if new features identified)
- **Research** (with `enhancement-input` + `user-input` modifiers)
  - Parse existing feature documentation (from Case 1/2)
  - Process VTT/transcript content
  - **Integration Loop**: Resolve conflicts between existing and new information
- **Feature Extraction** (with `enhancement-input` + `user-input` modifiers)
  - Extract enhancement opportunities
  - Extract temporal/experiential details from VTT
  - **Integration Loop**: Integrate enhancements
- Continue from App Analysis

**Option B: Start at Atomic Features** (if enhancing existing atomic features directly)
- Use `enhancement-input` modifier
- Enhance existing atomic feature descriptions with:
  - Temporal details from VTT timestamps
  - Flow sequences from transcript
  - Feel and experience from subjective descriptions
  - Visual descriptions from transcript

### Step-by-Step Processing

1. **VTT/Transcript Preparation**
   - Extract text content from VTT file (preserve timestamps for temporal analysis)
   - Or use existing transcript text
   - Prepare transcript for LLM processing

2. **LLM Processing**
   - Use this prompt to analyze transcript and extract information
   - Map to existing features (if enhancing)
   - Detect redundancy by comparing to existing documentation
   - Extract temporal sequence, flows, feel, visual descriptions
   - **Integration Loop**: When combining with Case 1/2 outputs

3. **Documentation Update**
   - Review LLM output for feature enhancements
   - Review LLM output for new features needed
   - Update feature documentation files based on LLM recommendations
   - Ensure no redundancy is introduced
   - **Validation Loop**: Check update completeness

---

## Quality Checklist

- ✓ All temporal information extracted
- ✓ Flow sequences documented
- ✓ Feel and experience captured
- ✓ Features mapped with confidence
- ✓ Redundancy detected
- ✓ Documentation updates specified
- ✓ New features identified if needed
- ✓ Confidence levels documented

---

## Cross-Reference

- **Input**: 
  - VTT files, transcripts, user observations (input sources for Case 3)
  - Existing Features (optional - when enhancing Case 1/2 outputs)
- **Output**: 
  - Enhanced feature documentation with temporal and experiential details
  - New feature requirements (if new features identified)
  - Feeds into Core Workflow steps (App Analysis, Decomposition, or Atomic Features)
- **Related**: 
  - Case 3 (User Input Analysis) - VTT/transcripts are input sources, merged with user description parsing
  - Case 1 (Codebase Analysis) - can provide existing features to enhance
  - Case 2 (UI/UX-Only Analysis) - can provide existing features to enhance
  - Combining Cases - see WORKFLOW-GUIDE.md for chaining strategies
- **Modifiers**: 
  - `user-input` - VTT processing is part of this modifier in Research step
  - `enhancement-input` - for handling Case 1/2 outputs
- **Process Steps**: 
  - Integration Loop - when combining with Case 1/2 outputs
  - Validation Loop - after processing and updates

