# Feature Specification Prompt Creation Application

A modular application for creating, organizing, and managing prompts for feature specification. Similar UI/UX to twodo but adapted for prompt template management.

## Tools

### Specification Quality Checker
A tool to validate specification documents for completeness, specificity, consistency, and coverage.

**Usage:**
1. Open `tools/quality-checker-ui.html` in a browser
2. Paste your Complete Implementation Specification
3. Click "Check Quality" to get a detailed report

The checker validates:
- **Completeness**: All required sections and components present
- **Specificity**: No vague terms or placeholders
- **Consistency**: No contradictions in definitions
- **Coverage**: Edge cases and error handling documented

### Post-Implementation Validation
A process step that compares generated code against the specification to identify gaps and mismatches.

**When to use:** After an LLM generates implementation code from your specification.

**How to use:**
1. Complete the "Implementation Specification" step
2. Use the specification to generate code with an LLM
3. Invoke "Post-Implementation Validation" process step
4. Paste both the specification and generated code
5. Review the validation report for gaps and mismatches

## Features

- **Multiple Pages**: Organize prompt templates across different pages
- **Element Types**:
  - **Task**: Simple checkbox with prompt text
  - **Header**: Section divider (non-interactive)
  - **Header with Checkbox**: Section divider with completion tracking
  - **Subtask**: Nested prompts with dropdown checklist
  - **Multi-checkbox**: Multiple checkboxes on one line (add/remove items)
  - **One-time Elements**: Deleted automatically when completed (don't repeat)

- **Metadata on Hover**: See time allocated and fun modifier text by hovering over elements
- **Persistent Storage**: All data saved in browser localStorage
- **Import/Export**: Load and save prompt templates as JSON files
- **Drag and Drop**: Reorder pages and elements via drag-and-drop
- **Context Menus**: Right-click or double-click for contextual actions
- **Keyboard Shortcuts**: Quick element creation with Ctrl+Shift+1-5
- **Settings**: Customize application appearance

## Usage

### Starting the Server

The app loads reference documents from the local `reference/` directory within `feat-spec/`. **The server must run from the project root** (not from the `feat-spec/` directory) so that paths resolve correctly.

**Option 1: Use the provided server script (recommended)**
```bash
cd feat-spec
./serve.sh 8050
```

**Option 2: Run Python server manually from project root**
```bash
cd /path/to/project/root  # C:/Project/ki-fu
python3 -m http.server 8050 --bind 0.0.0.0
```

Then open `http://localhost:8050/feat-spec` in your browser.

**Important**: The server must run from the project root so that `feat-spec/reference/` is accessible.

### Adding Elements

Click "+ Add Element" on any page to add a new element. Choose from:
1. Task
2. Header
3. Header with Checkbox
4. Multi-checkbox
5. One-time Element

### Managing Prompts

- **Check elements**: Click checkbox or element text to toggle completion
- **Edit page titles**: Double-click on the page title to edit
- **Delete pages**: Click "Delete" button on a page
- **Add/remove multi-checkbox items**: Use the + Add button and × buttons on each item
- **View subtasks**: Click the dropdown toggle to expand/collapse subtasks

### Keyboard Shortcuts

- **Ctrl+Shift+1**: Add task element
- **Ctrl+Shift+2**: Add header element
- **Ctrl+Shift+3**: Add header-checkbox element
- **Ctrl+Shift+4**: Add multi-checkbox element
- **Ctrl+Shift+5**: Add one-time element
- **Ctrl+N**: Show add element modal

## File Structure

- `index.html` - Main app structure
- `app.js` - Application logic and state management
- `app.css` - Styling
- `README.md` - This file
- `modules/` - JavaScript modules (EventSystem, StateManager, PipelineConfig, PromptLoader, ReferenceDocuments, etc.)
- `reference/` - Reference documents (consolidated)
  - `feature-spec-reference.md` - Complete reference (terminology, taxonomy, dependencies, validation)
  - `master-pipeline-template.md` - Pipeline prompts with fixed numbering (R1-R3, 1-10)
- `docs/` - Generated specification documents

## Data Storage

All data is stored in browser localStorage with the key `prompt-spec-data`. The application state includes:
- Pages and elements
- Page collapse states
- Subtask visibility states
- Settings

## Implementation

This application is implemented based on the complete feature specification found in `feat-spec/docs/3-final/complete-specification.md`. The implementation follows the modular architecture described in the specification while maintaining the same UI/UX patterns as the original twodo application.

