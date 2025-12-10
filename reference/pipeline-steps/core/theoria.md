# Theoria

**Purpose**: Establish a pre-conceptual orientation toward structure — a sighting, posture, or frame that informs all that follows but never enforces. Theoria is a **pre-linguistic orientation** toward structure, which informs all that follows but never enforces.

**Input**: {USER_INPUT} or portions from previous steps ({PREVIOUS_OUTPUT})
**Output**: Pre-conceptual lens, interpretive frame, or axiomatic orientation
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**:

- Can link to: Praxis, Doctrine, Poiesis
- Can be repeated to refine or expand orientation
- Previous steps: {PREVIOUS_STEPS}

---

## Input Guidance

**What to enter in the Input field:**

- **Your design, idea, or concept**: Enter the design, idea, or concept you want to analyze
- **Portions from previous steps**: Reference specific outputs from Theoria, Praxis, Doctrine, or Poiesis steps
- **Mixed input**: Combine your own ideas with fragments from previous steps
- **Empty input**: Begin with pure contemplation and let theoria emerge

**Tip**: Theoria is not opinion, doctrine, nor tool — it is **sighting**, **posture**, **frame**. It is a **pre-linguistic orientation** toward structure, which informs all that follows but never enforces.

**CRITICAL**: Your task is to **IDENTIFY and ARTICULATE** the pre-conceptual frame that **already underlies** the input, not to create a new theoria. The theoria is already present in the input—you must reveal it, not invent it.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/theoria-output`
- **Files to Watch**: `theoria-{AUTOMATION_ID}-draft.md`
- **Complete Files**: `theoria-{AUTOMATION_ID}-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms (file must be unchanged for 10 seconds)
- **File Count**: 1

**Important Instructions for LLM Agents:**

1. **Create the target directory** as specified above
2. **Use the automation ID**: The automation ID for this step is `{AUTOMATION_ID}`. You MUST include this ID in all filenames.
3. **Start with draft files**: Begin writing to files with the pattern `theoria-{AUTOMATION_ID}-draft.md` (replace `{AUTOMATION_ID}` with the actual ID shown above)
4. **Edit incrementally**: You may edit the draft file multiple times as you compose the document
5. **Signal completion**: When finished, create the file `theoria-{AUTOMATION_ID}-complete.md` (replace `{AUTOMATION_ID}` with the actual ID)
6. **File stability**: The system waits for files to be stable (unchanged) before processing
7. **CRITICAL**: The automation ID must be included in the filename exactly as shown. Do not omit it or use a different format.

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Theoria Tasks:**

**CRITICAL INSTRUCTION**: Your output must be **cNodes and cElements**, not summaries or explanations. Extract the actual theoria cNodes from the input using **direct quotes and minimal interpretation**. Do NOT explain what theoria is. Do NOT interpret or summarize. Do NOT add explanatory text. Extract ONLY what exists in the input.

1. **Extract Theoria cNodes** (directly from the input)
   - Identify each distinct theoric orientation, assumption, or frame **as a separate cNode**
   - Label each cNode with its type: `theoria`
   - Extract sighting, posture, or frame **as direct quotes or minimal paraphrases from input** - NO interpretation
   - Extract epistemic mode and episteme **as direct quotes from input ONLY** - if not present as explicit quotes, OMIT this section - NO interpretation, NO summarization
   - Extract ontological assumptions **as direct quotes from input** - NO interpretation

2. **Extract cAtoms** (from the input)
   - Identify each axiomatic foundation **as a cAtom**
   - Label each cAtom with its type: `cAtom`
   - Extract what each cAtom anchors **as cAtom properties**

3. **Extract Possibility Space cNodes** (from the input)
   - Identify askable questions **as cNodes** (type: `question-askable`)
   - Identify unaskable questions **as cNodes** (type: `question-unaskable`)
   - Identify opened possibilities **as cNodes** (type: `possibility-opened`)
   - Identify closed possibilities **as cNodes** (type: `possibility-closed`)
   - Identify what gets to exist **as cNodes** (type: `existence-allowed`)

4. **Extract Relationship cNodes** (from the input)
   - Identify relationships to previous steps **as relationship cNodes** (type: `relationship`)
   - Identify affinity bonds **as bond cNodes** (type: `affinity-bond`)
   - Identify contradictions **as contradiction cNodes** (type: `contradiction`)
   - Identify ecstasis potential **as ecstasis cNodes** (type: `ecstasis`)

5. **Apply cElement Properties** (verbatim from reference document)
   - For each theoria cNode, apply cElement properties **verbatim from the reference document definitions**:
     - **Function**: "Provides a pre-conceptual lens through which meaning is framed" [from reference]
     - **State**: [Persistent/Latent/Active] - [from input, or "Persistent" if from reference]
     - **Trace Behavior**:
       - **Mutation Rate**: [Low/Medium/High] - [from "direct quote from input" or reference: "Low mutation rate"]
       - **Stability**: [High/Medium/Low] - [from "direct quote from input" or reference]
       - **CRITICAL**: NO interpretive reasoning like "[suggesting X]" or "[as Y]" - ONLY direct quotes in brackets
     - **Affinity Bonds**: [Strong/Medium/Weak with X, Y, Z] - [from input relationships or reference: "Strong with Doctrine, Poiesis, Metaphysic; weak with Foam and Design"]
     - **Ecstasis Role**: "Trigger or boundary" - [from reference: "Trigger or boundary for major philosophical reconfigurations"]
     - **Prestige Role**: [High/Medium/Low] - [from input or reference: "Often prestige-generating"]
     - **Epistemic Role**: "Distinguishes what can be known from what is even askable" [from reference]

**Output Format:**

```markdown
## Theoria cNodes

### cNode: [Orientation Name from Input]
**Type:** `theoria`
**Source:** input

**Content:**
- **Sighting**: [direct quote or minimal extraction from input - NO interpretation]
- **Posture**: [direct quote or minimal extraction from input - NO interpretation]
- **Frame**: [direct quote or minimal extraction from input - NO interpretation]

**Epistemic Properties:**
- **Mode**: [direct quote from input ONLY - if not present as explicit quote, OMIT - NO interpretation, NO summarization]
- **Episteme**: [direct quote from input ONLY - if not present as explicit quote, OMIT - NO interpretation, NO summarization]

**cElement Properties:**
- **Function**: "Provides a pre-conceptual lens through which meaning is framed" [from reference]
- **State**: [Persistent/Latent/Active] - [from input or reference]
- **Trace Behavior**:
  - **Mutation Rate**: [Low/Medium/High] - [from "direct quote from input" or reference: "Low mutation rate"]
  - **Stability**: [High/Medium/Low] - [from "direct quote from input" or reference]
  - **CRITICAL**: NO interpretive reasoning like "[suggesting X]" or "[as Y]" - ONLY direct quotes in brackets
- **Affinity Bonds**: [Strong/Medium/Weak with X, Y, Z] - [from input relationships or reference]
- **Ecstasis Role**: "Trigger or boundary" - [from reference: "Trigger or boundary for major philosophical reconfigurations"]
- **Prestige Role**: [High/Medium/Low] - [from input or reference]
- **Epistemic Role**: "Distinguishes what can be known from what is even askable" [from reference]

**Presupposes:**
- [cNode/Body/cAtom type] → [assumption from input]
- [cNode/Body/cAtom type] → [assumption from input]
...

**Anchors:**
- [cNode subgraph from input]
- [cNode subgraph from input]
...

**Derivability**: [Derivable/Axiomatic] - [from input]
**Visibility**: [Visible/Latent/Invisible] - [from input]

---

### cAtom: [Atom Name from Input]
**Type:** `cAtom`
**Source:** input

**Anchors:**
- [what it anchors from input]
- [what it anchors from input]
...

---

### cNode: [Question from Input]
**Type:** `question-askable`
**Source:** input

**Content:** [question from input]

---

### cNode: [Question from Input]
**Type:** `question-unaskable`
**Source:** input

**Content:** [question from input]

---

### cNode: [Possibility from Input]
**Type:** `possibility-opened`
**Source:** input

**Content:** [possibility from input]

---

### cNode: [Possibility from Input]
**Type:** `possibility-closed`
**Source:** input

**Content:** [possibility from input]

---

### cNode: [Existence from Input]
**Type:** `existence-allowed`
**Source:** input

**Content:** [what gets to exist from input]

---

### cNode: [Relationship Name]
**Type:** `relationship`
**Source:** input

**Links:**
- [theoria cNode] → [previous step cNode] - [relationship from input]
- [theoria cNode] → [previous step cNode] - [relationship from input]
...

---

### cNode: [Bond Name]
**Type:** `affinity-bond`
**Source:** input

**Bond:**
- [theoria cNode] → [Doctrine/Praxis/Poiesis/etc] - [Strong/Medium/Weak] - [bond description from input]

---

### cNode: [Contradiction Name]
**Type:** `contradiction`
**Source:** input

**Contradiction:**
- [contradiction from input] → [Ecstasis type]

---

### cNode: [Ecstasis Name]
**Type:** `ecstasis`
**Source:** input

**Ecstasis:**
- [rupture type from input] - [Autopoiesis / Allopoiesis / Practopoiesis / Sympoiesis]
- **Trigger**: [trigger from input]
```

---

## Quality Criteria

- Pre-conceptual frame clearly articulated
- Epistemic mode and Episteme class identified
- Ontological assumptions and cAtoms identified
- Possibility space mapped (what's opened/closed, what gets to exist)
- cElement properties described
- Relationships to other steps traced as cElements
- cNode system integration explained
- Ready for linking to Praxis, Doctrine, or Poiesis

---

## Linking Instructions

**To use this Theoria in other steps:**

- **For Praxis**: Reference this theoria to shape what methods or questions become thinkable
- **For Doctrine**: Reference this theoria as the metaphysical ground for codified principles
- **For Poiesis**: Reference this theoria to understand what generative capacity is limited or unleashed
- **For repeated Theoria**: Use this output to refine, expand, or contrast with new theoric frames

**To reference previous steps:**

- Use specific sections from previous Theoria, Praxis, Doctrine, or Poiesis outputs
- Quote relevant portions in your input
- Note relationships and contradictions explicitly
- Reference cNode, cElement, or Body structures from previous steps
