# Output Mapping

**Purpose**: Map structured outputs to target pipeline steps and create file associations.

**Input**: {PREVIOUS_OUTPUT}
**Output**: Mapping of structured files to pipeline steps with import instructions
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Input Structuring
- Next: Export/Import to target projects
- Process Steps: Validation Loop (after completion)

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Mapping Tasks**:

1. **Create File Associations**
   - Map each structured output to target pipeline step
   - Specify which project case(s) can use each file
   - Specify which section(s) within target case
   - Include import instructions

2. **Create Import Metadata**
   - File name and format
   - Target case number
   - Target section ID
   - Variable name for substitution
   - Import method (paste, file upload, variable substitution)

3. **Document Dependencies**
   - Note if files should be imported in order
   - Note if files depend on other files
   - Note if files are optional or required

**Output Format**:
```markdown
## Output File Mapping

### File 1: research-input.json
- **Target Case**: 1, 2, or 3
- **Target Section**: research
- **Variable**: {RESEARCH_INPUT}
- **Import Method**: Variable substitution or paste into input field
- **Description**: Parsed and organized input for Research step
- **Dependencies**: None
- **Required**: Yes

### File 2: feature-extraction-input.json
- **Target Case**: 1, 2, or 3
- **Target Section**: feature-extraction
- **Variable**: {FEATURE_EXTRACTION_INPUT}
- **Import Method**: Variable substitution or paste into input field
- **Description**: Feature candidates and relationships for Feature Extraction step
- **Dependencies**: research-input.json (should be imported first)
- **Required**: Yes

### File 3: app-analysis-input.json
- **Target Case**: 1, 2, or 3
- **Target Section**: app-analysis
- **Variable**: {APP_ANALYSIS_INPUT}
- **Import Method**: Variable substitution or paste into input field
- **Description**: Feature inventory for App Analysis step
- **Dependencies**: feature-extraction-input.json
- **Required**: Yes

### File 4: decomposition-input.json
- **Target Case**: 1, 2, or 3
- **Target Section**: decomposition
- **Variable**: {DECOMPOSITION_INPUT}
- **Import Method**: Variable substitution or paste into input field
- **Description**: Feature components for Decomposition step
- **Dependencies**: app-analysis-input.json
- **Required**: Yes

### File 5: atomic-features-input.json
- **Target Case**: 1, 2, or 3
- **Target Section**: atomic-features
- **Variable**: {ATOMIC_FEATURES_INPUT}
- **Import Method**: Variable substitution or paste into input field
- **Description**: Atomic feature descriptions
- **Dependencies**: decomposition-input.json
- **Required**: Yes

### File 6: ux-specification-input.json
- **Target Case**: 1, 2, or 3
- **Target Section**: ux-specification
- **Variable**: {UX_SPECIFICATION_INPUT}
- **Import Method**: Variable substitution or paste into input field
- **Description**: UX specification data
- **Dependencies**: atomic-features-input.json
- **Required**: Yes

### Import Instructions

#### Method 1: Variable Substitution
1. Export structured files from this project
2. In target project, update pipeline-config.json variables section
3. Add variables: {RESEARCH_INPUT}, {FEATURE_EXTRACTION_INPUT}, etc.
4. Files will be automatically substituted when loading prompts

#### Method 2: Manual Paste
1. Export structured files from this project
2. Open target project and navigate to appropriate section
3. Copy content from exported file
4. Paste into section input field

#### Method 3: File Import
1. Export structured files from this project
2. In target project, use "Import Input" feature
3. Select exported file
4. System will map to appropriate section based on file name

### Dependencies Graph
```
research-input.json
  └─> feature-extraction-input.json
      └─> app-analysis-input.json
          └─> decomposition-input.json
              └─> atomic-features-input.json
                  └─> ux-specification-input.json
```

### Quality Assessment
- File completeness: [High/Medium/Low]
- Mapping accuracy: [High/Medium/Low]
- Import instructions clarity: [High/Medium/Low]
- Dependency documentation: [Complete/Partial/None]
```

**Quality Criteria**:
- All structured outputs are mapped to target steps
- File associations are clear and accurate
- Import instructions are complete
- Dependencies are documented
- Metadata is included

