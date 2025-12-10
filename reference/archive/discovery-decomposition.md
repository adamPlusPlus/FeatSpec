# Feature Decomposition to Atomic Level

**Purpose**: Break down features into atomic components that cannot be further decomposed.

**Input**: Feature inventory from Subsection 0a

**Prompt:**

```
Decompose the following features into atomic components.

Feature Inventory:
[OUTPUT_FROM_SUBSECTION_0A]

For each feature, break it down until atomic (cannot be meaningfully decomposed further).

Atomic Feature Criteria:
1. Represents a single, complete interaction
2. Has clear input and output
3. Can be described in one UX flow
4. Implements one specific behavior

Decomposition Process:
1. Identify user actions within the feature
2. Identify system responses to each action
3. Separate each action-response pair into potential atomic feature
4. Continue until each component is atomic

For each atomic feature, provide:
- Atomic Feature Name: What it does
- Input: What triggers it
- Output: What happens
- User Experience: What user perceives

Output Format:
- Hierarchical structure showing decomposition
- Parent features → Child features → Atomic features
- Clear indication of atomicity

Reference: Use feature taxonomy (feature-spec-reference.md (Part 2: Feature Taxonomy)) to classify feature types.
```

**Output Format:**
```markdown
## Feature Decomposition

### Feature: [Feature Name]
- **Type**: [atomic | composite]
- **Components**:
  - [Component 1]
    - **Type**: [atomic | composite]
    - **Components**:
      - [Atomic Component 1.1]
        - **Input**: [what triggers]
        - **Output**: [what happens]
        - **User Experience**: [what user perceives]
      - [Atomic Component 1.2]
        ...
  - [Component 2]
    ...
```

**Quality Criteria:**
- Features decomposed to atomic level
- Clear input/output for each atomic feature
- No further decomposition possible
- Taxonomy classification included

---