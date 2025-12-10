# Transcript Parsing

**Purpose**: Specialized parsing instructions for text transcripts without timestamps but with flow information.

**Input**: Text transcripts (user observation recordings, conversation transcripts)
**Output**: Structured parsed transcript data with flow information

---

## Specialized Instructions

When parsing text transcripts:

1. **Identify Transcript Type**
   - Conversation transcript (Q&A format)
   - Observation transcript (narrative format)
   - Interview transcript
   - Mixed format

2. **Extract Sequential Information**
   - Identify turn-taking (if conversation)
   - Identify topic changes
   - Identify flow breaks or pauses
   - Identify emphasis or repetition

3. **Extract Flow Information**
   - Identify action sequences (from narrative order)
   - Identify decision points (from questions or conditionals)
   - Identify loops (from repetition)
   - Identify parallel actions (from simultaneous mentions)

4. **Extract Contextual Information**
   - Visual descriptions
   - UI element mentions
   - Error mentions
   - User reactions or feedback
   - Uncertainty or confusion indicators

5. **Preserve Sequential Relationships**
   - Maintain narrative order
   - Note sequential dependencies
   - Note implied timing (before, after, then)

