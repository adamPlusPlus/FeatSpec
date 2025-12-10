# Praxis

**Purpose**: Generate method, action, operation, or inquiry — what happens when thought hits process. Praxis is both _the machine_ and _the testing ground_. It is the **dialectic between rule and experimentation**, doctrine and poiesis — **the method that generates and the inquiry that destroys**.

**Input**: {USER_INPUT} or portions from previous steps ({PREVIOUS_OUTPUT})
**Output**: Method, process, question, or operational approach
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**:

- Can link to: Theoria, Doctrine, Poiesis
- Can be repeated to refine methods or generate new approaches
- Previous steps: {PREVIOUS_STEPS}

---

## Input Guidance

**What to enter in the Input field:**

- **Your method, process, or approach**: Enter the method, process, or approach you want to analyze
- **Your questions or inquiries**: Enter questions or inquiries you want to examine
- **Portions from previous steps**: Reference Theoria (to shape what's thinkable), Doctrine (to test rules), or Poiesis (to channel generation)
- **Mixed input**: Combine your own methods/processes with fragments from previous steps
- **Empty input**: Begin with pure inquiry and let method emerge

**Tip**: Praxis has two modes: **Generation Mode** (systematized pattern execution) and **Inquisition Mode** (problem setting, doubt, interrogation).

**CRITICAL**: Your task is to **IDENTIFY and ARTICULATE** the praxis (method, process, operation) that **already exists** in the input, not to create a new praxis. The praxis is already present in the input—you must reveal it, not invent it.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/praxis-output`
- **Files to Watch**: `praxis-{AUTOMATION_ID}-draft.md`
- **Complete Files**: `praxis-{AUTOMATION_ID}-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms (file must be unchanged for 10 seconds)
- **File Count**: 1

**Important Instructions for LLM Agents:**

1. **Create the target directory** as specified above
2. **Use the automation ID**: The automation ID for this step is `{AUTOMATION_ID}`. You MUST include this ID in all filenames.
3. **Start with draft files**: Begin writing to files with the pattern `praxis-{AUTOMATION_ID}-draft.md` (replace `{AUTOMATION_ID}` with the actual ID shown above)
4. **Edit incrementally**: You may edit the draft file multiple times as you compose the document
5. **Signal completion**: When finished, create the file `praxis-{AUTOMATION_ID}-complete.md` (replace `{AUTOMATION_ID}` with the actual ID)
6. **File stability**: The system waits for files to be stable (unchanged) before processing
7. **CRITICAL**: The automation ID must be included in the filename exactly as shown. Do not omit it or use a different format.

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Praxis Tasks:**

**CRITICAL INSTRUCTION**: Your output must be **cNodes and cElements**, not summaries or explanations. Extract the actual praxis cNodes from the input using **direct quotes and minimal interpretation**. Do NOT explain what praxis is. Do NOT interpret or summarize. Do NOT add explanatory text. Extract ONLY what exists in the input.

1. **Extract Praxis cNodes** (directly from the input)
   - Identify each distinct method, process, or operation **as a separate cNode**
   - Label each cNode with its type: `praxis`
   - Determine mode: `generation` or `inquisition` or `combined` - [direct quote from input ONLY]
   - Extract method/process **as direct quotes or minimal paraphrases from input** - NO interpretation
   - Extract operations and transformations **as direct quotes from input** - NO explanation

2. **Extract Operational cNodes** (from the input)
   - Identify each cNode operation **as a cNode** (type: `operation`)
   - Identify each trace pattern **as a cNode** (type: `trace-pattern`)
   - Identify each Body/cElement cluster **as a cNode** (type: `body` or `cluster`)
   - Identify each signalpath/tracegraph structure **as a cNode** (type: `signalpath` or `tracegraph`)

3. **Extract Composition cNodes** (from the input)
   - Identify how cNodes compose **as composition cNodes** (type: `composition`)
   - Identify new cNodes/claimnodes generated **as generated cNodes** (type: `generated-cnode`)

4. **Extract Relationship cNodes** (from the input)
   - Identify relationships to previous steps **as relationship cNodes** (type: `relationship`)
   - Identify affinity bonds **as bond cNodes** (type: `affinity-bond`)
   - Identify contradictions **as contradiction cNodes** (type: `contradiction`)
   - Identify ecstasis potential **as ecstasis cNodes** (type: `ecstasis`)
   - Identify trace recursion **as recursion cNodes** (type: `trace-recursion`)

5. **Apply cElement Properties** (verbatim from reference document)
   - For each praxis cNode, apply cElement properties **verbatim from the reference document definitions**:
     - **Function**: "Enables structured action and/or epistemic inquiry" [from reference]
     - **State**: [Highly dynamic/Stable/Adaptive] - [from input or reference: "Highly dynamic"]
     - **Trace Behavior**:
       - **Self-branching**: [High/Medium/Low] - [from "direct quote from input" or reference: "Self-branching and forking"]
       - **Mutation Rate**: [High/Medium/Low] - [from "direct quote from input" or reference: "high entropy, prone to recombination"]
       - **CRITICAL**: NO interpretive reasoning like "[suggesting X]" or "[as Y]" - ONLY direct quotes in brackets
     - **Affinity Bonds**: [Strong/Medium/Weak with X, Y, Z] - [from input relationships or reference: "Strong with Techne, Poiesis, Design; tightly coupled with Theoria when stable"]
     - **Ecstasis Role**: "Often the cause of rupture when a method reveals contradiction" [from reference]
     - **Prestige Role**: [High/Medium/Low] - [from input or reference: "Medium-high"]
     - **Epistemic Role**: "Central — Praxis defines how we know and what questions we even ask" [from reference]

**Output Format:**

```markdown
## Praxis cNodes

### cNode: [Method/Process Name from Input]
**Type:** `praxis`
**Source:** input
**Mode:** [generation / inquisition / combined] - [from input]

**Content:**
- **Method**: [method from input]
- **Process**: [process from input]
- **Inquiry**: [inquiry from input]

**cElement Properties:**
- **Function**: "Enables structured action and/or epistemic inquiry" [from reference]
- **State**: [Highly dynamic/Stable/Adaptive] - [from input or reference: "Highly dynamic"]
- **Trace Behavior**:
  - **Self-branching**: [High/Medium/Low] - [from "direct quote from input" or reference: "Self-branching and forking"]
  - **Mutation Rate**: [High/Medium/Low] - [from "direct quote from input" or reference: "high entropy, prone to recombination"]
  - **CRITICAL**: NO interpretive reasoning like "[suggesting X]" or "[as Y]" - ONLY direct quotes in brackets
- **Affinity Bonds**: [Strong/Medium/Weak with X, Y, Z] - [from input relationships or reference: "Strong with Techne, Poiesis, Design; tightly coupled with Theoria when stable"]
- **Ecstasis Role**: "Often the cause of rupture when a method reveals contradiction" [from reference]
- **Prestige Role**: [High/Medium/Low] - [from input or reference: "Medium-high"]
- **Epistemic Role**: "Central — Praxis defines how we know and what questions we even ask" [from reference]

---

### cNode: [Operation Name from Input]
**Type:** `operation`
**Source:** input

**Operation:**
- [operation from input] → transforms [cNode/Body type] → [result]

**Related:**
- [praxis cNode] → performs this operation

---

### cNode: [Trace Pattern Name from Input]
**Type:** `trace-pattern`
**Source:** input

**Pattern:**
- [pattern from input] → creates [trace structure]
- [pattern from input] → follows [signalpath]

**Related:**
- [praxis cNode] → generates this pattern

---

### cNode: [Body/Cluster Name from Input]
**Type:** `body` or `cluster`
**Source:** input

**Content:**
- [Body/cluster from input]

**Related:**
- [praxis cNode] → operates on/generates this Body

---

### cNode: [Composition Name from Input]
**Type:** `composition`
**Source:** input

**Composition:**
- [how input composes cNodes, claimnodes, or signalclones]

**Composes:**
- [cNode A] + [cNode B] → [result]

---

### cNode: [Generated cNode Name]
**Type:** `generated-cnode`
**Source:** input

**Generated by:**
- [praxis cNode] → generates this cNode

**Content:**
- [generated cNode/claimnode from input]

---

### cNode: [Signalpath/Tracegraph Name]
**Type:** `signalpath` or `tracegraph`
**Source:** input

**Structure:**
- [signalpath/tracegraph structure from input]

**Related:**
- [praxis cNode] → creates this structure

---

### cNode: [Relationship Name]
**Type:** `relationship`
**Source:** input

**Links:**
- [praxis cNode] → [previous step cNode] - [relationship from input]

---

### cNode: [Bond Name]
**Type:** `affinity-bond`
**Source:** input

**Bond:**
- [praxis cNode] → [Theoria/Doctrine/Poiesis/Techne] - [Strong/Medium/Weak] - [bond from input]

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

---

### cNode: [Recursion Name]
**Type:** `trace-recursion`
**Source:** input

**Recursion:**
- [trace recursion, tracebleed, or self-reinforcing loop from input]
```

---

## Quality Criteria

- Praxis mode clearly identified (Generation/Inquisition/Combined)
- Method or process clearly articulated
- Operational structure mapped in cNode terms
- cElement properties described
- Relationships to other steps traced as cElements
- Failure modes and evolution potential identified
- Tracegraph integration explained
- Ready for linking to Theoria, Doctrine, or Poiesis

---

## Linking Instructions

**To use this Praxis in other steps:**

- **For Theoria**: Use this praxis to test or instantiate theoric frames
- **For Doctrine**: Use this praxis to challenge or formalize rules
- **For Poiesis**: Use this praxis to channel or limit generative capacity
- **For repeated Praxis**: Use this output to refine, expand, or create alternative methods

**To reference previous steps:**

- Use specific sections from previous Theoria, Praxis, Doctrine, or Poiesis outputs
- Quote relevant portions in your input
- Note how this praxis builds on or diverges from previous methods
- Reference cNode, cElement, or Body structures from previous steps
