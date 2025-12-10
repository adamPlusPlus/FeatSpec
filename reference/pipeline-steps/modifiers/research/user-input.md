# user-input Modifier

**Type**: Base Modifier
**Applies To**: Research
**Case**: 3 (primary), 1/2 (supplementary)

**Can Combine With**: 
- `enhancement-input` (when enhancing existing features)

**Instructions**:

Parse user descriptions and build research knowledge base from user-provided information.

**Research Tasks**:

1. **Parse Free-Form Text Descriptions**
   - User stories
   - Feature requests
   - Bug reports with descriptions
   - User feedback
   - Extract key actions, goals, patterns

2. **Parse VTT/Transcripts** (if provided)
   - Extract temporal information (timestamps, sequence)
   - Extract flow descriptions
   - Identify "feel" and subjective descriptions
   - Extract visual descriptions
   - Identify timing information
   - Extract error scenarios mentioned
   - Identify edge cases described

3. **Build Research Knowledge Base**
   - Organize parsed descriptions by feature area
   - Map descriptions to existing features (if available)
   - Extract key concepts and patterns
   - Identify gaps in descriptions

4. **Extract Key Information**
   - User goals and intentions
   - Interaction patterns described
   - Visual elements mentioned
   - Timing information
   - Edge cases and error scenarios

**Output Additions**:
- Parsed user descriptions organized by feature
- Temporal information from VTT/transcripts (if applicable)
- User goals and patterns extracted
- Feature mapping (if existing features available)

**When Combined with `enhancement-input`**:
- First parse existing feature documentation (from enhancement-input)
- Then parse user descriptions/VTT
- Map user descriptions to existing features
- Use Integration Loop to resolve conflicts and merge information

**Note**: For detailed VTT/transcript processing, see case3-specialized/vtt-transcript-processing.md. For detailed user description parsing, see case3-specialized/user-description-parsing.md.

