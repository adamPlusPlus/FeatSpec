# Feature Specification System Application - Redesign Plan

## Purpose

Transform the current generic prompt creation application into a specialized tool for using and refining the Feature Specification System pipeline.

## Core Concept

**Projects** = Feature specification runs (e.g., "iOS Home Screen Hold to Edit", "Drag and Drop System")
**Pipeline Sections** = Steps in the specification pipeline (0.0a, 0.0b, 0.0c, 0a, 0b, 0c, 1, 1.5, 1.6, 2, 2.5, 2.6, 3)
**Reference Documents** = Quick access to terminology, taxonomy, quality metrics, etc.

---

## New Application Structure

### 1. Project Management (Replaces Generic "Pages")

Each **Project** represents one complete feature specification run:

```
Project: "iOS Home Screen Hold to Edit"
├── Metadata
│   ├── Project Name
│   ├── Target Feature Description
│   ├── Created Date
│   ├── Last Modified
│   └── Status (Draft, In Progress, Complete)
├── Pipeline Sections (ordered list)
│   ├── 0.0a: Research Summary
│   ├── 0.0b: Extracted Features
│   ├── 0.0c: Validation Report
│   ├── 0a: Feature Inventory
│   ├── 0b: Decomposed Features
│   ├── 0c: Atomic Features
│   ├── 1: UX Specification
│   ├── 1.5: UX Validation
│   ├── 1.6: Dependency Map
│   ├── 2: Implementation Spec
│   ├── 2.5: Implementation Validation
│   ├── 2.6: Integration Interface
│   └── 3: Final Assembly
└── Settings
    └── Workflow Type (UX-Only vs Full Pipeline)
```

### 2. Pipeline Section Structure

Each **Pipeline Section** contains:

```javascript
{
  sectionId: "0.0a",  // Unique identifier
  sectionName: "Initial Research and Documentation Scanning",
  status: "not_started" | "in_progress" | "complete" | "needs_revision",
  validationStatus: "pending" | "pass" | "fail",  // For validation sections
  prompt: "...",  // Full prompt from master-pipeline-template.md
  input: "...",  // User-provided input for this section
  output: "...",  // LLM-generated output
  dependencies: ["0.0a"],  // Sections that must be complete first
  notes: "...",  // User notes/refinements
  lastModified: "2024-01-01T00:00:00Z"
}
```

### 3. Reference Documents Panel

**Sidebar/Collapsible Panel** providing quick access to:

- **Master Terminology** (`master-terminology.md`)
- **Feature Taxonomy** (`feature-taxonomy.md`)
- **Dependency Mapping** (`dependency-mapping.md`)
- **Quality Metrics Checklist** (`quality-metrics-checklist.md`)
- **Validation Rules** (`validation-rules.md`)
- **Master Pipeline Template** (full document with TOC)

**Features:**
- Search within documents
- Quick links to specific sections
- Copy terminology/definitions
- Highlight relevant sections based on current pipeline step

---

## User Workflow

### Workflow 1: Starting a New Project

1. **Create New Project**
   - Click "New Project" button
   - Enter project name (e.g., "iOS Home Screen Hold to Edit")
   - Enter target feature description
   - Select workflow type (UX-Only or Full Pipeline)
   - System creates project with all pipeline sections initialized

2. **Navigate to First Section**
   - System highlights first incomplete section
   - Shows section prompt template
   - Shows empty input/output fields

3. **Work Through Sections**
   - For each section:
     - Review prompt template
     - Enter input (or paste from previous section output)
     - Copy prompt + input to LLM
     - Paste LLM output back into application
     - Mark section as complete
     - System enables next section

### Workflow 2: Working on a Section

**Section View** shows:

```
┌─────────────────────────────────────────────────┐
│ Section 1: UX Outline Generation               │
│ Status: [●] In Progress                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Prompt Template]                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Create an extremely detailed UX...         │ │
│ │ [Full prompt from template]                │ │
│ │ [Copy Prompt] button                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Input]                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Text area for user input]                 │ │
│ │ [Paste from Previous Section] button        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Output]                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Text area for LLM output]                │ │
│ │ [Mark Complete] [Needs Revision] buttons   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Notes]                                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ [User notes/refinements]                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Navigation]                                    │
│ [← Previous] [Next →] [Jump to Section...]     │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- **Copy Prompt** button: Copies prompt template + current input to clipboard
- **Paste from Previous Section**: Auto-fills input from previous section's output
- **Mark Complete**: Marks section as done, enables next section
- **Needs Revision**: Marks section for rework
- **Reference Links**: Quick links to relevant reference documents

### Workflow 3: Pipeline Navigation

**Pipeline Flow View** (alternative view):

```
┌─────────────────────────────────────────────────┐
│ Pipeline Progress                               │
├─────────────────────────────────────────────────┤
│                                                  │
│ [●] 0.0a: Research Summary          ✓ Complete │
│ [●] 0.0b: Extracted Features        ✓ Complete │
│ [●] 0.0c: Validation Report         ✓ Complete │
│ [●] 0a: Feature Inventory          ✓ Complete │
│ [●] 0b: Decomposed Features         ✓ Complete │
│ [●] 0c: Atomic Features             ✓ Complete │
│ [○] 1: UX Specification            ⏳ In Progress │
│ [ ] 1.5: UX Validation            🔒 Locked   │
│ [ ] 1.6: Dependency Map            🔒 Locked   │
│ [ ] 2: Implementation Spec          🔒 Locked   │
│ ...                                              │
│                                                  │
│ [Jump to Section...] [Export Final Spec]        │
└─────────────────────────────────────────────────┘
```

**Status Indicators:**
- `[●]` = Complete
- `[○]` = In Progress
- `[ ]` = Not Started
- `[⚠]` = Needs Revision
- `🔒` = Locked (dependencies not met)

### Workflow 4: Reference Documents

**Reference Panel** (sidebar or modal):

```
┌─────────────────────────────────┐
│ Reference Documents              │
├─────────────────────────────────┤
│                                 │
│ 📖 Master Terminology           │
│ 📖 Feature Taxonomy             │
│ 📖 Dependency Mapping            │
│ 📖 Quality Metrics               │
│ 📖 Validation Rules              │
│ 📖 Master Pipeline Template      │
│                                 │
│ [Search References...]          │
│                                 │
│ Current Section Context:        │
│ • Section 1: UX Generation      │
│ • Relevant: Terminology,        │
│   Quality Metrics               │
│                                 │
│ [Quick Copy: action1, action2]  │
└─────────────────────────────────┘
```

---

## UI/UX Changes

### Main Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                       │
│ [File ▼] [⚙️ Settings] [📚 References]                    │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Projects │  Main Content Area                               │
│ Sidebar  │  (Section View or Pipeline Flow View)           │
│          │                                                  │
│ • iOS    │                                                  │
│   Hold   │                                                  │
│ • Drag   │                                                  │
│   Drop   │                                                  │
│ • ...    │                                                  │
│          │                                                  │
│ [+ New]  │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Section View Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Section 1: UX Outline Generation                           │
│ Status: [●] In Progress  [← Prev] [Next →] [Jump...]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Prompt Template]                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Create an extremely detailed UX specification...       │ │
│ │ [Full prompt text, collapsible]                        │ │
│ │ [Copy Prompt + Input] [View in Template]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Input] (Required for this section)                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Atomic Feature Descriptions:                           │ │
│ │ [OUTPUT_FROM_SECTION_0C]                                │ │
│ │                                                         │ │
│ │ [Text area - large, markdown support]                  │ │
│ │ [Paste from Section 0c] [Clear]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Output] (LLM-generated)                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ # UX Specification                                      │ │
│ │                                                         │ │
│ │ [Text area - large, markdown preview]                  │ │
│ │ [Mark Complete] [Needs Revision] [Copy Output]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Notes & Refinements]                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Text area - smaller, for user notes]                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Dependencies]                                               │
│ • Requires: Section 0c (Complete ✓)                        │
│ • Feeds into: Section 1.5, 1.6                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Smart Section Management

- **Auto-enable sections** based on dependencies
- **Auto-fill inputs** from previous section outputs
- **Validation checks** before allowing next section
- **Status tracking** across all sections

### 2. Prompt Template Integration

- **Load prompts** directly from `master-pipeline-template.md`
- **Substitute placeholders** (e.g., `[OUTPUT_FROM_SECTION_0C]`) with actual content
- **Copy formatted prompts** ready for LLM
- **Track prompt versions** if templates are updated

### 3. Reference Document Integration

- **Embed reference documents** in sidebar
- **Search across all references**
- **Context-aware suggestions** (show relevant terms for current section)
- **Quick copy** common terminology/definitions

### 4. Export & Import

- **Export project** as JSON (all sections, inputs, outputs)
- **Export final specification** (Section 3 output as markdown)
- **Import project** from JSON
- **Export individual sections** as markdown

### 5. Refinement Tools

- **Compare outputs** across different runs
- **Track changes** to prompts/outputs
- **Notes system** for documenting refinements
- **Validation history** (track validation passes/fails)

---

## Data Structure

### Project Data Model

```javascript
{
  id: "project-123",
  name: "iOS Home Screen Hold to Edit",
  description: "Specification for iOS home screen hold-to-edit interaction",
  workflowType: "full" | "ux-only",
  createdAt: "2024-01-01T00:00:00Z",
  lastModified: "2024-01-01T00:00:00Z",
  status: "in_progress" | "complete" | "draft",
  sections: [
    {
      sectionId: "0.0a",
      sectionName: "Initial Research and Documentation Scanning",
      status: "complete",
      validationStatus: null,
      prompt: "...",  // Full prompt from template
      input: "...",    // User input
      output: "...",   // LLM output
      dependencies: [],
      notes: "",
      lastModified: "2024-01-01T00:00:00Z"
    },
    // ... more sections
  ],
  metadata: {
    version: "1.0",
    pipelineVersion: "1.0"  // Version of master-pipeline-template.md used
  }
}
```

---

## Implementation Plan

### Phase 1: Core Restructure
1. Replace "Pages" concept with "Projects"
2. Replace "Elements" concept with "Pipeline Sections"
3. Update data model and state management
4. Create section data structure

### Phase 2: Section Management
1. Implement section view UI
2. Add prompt template loading
3. Add input/output text areas
4. Implement status tracking
5. Add dependency checking

### Phase 3: Navigation & Flow
1. Create pipeline flow view
2. Implement section navigation
3. Add progress indicators
4. Add auto-enable/disable logic

### Phase 4: Reference Integration
1. Create reference documents panel
2. Load and display reference documents
3. Add search functionality
4. Add quick copy features

### Phase 5: Export/Import
1. Implement project export/import
2. Add final specification export
3. Add section export

### Phase 6: Refinement Tools
1. Add notes system
2. Add comparison tools
3. Add validation tracking
4. Add change history

---

## Migration Strategy

### Existing Data
- Convert existing "pages" to "projects" (if any)
- Map existing "elements" to appropriate pipeline sections
- Preserve user data during transition

### Default Project
- Create sample project showing pipeline structure
- Include example inputs/outputs for reference

---

## Benefits

1. **Focused Workflow**: Application is purpose-built for feature specification
2. **Reduced Cognitive Load**: All prompts, references, and outputs in one place
3. **Progress Tracking**: Clear visibility into pipeline completion
4. **Easy Refinement**: Track changes and iterate on prompts/outputs
5. **Reference Access**: Quick access to terminology and guidelines
6. **Export Ready**: Easy export of final specifications

---

## Next Steps

1. Review and approve this design
2. Create detailed UI mockups for key screens
3. Implement Phase 1 (Core Restructure)
4. Iterate based on user feedback

