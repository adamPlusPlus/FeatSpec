# Initial Research and Documentation Scanning

**Purpose**: Research target application and identify documentation sources.

**Prompt:**

```
Research the following target and identify all relevant documentation sources.

Target:
[USER_PROVIDES: Application name, URLs, documentation links, or research query]

Research Tasks:

1. **Identify Documentation Sources**
   - Official documentation websites
   - API documentation
   - User guides and tutorials
   - Developer documentation
   - Community resources (if relevant)
   - Video tutorials or demos (describe content)

2. **Scan and Extract Information**
   For each source identified:
   - Access and read the documentation
   - Extract feature descriptions
   - Note interaction patterns
   - Identify visual elements mentioned
   - Capture timing and behavior details

3. **Compile Research Summary**
   - List all sources accessed
   - Summarize key findings from each source
   - Note any gaps or missing information
   - Identify conflicting information (if any)

Output Format:
```markdown
## Research Summary

### Documentation Sources
1. [Source Name/URL]
   - Type: [Official docs/API/Guide/etc.]
   - Key Content: [Summary]
   - Features Found: [List]

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

Research Guidelines:
- Be thorough - scan all relevant sections
- Extract specific details, not just summaries
- Note interaction patterns and behaviors
- Capture timing, thresholds, and visual details
- Identify edge cases mentioned
- Look for error handling information
```

**Output Format:**
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

**Quality Criteria:**
- Multiple sources identified
- Key information extracted
- Gaps clearly identified
- Ready for feature extraction

---