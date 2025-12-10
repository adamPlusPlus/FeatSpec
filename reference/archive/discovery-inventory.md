# App Analysis and Feature Inventory

**Purpose**: Identify all user-facing features in an application.

**Input Options**:
- Manual: App description, screenshots, or feature description
- From Research: Extracted features from Research Loop (Research Loop)

**Prompt:**

```
Analyze the following application and create a comprehensive feature inventory.

Application Description:
[USER_PROVIDES_APP_DESCRIPTION]

OR

Extracted Features from Research:
[OUTPUT_FROM_SECTION_R2_IF_AVAILABLE]

If using research output:
- Review extracted features
- Fill in any gaps using manual analysis
- Combine research findings with additional observations
- Ensure completeness

For each feature identified, provide:

1. Feature Name: Descriptive name of the feature
2. Primary User Goal: What the user is trying to accomplish
3. Key Interactions: What actions can the user take
4. Visual Indicators: What the user sees
5. Context: When/where this feature appears

Output Format:
- List format with numbered features
- Each feature should be a distinct, user-facing capability
- Include both obvious and subtle features
- Group related features together

Do not:
- Include implementation details
- Use platform-specific terminology
- Mix multiple features into one entry
- Skip minor or subtle features

Reference: Use generic interaction terms (action1, action2, pointer, etc.) from terminology key.
```

**Output Format:**
```markdown
## Feature Inventory

### Feature 1: [Feature Name]
- **User Goal**: [What user accomplishes]
- **Key Interactions**: [List of interactions]
- **Visual Indicators**: [What user sees]
- **Context**: [When/where it appears]

### Feature 2: [Feature Name]
...
```

**Quality Criteria:**
- All user-facing features identified
- No implementation details included
- Generic terminology used
- Clear feature boundaries

---