# Text Input Parsing

**Purpose**: Specialized parsing instructions for free-form text descriptions, user stories, feature requests, bug reports, and user feedback.

**Input**: Free-form text descriptions
**Output**: Structured parsed text data

---

## Specialized Instructions

When parsing free-form text:

1. **Identify Text Type**
   - User story format (As a... I want... So that...)
   - Feature request format
   - Bug report format
   - General feedback format
   - Mixed format

2. **Extract Based on Type**
   - **User Stories**: Extract actor, action, goal, benefit
   - **Feature Requests**: Extract requested feature, use case, priority
   - **Bug Reports**: Extract issue, steps to reproduce, expected vs actual
   - **General Feedback**: Extract themes, suggestions, pain points

3. **Parse Natural Language**
   - Identify verbs (actions)
   - Identify nouns (entities, objects)
   - Identify adjectives (qualities, states)
   - Identify temporal markers (before, after, when, then)
   - Identify conditional statements (if, when, unless)

4. **Extract Implicit Information**
   - Infer user goals from actions
   - Infer data structures from mentions
   - Infer relationships from context
   - Infer priorities from language (urgent, important, nice-to-have)

