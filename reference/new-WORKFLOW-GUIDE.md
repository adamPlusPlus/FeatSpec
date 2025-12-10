# Feature Documentation Workflow Guide

> **For Prompt Templates**: See individual prompt files in this directory.

## Overview

This guide explains how to use the feature documentation workflow to create comprehensive, atomic feature descriptions from various input sources. The workflow supports multiple scenarios: codebase analysis, UI/UX-only observation, and user descriptions (including VTT/transcripts).

## Prompt Templates

### Research and Feature Extraction
- **Research Summary**: Identify all documentation sources
- **Feature Extraction**: Extract features from code and documentation
- **Research Validation**: Validate extracted features
- **App Analysis and Feature Inventory**: Create feature inventory
- **Feature Decomposition**: Break features into components
- **Atomic Feature Description Generation**: Create atomic feature descriptions

### UI/UX-Only Inference (No Codebase)
- **Data Model Inference**: Infer data structures from UI observations
- **State Machine Inference**: Infer states from UI behavior
- **API Contract Inference**: Infer operations from interactions
- **Behavioral Implementation Specification**: Create implementation-agnostic specs

### User Input Processing
- **User Description Parsing**: Parse unstructured descriptions and map to features
- **VTT/Transcript Processing**: Process temporal transcripts with flow and feel

## Core Workflow (Shared Steps)

All cases that create new atomic features share these core steps:

1. **Research**: Identify and document all available sources
2. **Feature Extraction**: Extract features from available sources
3. **Validation**: Validate extracted features
4. **App Analysis**: Create feature inventory
5. **Decomposition**: Break features into components
6. **Atomic Features**: Create atomic feature descriptions
7. **UX Specification**: Generate UX specs

---

## Process Steps (Explicit Decision Points)

These are generalized process steps that can be invoked at any point in the workflow as explicit decision points:

### Validation Loop

**When to invoke**: After any step that produces output (Research, Feature Extraction, App Analysis, Decomposition, Atomic Features)

**Decision Process**:
1. Assess completeness of current output
2. Identify gaps or missing information
3. Determine if iteration is needed
4. If gaps found → Return to appropriate step with gap information
5. If complete → Continue to next step

**Output**: Decision (CONTINUE / ITERATE) with gap analysis

---

### Refinement Loop

**When to invoke**: When complex elements are identified (pseudocode, composite features, complex descriptions)

**Decision Process**:
1. Identify complex elements that need further decomposition
2. Assess if element can be atomized further
3. If yes → Apply atomization process
4. If no → Mark as atomic and continue

**Output**: Refined/atomized elements or decision to mark as atomic

---

### Integration Loop

**When to invoke**: When combining outputs from multiple sources or cases

**Decision Process**:
1. Identify conflicting information
2. Resolve conflicts (prioritize, merge, or flag)
3. Integrate complementary information
4. Validate integrated output
5. If conflicts unresolved → Flag for manual review
6. If integrated successfully → Continue

**Output**: Integrated output or flagged conflicts

---

## Core Step Modifiers

Instead of rewriting the core workflow, each step can be modified to adapt to different input sources. Modifiers are applied to core workflow steps based on the active case.

### Research Modifiers

#### `codebase-rag`
- Scan all documentation files (API docs, developer docs, README, etc.)
- Scan all code comments (inline, block, documentation comments)
- Scan all test files (unit tests, integration tests, test descriptions)
- Build searchable knowledge base
- Enable retrieval-augmented generation for subsequent steps

#### `ui-only`
- Document UI observations systematically
- Capture screenshots and interaction recordings
- Note visual elements and state changes
- Record timing information
- Document user feedback mechanisms

#### `user-input`
- Parse free-form text descriptions
- Parse VTT/transcripts (extract temporal information)
- Extract key actions, goals, patterns
- Build research knowledge base from user descriptions
- Map to existing features (if available)

#### `enhancement-input` (for Case 3 handling other case outputs)
- **Purpose**: Handle previous case output as input to current case
- Parse existing feature documentation (from Case 1 or Case 2 output)
- Extract structured information from previous case output
- Identify enhancement opportunities in existing features
- Build context for enhancement
- **Note**: This modifier is used when the output from a previously executed case becomes an input to the current case

---

### Feature Extraction Modifiers

#### `codebase-deep`
- Extract architecture patterns from code structure
- Extract formatting conventions and style patterns
- Identify atomic vs composite boundaries in code
- Extract implementation details
- Identify edge cases from code paths

#### `ui-only`
- Extract features from UI observations
- Infer feature boundaries from UI behavior
- Document visual and interaction patterns

#### `user-input`
- Extract features from parsed descriptions
- Map to existing features (if available)
- Identify gaps in existing documentation
- Capture non-feature attributes (context, feel, timing)

#### `enhancement-input`
- **Purpose**: Process previous case output as input during Feature Extraction
- Extract enhancement opportunities from existing features (from previous case output)
- Identify missing details in existing features
- Extract attributes that should be added to existing features

---

### Decomposition Modifiers

#### `codebase-pseudocode`
- Convert relevant code to pseudocode (only if it adds nuance to atomic definitions)
- Extract pseudocode for complex logic
- Apply pseudocode atomization if pseudocode is overly complex
- Recursively decompose complex pseudocode until atomic

**Pseudocode Atomization Process**:
1. Assess pseudocode complexity
2. If complex → Break into smaller pseudocode blocks
3. Repeat until each block is atomic
4. Map pseudocode blocks to atomic features

#### `standard`
- Break features into components
- Identify atomic vs composite
- Document component relationships

#### `enhancement-input`
- **Purpose**: Process previous case output as input during Decomposition
- Decompose enhancement opportunities (from previous case output)
- Break down missing details into atomic components
- Map enhancements to existing atomic features

---

### Validation Modifiers

#### `codebase`
- Cross-reference code with documentation
- Validate extracted features against implementation
- Check for missing code paths

#### `ui-only`
- Cross-reference UI observations
- Validate inferred features against observed behavior
- Check for missing UI states

#### `user-input`
- Validate parsed descriptions against existing features
- Check for redundancy
- Validate enhancement opportunities

---

## Atomizer Cases

The workflow handles three primary input scenarios. Each case uses the **Core Workflow** with appropriate modifiers. Cases can be chained together, with one case active at a time.

### Case 1: Codebase Analysis (Full Access)

**Scenario**: Complete access to source code, documentation, and implementation.

**Input Sources**:
- Source code files
- API documentation
- Developer documentation
- Code comments
- Test files

**Workflow**:

1. **Research** (with `codebase-rag` modifier)
   - Scan all documentation files
   - Scan all code comments
   - Scan all test files
   - Build searchable knowledge base
   - **Validation Loop**: Check if all sources identified
   - If gaps → Iterate research

2. **Feature Extraction** (with `codebase-deep` modifier)
   - Extract architecture patterns
   - Extract formatting conventions
   - Identify atomic/composite boundaries
   - Extract implementation details
   - **Explicit Code Examination Steps**:
     - **Code Architecture Extraction**: Examine source structure, patterns, organization
     - **Code Formatting Analysis**: Extract formatting conventions, style patterns
     - **Atomic/Composite Identification**: Identify atomic vs composite elements in code
   - **Validation Loop**: Check if all relevant code examined
   - If gaps → Iterate feature extraction

3. **Validation** (with `codebase` modifier)
   - Cross-reference code with documentation
   - Validate extracted features against implementation
   - **Validation Loop**: Assess completeness
   - If incomplete → Return to Feature Extraction

4. **App Analysis**
   - Create feature inventory from extracted features
   - **Validation Loop**: Check inventory completeness

5. **Decomposition** (with `codebase-pseudocode` modifier)
   - Break features into components
   - **Pseudocode Extraction**: Convert relevant code to pseudocode (only if it adds nuance)
   - **Pseudocode Atomization**: If pseudocode is complex, recursively decompose
   - **Refinement Loop**: Check if all pseudocode atomized
   - If complex pseudocode remains → Continue atomization
   - **Validation Loop**: Check decomposition completeness

6. **Atomic Features**
   - Create atomic feature descriptions
   - Include pseudocode where it adds nuance
   - **Validation Loop**: Check if all features atomic

7. **UX Specification**
   - Generate UX specs from atomic features

**Output**: Complete atomic feature documentation with implementation details and pseudocode

**Can accept**: Case 3 inputs (user descriptions/VTT) as supplementary research source

---

### Case 2: UI/UX-Only Analysis (No Codebase)

**Scenario**: Only access to running application UI, no source code.

**Input Sources**:
- UI screenshots
- User observations
- Interaction recordings
- UI behavior notes
- Visual design elements

**Workflow**:

1. **Research** (with `ui-only` modifier)
   - Document UI observations systematically
   - Capture screenshots and recordings
   - **Validation Loop**: Check observation completeness

2. **Feature Extraction** (with `ui-only` modifier)
   - Extract features from UI observations
   - **Validation Loop**: Check extraction completeness

3. **Validation** (with `ui-only` modifier)
   - Cross-reference UI observations
   - **Validation Loop**: Assess completeness

4. **App Analysis**
   - Create feature inventory from UI
   - **Validation Loop**: Check inventory completeness

5. **Decomposition** (with `standard` modifier)
   - Break UI features into components
   - **Validation Loop**: Check decomposition completeness

6. **Atomic Features**
   - Create atomic feature descriptions
   - **Validation Loop**: Check if all features atomic

7. **UX Specification**
   - Generate UX specs

8. **Inference Steps** (after Atomic Features):
   - Data Model Inference: Infer data structures from UI
   - State Machine Inference: Infer states from UI behavior
   - API Contract Inference: Infer operations from interactions
   - Behavioral Implementation Specification: Create implementation-agnostic specs

**Output**: Atomic features with inferred implementation details

**Can accept**: Case 3 inputs (user descriptions/VTT) as supplementary research source

---

### Case 3: User Input Analysis

**Scenario**: Users provide unstructured descriptions, VTT files, or transcripts describing features or flows. Can also enhance existing features from Case 1 or Case 2.

**Input Sources**:
- Free-form text descriptions
- User stories
- Feature requests
- Bug reports with descriptions
- User feedback
- **VTT files** (video transcripts with timestamps)
- **Text transcripts**
- **User observation recordings**
- **Temporal flow descriptions**
- **Existing feature documentation** (from Case 1 or Case 2 output)

**Workflow**:

**Decision Point**: Does existing feature documentation exist?

**If NO existing features** (creating new features):

1. **Research** (with `user-input` modifier)
   - Parse user descriptions
   - Parse VTT/transcripts (extract temporal information)
   - Extract key actions, goals, patterns
   - Build research knowledge base
   - **Validation Loop**: Check if all input parsed

2. **Feature Extraction** (with `user-input` modifier)
   - Extract features from parsed descriptions
   - Identify gaps
   - Capture non-feature attributes
   - **Validation Loop**: Check extraction completeness

3. **Validation** (with `user-input` modifier)
   - Validate parsed descriptions
   - Check for redundancy
   - **Validation Loop**: Assess completeness

4. **App Analysis**
   - Create feature inventory
   - **Validation Loop**: Check inventory completeness

5. **Decomposition** (with `standard` modifier)
   - Break features into components
   - **Validation Loop**: Check decomposition completeness

6. **Atomic Features**
   - Create atomic feature descriptions
   - **Validation Loop**: Check if all features atomic

7. **UX Specification**
   - Generate UX specs

**If YES existing features** (enhancing existing features):

**Shortcut Options** (can start at any appropriate step):

- **Option A**: Start at **App Analysis** (if new features identified in user input)
  - Use `enhancement-input` modifier on Research/Feature Extraction
  - Add new features to existing inventory

- **Option B**: Start at **Decomposition** (if gaps in existing decomposition)
  - Use `enhancement-input` modifier
  - Enhance existing decomposition

- **Option C**: Start at **Atomic Features** (if enhancing existing atomic features)
  - Use `enhancement-input` modifier
  - Enhance existing atomic feature descriptions
  - Add temporal details, flow sequences, feel, visual descriptions

**Enhancement Process**:
1. **Research** (with `enhancement-input` + `user-input` modifiers)
   - Parse existing feature documentation
   - Parse user descriptions/VTT
   - Build enhancement context
   - **Integration Loop**: Resolve conflicts between existing and new information

2. **Feature Extraction** (with `enhancement-input` + `user-input` modifiers)
   - Extract enhancement opportunities
   - Identify missing details
   - Extract attributes to add
   - **Integration Loop**: Integrate enhancements

3. Continue through remaining steps with enhancement modifiers as needed

**Output**: 
- New feature documentation (if no existing features)
- Enhanced feature documentation (if existing features)
- Feature mappings and enhancements

**Can accept**: Case 1 or Case 2 outputs as existing feature documentation

---

## Combining Cases

Cases can be chained together, with **one case active at a time**. When combining cases:

### Strategy

1. **Identify Primary Case**: Determine which case (1, 2, or 3) is the primary workflow
2. **Execute Primary Case**: Complete one full pass of the primary case
3. **Hand Output to Next Case**: **The output from the primary case becomes an input to the next case**
4. **Identify Input Types**: Determine what inputs the next case needs:
   - Previous case output (use `enhancement-input` modifier)
   - New inputs for current case (use appropriate modifier: `user-input`, `codebase-rag`, `ui-only`)
5. **Apply Combined Modifiers**: Use modifiers that handle both:
   - Previous case output (`enhancement-input`)
   - New inputs for current case (case-specific modifiers)
6. **Execute Next Case**: Run the next case with combined modifiers
7. **Use Integration Loop**: When combining outputs, use Integration Loop process step

### Common Combinations

#### Case 1 → Case 3

**Scenario**: Codebase analysis, then enhance with user descriptions

**Process**:
1. Execute Case 1 (full workflow)
2. **Case 1 output becomes an input to Case 3** (existing feature documentation)
3. Execute Case 3 with combined modifiers:
   - `enhancement-input`: Handles Case 1 output as input
   - `user-input`: Handles new user descriptions as input
4. Use Integration Loop to merge enhancements

**Modifiers for Case 3**:
- Research: `enhancement-input` (Case 1 output) + `user-input` (new user descriptions)
- Feature Extraction: `enhancement-input` (Case 1 output) + `user-input` (new user descriptions)
- Decomposition: `enhancement-input` (Case 1 output, if needed)
- Atomic Features: `enhancement-input` (Case 1 output, if enhancing directly)

---

#### Case 2 → Case 3

**Scenario**: UI/UX-only analysis, then enhance with user descriptions

**Process**:
1. Execute Case 2 (full workflow)
2. **Case 2 output becomes an input to Case 3** (existing feature documentation)
3. Execute Case 3 with combined modifiers:
   - `enhancement-input`: Handles Case 2 output as input
   - `user-input`: Handles new user descriptions as input
4. Use Integration Loop to merge enhancements

**Modifiers for Case 3**:
- Research: `enhancement-input` (Case 2 output) + `user-input` (new user descriptions)
- Feature Extraction: `enhancement-input` (Case 2 output) + `user-input` (new user descriptions)
- Decomposition: `enhancement-input` (Case 2 output, if needed)
- Atomic Features: `enhancement-input` (Case 2 output, if enhancing directly)

---

#### Case 3 → Case 1

**Scenario**: User descriptions first, then codebase analysis to validate/enhance

**Process**:
1. Execute Case 3 (full workflow, creating new features)
2. **Case 3 output becomes an input to Case 1** (existing feature documentation)
3. Execute Case 1 with combined modifiers:
   - `codebase-rag`/`codebase-deep`: Handles codebase analysis (primary)
   - `enhancement-input`: Handles Case 3 output as input (for validation/enhancement)
4. Use Integration Loop to merge codebase findings with user descriptions

**Modifiers for Case 1**:
- Research: `codebase-rag` (primary) + `enhancement-input` (Case 3 output)
- Feature Extraction: `codebase-deep` (primary) + `enhancement-input` (Case 3 output for validation)

---

#### Case 3 → Case 2

**Scenario**: User descriptions first, then UI/UX analysis to validate/enhance

**Process**:
1. Execute Case 3 (full workflow, creating new features)
2. **Case 3 output becomes an input to Case 2** (existing feature documentation)
3. Execute Case 2 with combined modifiers:
   - `ui-only`: Handles UI observations (primary)
   - `enhancement-input`: Handles Case 3 output as input (for validation/enhancement)
4. Use Integration Loop to merge UI findings with user descriptions

**Modifiers for Case 2**:
- Research: `ui-only` (primary) + `enhancement-input` (Case 3 output)
- Feature Extraction: `ui-only` (primary) + `enhancement-input` (Case 3 output for validation)

---

### Decision Tree: Which Case to Use?

```text
Start
  ↓
What sources are available?
  ↓
┌─────────────────────────────────────────┐
│ Codebase available?                      │
│  Yes → Case 1: Codebase Analysis        │
│  No  → Continue                          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ UI/UX Observations only?                │
│  Yes → Case 2: UI/UX-Only Analysis     │
│  No  → Continue                          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ User Descriptions/VTT available?        │
│  Yes → Case 3: User Input Analysis     │
│  No  → End                               │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Multiple cases applicable?               │
│  Yes → Use Combining Cases strategy     │
│  No  → Execute selected case            │
└─────────────────────────────────────────┘
  ↓
Execute workflow with appropriate modifiers
  ↓
Use Process Steps (Validation/Refinement/Integration Loops) as needed
  ↓
Generate/Enhance atomic features
```

---

## Processing Approach

All processing is done through LLM prompts. The LLM will:
- Search existing feature documentation
- Compare descriptions to features
- Calculate match confidence
- Generate feature IDs when needed
- Provide recommendations for documentation updates
- Detect redundancy by comparing to existing docs
- Apply modifiers to core workflow steps
- Make decisions at Process Step decision points

---

## Workflow Examples

### Example 1: Case 1 (Codebase Analysis)

**Scenario**: You have complete access to source code and documentation.

**Workflow**:
1. **Research** (`codebase-rag`): Scan all docs, comments, tests
   - **Validation Loop**: All sources identified? → Continue
2. **Feature Extraction** (`codebase-deep`): Extract architecture, formatting, atomic/composite
   - Code Architecture Extraction
   - Code Formatting Analysis
   - Atomic/Composite Identification
   - **Validation Loop**: All code examined? → Continue
3. **Validation** (`codebase`): Cross-reference code with docs
   - **Validation Loop**: Complete? → Continue
4. **App Analysis**: Create feature inventory
5. **Decomposition** (`codebase-pseudocode`): Break into components, extract pseudocode
   - Pseudocode Extraction (if adds nuance)
   - **Refinement Loop**: Complex pseudocode? → Atomize recursively
   - **Validation Loop**: All decomposed? → Continue
6. **Atomic Features**: Create descriptions with pseudocode
7. **UX Specification**: Generate specs

---

### Example 2: Case 1 → Case 3 (Codebase + User Enhancement)

**Scenario**: You have codebase, then receive user descriptions to enhance features.

**Workflow**:

**Phase 1: Case 1**
1. Execute Case 1 (full workflow)
2. Output: Complete atomic feature documentation

**Phase 2: Case 3 (Enhancement)**
1. **Research** (`enhancement-input` + `user-input`): Parse existing features + user descriptions
   - **Integration Loop**: Conflicts? → Resolve
2. **Feature Extraction** (`enhancement-input` + `user-input`): Extract enhancements
   - **Integration Loop**: Integrate enhancements
3. **Shortcut to Atomic Features** (`enhancement-input`): Enhance existing atomic features
   - Add temporal details from VTT
   - Add feel and experience from descriptions
   - Add visual descriptions
   - **Validation Loop**: Enhancements complete? → Continue
4. **UX Specification**: Update specs with enhancements

---

### Example 3: Case 3 → Case 1 (User First, Then Codebase)

**Scenario**: User provides descriptions first, then codebase analysis validates/enhances.

**Workflow**:

**Phase 1: Case 3 (New Features)**
1. Execute Case 3 (full workflow, creating new features)
2. Output: Initial atomic feature documentation from user descriptions

**Phase 2: Case 1 (Validation/Enhancement)**
1. **Research** (`codebase-rag` + `user-input`): Scan codebase + use user descriptions as context
2. **Feature Extraction** (`codebase-deep` + `user-input`): Extract from code, validate against user descriptions
   - **Integration Loop**: Merge codebase findings with user descriptions
3. Continue through remaining steps
4. **Integration Loop**: Final merge of all sources

---

## Best Practices

1. **One case active at a time**: Don't mix modifiers from different cases in the same step
2. **Use Process Steps explicitly**: Invoke Validation/Refinement/Integration Loops at decision points
3. **Apply modifiers consistently**: Use appropriate modifiers for each core workflow step
4. **Chain cases properly**: Complete one case before starting the next
5. **Use Integration Loop when combining**: Always use Integration Loop when merging outputs from multiple cases
6. **Shortcut appropriately**: Case 3 can shortcut to specific steps when enhancing existing features
7. **Document modifier usage**: Note which modifiers were applied in each workflow execution

---

## Quality Assurance

### Case 1: Codebase Analysis
- ✓ All code paths analyzed
- ✓ All documentation scanned (RAG-like)
- ✓ Architecture patterns extracted
- ✓ Formatting conventions documented
- ✓ Pseudocode extracted where it adds nuance
- ✓ All pseudocode atomized
- ✓ API contracts documented
- ✓ Edge cases from code identified

### Case 2: UI/UX-Only Analysis
- ✓ All UI states observed
- ✓ All interactions documented
- ✓ Data models inferred with confidence
- ✓ State machines inferred
- ✓ API contracts inferred
- ✓ Assumptions clearly documented

### Case 3: User Input Analysis
- ✓ All descriptions/VTT parsed
- ✓ Temporal information preserved
- ✓ Features matched accurately (if existing)
- ✓ Gaps identified
- ✓ Enhancements integrated properly
- ✓ Non-feature attributes captured
- ✓ Confidence levels documented

### Combining Cases
- ✓ One case active at a time
- ✓ Appropriate modifiers applied
- ✓ Integration Loop used for merging
- ✓ Conflicts resolved
- ✓ Outputs properly handed between cases

---

## File Structure

```text
Docs/
├── prompts/
│   ├── data-model-inference.md
│   ├── state-machine-inference.md
│   ├── api-contract-inference.md
│   ├── behavioral-implementation-spec.md
│   ├── user-description-parsing.md
│   ├── vtt-transcript-processing.md
│   └── WORKFLOW-GUIDE.md (this file)
└── [feature documentation files]
```

---

## Cross-References

Each prompt includes:
- **Input**: What it uses
- **Output**: What it produces
- **Cross-Reference**: Related prompts
- **Modifiers**: Which modifiers apply (if applicable)

## Quality Checklists

Each prompt includes a quality checklist to ensure completeness. See individual prompt files for specific checklists.
