# VTT File Parsing

**Purpose**: Specialized parsing instructions for VTT (WebVTT) files with timestamps and temporal flow information.

**Input**: VTT files (video transcripts with timestamps)
**Output**: Structured parsed VTT data with temporal information

---

## Specialized Instructions

When parsing VTT files:

1. **Parse VTT Format**
   - Extract cue timestamps (start and end times)
   - Extract cue text content
   - Extract cue identifiers (if present)
   - Extract cue settings (if present)

2. **Extract Temporal Information**
   - Sequence of actions (based on timestamp order)
   - Duration of actions (from timestamp differences)
   - Overlapping actions (from overlapping timestamps)
   - Pauses or gaps (from timestamp gaps)

3. **Extract Flow Information**
   - Identify action sequences
   - Identify decision points
   - Identify loops or repetitions
   - Identify parallel actions

4. **Extract Contextual Information**
   - Visual descriptions mentioned
   - UI element mentions
   - Error mentions
   - User reactions or feedback

5. **Preserve Temporal Relationships**
   - Maintain timestamp associations
   - Maintain sequence order
   - Note temporal dependencies

