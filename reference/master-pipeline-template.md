# Master Pipeline Template

This document serves as an index to the modular, case-based pipeline system. The pipeline has been restructured to support three workflow cases with modifier injection.

## Overview

The pipeline is now organized into:
- **Core Steps**: Base workflow steps that work across all cases
- **Modifiers**: Step-specific adaptations for different input sources
- **Process Steps**: Decision points (Validation, Refinement, Integration Loops)
- **Case-Specific Extensions**: Inference steps (Case 2) and specialized prompts (Case 3)

## How to Use This System

### Using Individual Steps

1. Select a case (1, 2, or 3) based on available inputs
2. Navigate to the core step you need (see directory structure below)
3. Load the core step template
4. Apply appropriate modifiers based on case
5. Inject modifier content into core step template
6. Substitute variables ({CASE}, {MODIFIERS}, {PREVIOUS_OUTPUT}, etc.)
7. Use the step's output format

### Using Full Pipeline

1. **Select Case**: Determine which case applies (see workflow guide)
2. **Configure Workflow**: Use pipeline-config.json to get step/modifier mappings
3. **Execute Steps**: Run each step in order, applying modifiers
4. **Invoke Process Steps**: Use Validation/Refinement/Integration Loops as needed
5. **Handle Case-Specific Extensions**: 
   - Case 2: Run inference steps after atomic-features
   - Case 3: Use specialized prompts for Research/Feature Extraction

### Required References

All steps reference this consolidated document:
- **Feature Specification Reference**: `feature-spec-reference.md` - Contains terminology, taxonomy, dependency mapping, quality metrics, and validation rules

---

## Directory Structure

```
feat-spec/reference/
├── pipeline-steps/
│   ├── core/
│   │   ├── research.md
│   │   ├── feature-extraction.md
│   │   ├── validation.md
│   │   ├── app-analysis.md
│   │   ├── decomposition.md
│   │   ├── atomic-features.md
│   │   └── ux-specification.md
│   ├── modifiers/
│   │   ├── research/
│   │   │   ├── codebase-rag.md
│   │   │   ├── ui-only.md
│   │   │   ├── user-input.md
│   │   │   └── enhancement-input.md
│   │   ├── feature-extraction/
│   │   │   ├── codebase-deep.md
│   │   │   ├── ui-only.md
│   │   │   ├── user-input.md
│   │   │   └── enhancement-input.md
│   │   ├── validation/
│   │   │   ├── codebase.md
│   │   │   ├── ui-only.md
│   │   │   └── user-input.md
│   │   └── decomposition/
│   │       ├── codebase-pseudocode.md
│   │       ├── standard.md
│   │       └── enhancement-input.md
│   ├── process-steps/
│   │   ├── validation-loop.md
│   │   ├── refinement-loop.md
│   │   ├── integration-loop.md
│   │   ├── catom-refinement.md
│   │   └── catom-generation.md
│   ├── inference/
│   │   ├── data-model-inference.md
│   │   ├── state-machine-inference.md
│   │   ├── api-contract-inference.md
│   │   └── behavioral-implementation-spec.md
│   └── case3-specialized/
│       ├── user-description-parsing.md
│       └── vtt-transcript-processing.md
├── pipeline-config.json
└── workflow-guide.md (see new-WORKFLOW-GUIDE.md)
```

---

## Core Workflow Steps

All cases share these core steps (with different modifiers):

1. **Research** (`core/research.md`)
   - Identify and document all available sources
   - Modifiers: codebase-rag, ui-only, user-input, enhancement-input

2. **Feature Extraction** (`core/feature-extraction.md`)
   - Extract features from available sources
   - Modifiers: codebase-deep, ui-only, user-input, enhancement-input

3. **Validation** (`core/validation.md`)
   - Validate extracted features
   - Modifiers: codebase, ui-only, user-input

4. **App Analysis** (`core/app-analysis.md`)
   - Create feature inventory
   - No modifiers (works across all cases)

5. **Decomposition** (`core/decomposition.md`)
   - Break features into components
   - Modifiers: codebase-pseudocode, standard, enhancement-input

6. **Atomic Features** (`core/atomic-features.md`)
   - Create atomic feature descriptions
   - No modifiers (works across all cases)

7. **UX Specification** (`core/ux-specification.md`)
   - Generate UX specs
   - No modifiers (works across all cases)

---

## Case Configurations

### Case 1: Codebase Analysis
- Research: `codebase-rag`
- Feature Extraction: `codebase-deep`
- Validation: `codebase`
- Decomposition: `codebase-pseudocode`

### Case 2: UI/UX-Only Analysis
- Research: `ui-only`
- Feature Extraction: `ui-only`
- Validation: `ui-only`
- Decomposition: `standard`
- **Inference Steps** (after atomic-features):
  - Data Model Inference
  - State Machine Inference
  - API Contract Inference
  - Behavioral Implementation Specification

### Case 3: User Input Analysis
- Research: `user-input` (with specialized prompt option)
- Feature Extraction: `user-input` (with specialized prompt option)
- Validation: `user-input`
- Decomposition: `standard`
- **Specialized Prompts**:
  - User Description Parsing
  - VTT/Transcript Processing

---

## Process Steps

### Validation Loop
- **When**: After any output-producing step
- **Purpose**: Assess completeness and decide CONTINUE/ITERATE
- **File**: `process-steps/validation-loop.md`

### Refinement Loop
- **When**: When complex elements identified (pseudocode, composite features)
- **Purpose**: Atomize complex elements
- **File**: `process-steps/refinement-loop.md`

### Integration Loop
- **When**: When combining outputs from multiple sources/cases
- **Purpose**: Resolve conflicts and integrate information
- **File**: `process-steps/integration-loop.md`

### cAtom Refinement
- **When**: After Theoria step when cAtoms are extracted, or when cAtoms need clarification
- **Purpose**: Collaboratively refine and interpret cAtoms with the user
- **File**: `process-steps/catom-refinement.md`
- **Collaboration**: LLM presents findings → User provides feedback → LLM refines

### cAtom Generation
- **When**: When cAtoms interact or ccompounds break down, revealing new foundations
- **Purpose**: Create new cAtoms from cAtom collisions or ccompound decouplings
- **File**: `process-steps/catom-generation.md`
- **Collaboration**: LLM identifies opportunities → User validates/guides → LLM generates

---

## Variable Substitution

The app will substitute these variables in prompts:

- `{CASE}` - Case number (1, 2, or 3)
- `{MODIFIERS}` - List of active modifiers
- `{PREVIOUS_OUTPUT}` - Reference to previous step output
- `{INPUT_SOURCES}` - Available input sources
- `{EXISTING_FEATURES}` - Existing features (for enhancement)
- `{PROCESS_STEP_TRIGGERS}` - When to invoke process steps
- `{WORKFLOW_CONTEXT}` - Current workflow position
- `{USER_DESCRIPTION}` - User-provided description
- `{VTT_TRANSCRIPT}` - VTT/transcript content
- `{UX_SPECIFICATIONS}` - UX specification output
- `{DATA_MODELS_OUTPUT}` - Data model inference output
- `{STATE_MACHINES_OUTPUT}` - State machine inference output
- `{API_CONTRACTS_OUTPUT}` - API contract inference output
- `{ATOMIC_FEATURES_OUTPUT}` - Atomic features output

---

## Modifier System

### Base Modifiers
- Applied first when multiple modifiers active
- Case-specific: codebase-rag, codebase-deep, ui-only, user-input, codebase, codebase-pseudocode, standard

### Layering Modifiers
- Applied after base modifiers
- Can combine with base modifiers: enhancement-input

### Modifier Layering Rules
1. Process base modifiers first
2. Then process layering modifiers
3. Integration Loop required when enhancement-input combined with others
4. See modifier files for specific combination instructions

---

## Case Chaining

Cases can be chained together. See `pipeline-config.json` for chaining configurations:

- **Case 1 → Case 3**: Codebase analysis, then enhance with user descriptions
- **Case 2 → Case 3**: UI/UX analysis, then enhance with user descriptions
- **Case 3 → Case 1**: User descriptions first, then codebase validation
- **Case 3 → Case 2**: User descriptions first, then UI/UX validation

When chaining, use `enhancement-input` modifier to handle previous case output.

---

## Quick Reference

### Need to start a workflow?
1. Determine case based on available inputs
2. Load `pipeline-config.json` for case configuration
3. Start with Research step, apply appropriate modifiers

### Need a specific step?
- Navigate to `pipeline-steps/core/{step-name}.md`
- Load appropriate modifiers from `pipeline-steps/modifiers/{step-name}/`
- Inject modifier content into core step
- Substitute variables

### Need to combine cases?
- Use `enhancement-input` modifier
- Invoke Integration Loop after combining
- See `pipeline-config.json` caseChaining section

---

## Notes

- Each core step is a template with variable placeholders
- Modifiers are injectable content blocks
- Process steps are standalone prompts
- All files use `{VARIABLE}` syntax for substitution
- The app handles modifier layering programmatically
- See `new-WORKFLOW-GUIDE.md` for detailed workflow documentation
