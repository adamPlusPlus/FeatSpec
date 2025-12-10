# User Description Parsing and Feature Mapping

**Purpose**: Parse user descriptions as research source for Case 3 (User Input Analysis). Can be sole input or supplementary when enhancing existing features from Case 1/2. This prompt is used with the `user-input` modifier in the Research and Feature Extraction steps of the Core Workflow.

**Input**: 
- User descriptions (unstructured text, user stories, feature requests, bug reports, user feedback)
- Existing feature documentation (optional - when enhancing features from Case 1 or Case 2)

**Workflow Context**: 
- **Case**: Case 3 (User Input Analysis)
- **Workflow Step**: Research (with `user-input` modifier) and Feature Extraction (with `user-input` modifier)
- **Modifiers Used**: `user-input` (for new features), `enhancement-input` + `user-input` (when enhancing existing features)
- **Process Steps**: Integration Loop (when combining with Case 1/2 outputs), Validation Loop (after parsing)
- **Reference**: See [WORKFLOW-GUIDE.md](WORKFLOW-GUIDE.md) for complete workflow context

**Cross-Reference**: 
- Uses existing features from Case 1 or Case 2 when enhancing (with `enhancement-input` modifier)
- Output feeds into Core Workflow steps (App Analysis, Decomposition, or Atomic Features)
- Can shortcut to specific steps when enhancing existing features
- See Combining Cases section in WORKFLOW-GUIDE.md for chaining with other cases

---

## Prompt

```
Parse and map user descriptions to existing features or identify new features.

User Description: {USER_DESCRIPTION}
Existing Features: {EXISTING_FEATURES}

For the user description, perform:

1. **Description Analysis**
   - Extract key actions mentioned
   - Identify user goals
   - Extract interaction patterns
   - Identify data mentioned
   - Extract timing information
   - Identify visual elements

2. **Feature Matching**
   - Match to existing atomic features
   - Match to existing composite features
   - Identify partial matches
   - Identify related features
   - Calculate match confidence

3. **Gap Analysis**
   - Identify aspects not covered by existing features
   - Determine if new feature needed
   - Identify feature variations
   - Identify edge cases not covered

4. **Feature Mapping**
   - Map description to existing features
   - Create feature references
   - Identify feature relationships
   - Document mapping confidence

5. **New Feature Identification**
   - Identify if new feature is needed
   - Extract new feature requirements
   - Classify new feature (atomic/composite)
   - Identify feature category

**Parsing Guidelines:**
- Use fuzzy matching for similar concepts
- Consider synonyms and variations
- Look for implicit requirements
- Identify missing information
- Document assumptions
- **When using `user-input` modifier**: Treat user descriptions as primary research source
- **When using `enhancement-input` + `user-input` modifiers**: Parse existing features first, then enhance with user descriptions
- **Integration Loop**: When combining with Case 1/2 outputs, resolve conflicts and integrate complementary information
- **Validation Loop**: After parsing, check completeness and identify gaps

**Output Format:**
```markdown
## User Description Parsing

### User Description
[Original user description]

### Analysis
- **Key Actions**: [list of actions identified]
- **User Goals**: [list of goals]
- **Interaction Patterns**: [patterns identified]
- **Data Mentioned**: [data entities identified]
- **Timing**: [timing information extracted]
- **Visual Elements**: [UI elements mentioned]

### Feature Matching

#### Exact Matches
- **Feature**: [Feature ID] - [Feature Name]
  - **Match Confidence**: [High/Medium/Low]
  - **Matched Aspects**: [what aspects match]
  - **Unmatched Aspects**: [what doesn't match]

#### Partial Matches
- **Feature**: [Feature ID] - [Feature Name]
  - **Match Confidence**: [High/Medium/Low]
  - **Matched Aspects**: [what aspects match]
  - **Unmatched Aspects**: [what doesn't match]
  - **Variations**: [how it differs]

#### Related Features
- **Feature**: [Feature ID] - [Feature Name]
  - **Relationship**: [how it's related]
  - **Relevance**: [High/Medium/Low]

### Gap Analysis
- **Covered Aspects**: [what existing features cover]
- **Uncovered Aspects**: [what's not covered]
- **New Feature Needed**: [Yes/No]
- **Feature Variations**: [variations identified]

### Feature Mapping
- **Primary Feature**: [Feature ID] - [Feature Name]
- **Related Features**: [list]
- **Feature Flow**: [how features connect]
- **Mapping Confidence**: [High/Medium/Low]

### New Feature Requirements (if needed)
- **Feature Name**: [proposed name]
- **Category**: [System/UI/Interaction/Data]
- **Type**: [Atomic/Composite]
- **Requirements**: [what it must do]
- **Relationships**: [to existing features]

### Recommendations
- **Action**: [what to do with this description]
- **Documentation Updates**: [what to update]
- **New Features**: [if new features needed]
- **Clarifications Needed**: [what to ask user]
```

**Quality Criteria:**
- All aspects of description analyzed
- Features matched with confidence levels
- Gaps identified
- Mapping documented
- New features identified if needed
- Recommendations provided
```

---

## Processing Workflow

### Case 3: Creating New Features (No Existing Features)

**Workflow Steps**:
1. **Research** (with `user-input` modifier)
   - Use this prompt to parse user descriptions
   - Extract key concepts, actions, goals
   - Build research knowledge base
   - **Validation Loop**: Check if all descriptions parsed

2. **Feature Extraction** (with `user-input` modifier)
   - Extract features from parsed descriptions
   - Identify gaps
   - Capture non-feature attributes
   - **Validation Loop**: Check extraction completeness

3. Continue through Core Workflow (App Analysis → Decomposition → Atomic Features → UX Specification)

### Case 3: Enhancing Existing Features (With Case 1/2 Output)

**Shortcut Options** (can start at any appropriate step):

**Option A: Start at App Analysis** (if new features identified)
- **Research** (with `enhancement-input` + `user-input` modifiers)
  - Parse existing feature documentation (from Case 1/2)
  - Parse user descriptions
  - **Integration Loop**: Resolve conflicts between existing and new information
- **Feature Extraction** (with `enhancement-input` + `user-input` modifiers)
  - Extract enhancement opportunities
  - Extract new features from user descriptions
  - **Integration Loop**: Integrate enhancements
- Continue from App Analysis

**Option B: Start at Decomposition** (if gaps in existing decomposition)
- Use `enhancement-input` modifier
- Enhance existing decomposition with user-described components

**Option C: Start at Atomic Features** (if enhancing existing atomic features directly)
- Use `enhancement-input` modifier
- Enhance existing atomic feature descriptions
- Add temporal details, flow sequences, feel, visual descriptions from user input

### Step-by-Step Processing

1. **Description Analysis**
   - LLM uses this prompt to parse user description
   - Extract key concepts, actions, goals
   - Identify interaction patterns
   - **If enhancing**: Parse existing features first, then enhance

2. **Feature Matching** (if existing features available)
   - LLM searches existing feature documentation
   - Compares description to existing features
   - Calculates match confidence
   - Identifies gaps
   - **Integration Loop**: Resolve conflicts

3. **Mapping and Recommendations**
   - LLM maps description to existing features (if enhancing)
   - Identifies new features if needed
   - Provides recommendations for documentation updates
   - Generates feature IDs if new features needed

4. **Documentation Update**
   - Review LLM output
   - Update feature documentation based on recommendations
   - Create new features if identified
   - Ensure no redundancy
   - **Validation Loop**: Check update completeness

---

## Quality Checklist

- ✓ Description fully analyzed
- ✓ Features matched with confidence
- ✓ Gaps identified
- ✓ Mapping documented
- ✓ New features identified if needed
- ✓ Recommendations provided
- ✓ Documentation updated (if applicable)

---

## Cross-Reference

- **Input**: 
  - User descriptions (primary input for Case 3)
  - Existing Features (optional - when enhancing Case 1/2 outputs)
- **Output**: 
  - Feature mappings, new feature requirements, documentation updates
  - Feeds into Core Workflow steps (App Analysis, Decomposition, or Atomic Features)
- **Related**: 
  - Case 3 (User Input Analysis) - primary case
  - Case 1 (Codebase Analysis) - can provide existing features to enhance
  - Case 2 (UI/UX-Only Analysis) - can provide existing features to enhance
  - Combining Cases - see WORKFLOW-GUIDE.md for chaining strategies
- **Modifiers**: 
  - `user-input` - for parsing user descriptions
  - `enhancement-input` - for handling Case 1/2 outputs
- **Process Steps**: 
  - Integration Loop - when combining with Case 1/2 outputs
  - Validation Loop - after parsing and updates

