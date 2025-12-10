# Research

**Purpose**: Identify and document all available sources for feature analysis.

**Input**: {INPUT_SOURCES}
**Output**: Research summary with identified sources, key findings, gaps, and next steps
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: {PREVIOUS_STEP}
- Next: Feature Extraction
- Process Steps: Validation Loop (after completion)

---

## Input Guidance

**What to enter in the Input field:**

- **Case 1 (codebase-rag)**: Paste codebase files, documentation URLs, README files, API documentation, or any source code files you want analyzed
- **Case 2 (ui-only)**: Paste UI screenshots, interaction recordings, visual observations, or notes about UI behavior
- **Case 3 (user-input)**: Paste user descriptions, VTT files, transcripts, user stories, feature requests, or any unstructured user input
- **General**: Paste any research sources (code, documentation, UI observations, user input) that should be scanned for feature information

**Tip**: Use "Paste from Previous" button if you want to include output from a previous step.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/research-output`
- **Files to Watch**: `research-summary-draft.md`, `research-findings-draft.md`
- **Complete Files**: `research-summary-complete.md`, `research-findings-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms (file must be unchanged for 10 seconds)
- **File Count**: 1

**Important Instructions for LLM Agents:**

1. **Create the target directory** as specified above
2. **Start with draft files**: Begin writing to files with `-draft` suffix (e.g., `research-summary-draft.md`)
3. **Edit incrementally**: You may edit the draft file multiple times as you compose the document
4. **Signal completion**: When finished, rename the file to use `-complete` suffix (e.g., `research-summary-complete.md`)
   - Alternatively, create a new file with the `-complete` suffix
   - The automation system will detect the complete file and process it
5. **File stability**: The system waits for files to be stable (unchanged) before processing, so you can edit freely

**Example Workflow:**
1. Create `research-summary-draft.md` and start writing
2. Edit the file multiple times as needed
3. When complete, rename to `research-summary-complete.md` (or create the complete version)
4. The automation system will detect the complete file and process it automatically

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Research Tasks**:

1. **Identify Sources**
   - Document all available sources based on active modifiers
   - Note source types and accessibility
   - Record source locations/URLs

2. **Scan and Extract Information**
   For each source identified:
   - Access and read the source material
   - Extract feature descriptions
   - Note interaction patterns
   - Identify visual elements mentioned
   - Capture timing and behavior details
   - Document edge cases mentioned
   - Note error handling information

3. **Compile Research Summary**
   - List all sources accessed
   - Summarize key findings from each source
   - Note any gaps or missing information
   - Identify conflicting information (if any)
   - Assess source quality and reliability

**Output Format**:
```markdown
## Research Summary

### Documentation Sources
1. [Source Name/URL]
   - Type: [Source type]
   - Key Content: [Summary]
   - Features Found: [List]
   - Quality: [High/Medium/Low]

2. [Next Source]
   ...

### Key Findings
- [Finding 1]
- [Finding 2]
- ...

### Gaps Identified
- [Missing information 1]
- [Missing information 2]
- ...

### Next Steps
- [What needs further research]
- [What is ready for feature extraction]
```

**Research Guidelines**:
- Be thorough - scan all relevant sections
- Extract specific details, not just summaries
- Note interaction patterns and behaviors
- Capture timing, thresholds, and visual details
- Identify edge cases mentioned
- Look for error handling information

{PROCESS_STEP_TRIGGERS}

---

## Output Format

```markdown
## Research Summary

### Documentation Sources
[List of sources with summaries]

### Key Findings
[Compiled findings]

### Gaps Identified
[Missing information]

### Next Steps
[Research continuation needs]
```

---

## Quality Criteria

- Multiple sources identified (when available)
- Key information extracted
- Gaps clearly identified
- Source quality assessed
- Ready for feature extraction
- All modifier-specific requirements met

---

## Process Step Triggers

**Validation Loop**: After completing research summary
- Assess completeness of source identification
- Check if all accessible sources have been scanned
- Identify if additional research is needed
- Decision: CONTINUE to Feature Extraction or ITERATE Research

