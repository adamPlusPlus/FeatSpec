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

**CRITICAL - Context Integration**: 
- **Previous Steps Available**: All previously established cAtoms, ccompounds (compound structures), and cElements from previous steps (Theoria, Doctrine, Praxis, Poiesis) are available in the conversation history
- **You MUST consider**: All cAtoms, ccompounds, and cElements from previous steps when analyzing the current input
- **Fresh Input**: The input field contains NEW input specific to this step that should be processed
- **Integration**: Your analysis should integrate both:
  1. Previously established foundations (cAtoms, ccompounds, cElements) from conversation history
  2. Fresh input provided in the current step's input field
- **Reference Previous**: When extracting praxis cNodes, reference and build upon cAtoms, ccompounds, and cElements from previous steps
- **Build Upon**: Your praxis should build upon the axiomatic foundations (cAtoms) and structures (ccompounds, cElements) already established

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

**CRITICAL INSTRUCTION**: Your output must be **cNodes and cElements**, not summaries or explanations. Extract the actual praxis cNodes from the input. Do NOT explain what praxis is. Do NOT invent content that doesn't exist in the input. Extract what exists in the input, using direct quotes when available, or extracting the essential content when the meaning is clear but wording differs.

1. **Extract Praxis cNodes** (from the input)
   - Identify each distinct method, process, or operation **as a separate cNode**
   - Label each cNode with its type: `praxis`
   - Determine mode: `generation` or `inquisition` or `combined` - [extract from input based on what the method does]
   - Extract method/process **from input** - use direct quotes when available, otherwise extract the essential method/process content
   - Extract operations and transformations **from input** - extract what operations and transformations are described

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

5. **Extract Instance-Specific cElement Properties** (from input only)
   - For each praxis cNode, extract instance-specific properties **directly from the input**:
     - **State**: [Extract from input: Highly dynamic/Stable/Adaptive/etc. - describe the actual state of THIS specific method]
     - **Trace Behavior**:
       - **Self-branching**: [Extract from input: High/Medium/Low - how much does THIS specific method branch and fork?]
       - **Mutation Rate**: [Extract from input: High/Medium/Low - how quickly does THIS specific method mutate?]
       - **Recombination Tendency**: [Extract from input if present - how prone is THIS method to recombination?]
       - **CRITICAL**: Extract actual behavior patterns from input. If not present in input, OMIT rather than using defaults.
     - **Affinity Bonds**: [Extract from input: Strong/Medium/Weak with specific cElements/cNodes - what does THIS method actually bond with?]
     - **Prestige Role**: [Extract from input: High/Medium/Low - what prestige does THIS specific method carry?]
   - **DO NOT** include static type-level properties (Function, Epistemic Role, Ecstasis Role) - these are redundant with the cNode type.
   - **DO** provide rich, specific details about THIS particular instance extracted from the input.

6. **Extract Cross-Type Interactions and Derivations** (from input)
   - **Interactions**: Identify how THIS praxis cNode interacts with other cElement types (Theoria, Doctrine, Poiesis, Techne, Design, Foam):
     - **With Theoria**: [How does THIS method interact with orientations? Does it test, instantiate, or challenge theoria?]
     - **With Doctrine**: [How does THIS method interact with rules? Does it challenge, reify, or transform doctrine?]
     - **With Poiesis**: [How does THIS method interact with creative expression? Does it limit, channel, or unleash poiesis?]
     - **With Techne**: [How does THIS method interact with tools? Does it become techne when stabilized?]
     - **With Design**: [How does THIS method interact with functional forms? Does it shape what gets built?]
   - **Derivations**: Identify what THIS praxis cNode generates or transforms into:
     - **Generates**: [What new cNodes, claimnodes, or structures does THIS method create?]
     - **Tests**: [What does THIS method test or falsify?]
     - **Transforms into**: [Does THIS method stabilize into Techne? Become Doctrine? Feed into Design?]
     - **Becomes**: [What does THIS method become when it crystallizes or gets embedded?]
   - **Hybridizations**: Identify creative combinations where THIS praxis cNode combines with other types:
     - **Hybrid Methods**: [What emerges when THIS method combines with Theoria/Doctrine/Poiesis/etc.?]
     - **Emergent Practices**: [What new practices or approaches emerge from these combinations?]
     - **Creative Recombination**: [How does THIS method recombine with other elements to create novel approaches?]
   - **Interaction Dynamics**: Extract the actual dynamics from input:
     - **Testing**: [How does THIS method test other cNodes? What contradictions does it reveal?]
     - **Generation**: [How does THIS method generate new structures or claimnodes?]
     - **Transformation**: [How does THIS method transform other cNodes? Into what?]
     - **Rupture**: [Does THIS method cause ecstasis or rupture? How?]

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
- **State**: [Extract from input: specific state description for THIS method - e.g., "Highly dynamic, adapts to context", "Stable, well-established", etc.]
- **Trace Behavior**:
  - **Self-branching**: [Extract from input: High/Medium/Low - specific branching characteristics of THIS method]
  - **Mutation Rate**: [Extract from input: High/Medium/Low - specific mutation rate of THIS method]
  - **Recombination Tendency**: [Extract from input if present - specific recombination characteristics]
  - **Other behaviors**: [Extract any other trace behaviors specific to THIS method from input]
- **Affinity Bonds**: [Extract from input: specific bonds THIS method forms - e.g., "Strong with [specific cNode X], tightly coupled with [specific cNode Y] when stable"]
- **Prestige Role**: [Extract from input: High/Medium/Low - specific prestige characteristics of THIS method]

**Cross-Type Interactions:**
- **With Theoria**: [How THIS method interacts with orientations - test, instantiate, or challenge?]
- **With Doctrine**: [How THIS method interacts with rules - challenge, reify, or transform?]
- **With Poiesis**: [How THIS method interacts with creative expression - limit, channel, or unleash?]
- **With Techne**: [How THIS method interacts with tools - become techne when stabilized?]
- **With Design**: [How THIS method interacts with functional forms - shape what gets built?]

**Derivations:**
- **Generates**: [What new cNodes, claimnodes, or structures does THIS method create?]
- **Tests**: [What does THIS method test or falsify?]
- **Transforms into**: [Does THIS method stabilize into Techne? Become Doctrine? Feed into Design?]
- **Becomes**: [What does THIS method become when it crystallizes or gets embedded?]

**Hybridizations:**
- **Hybrid Methods**: [What emerges when THIS method combines with other cElement types?]
- **Emergent Practices**: [What new practices or approaches emerge from these combinations?]
- **Creative Recombination**: [How does THIS method recombine with other elements to create novel approaches?]

**Interaction Dynamics:**
- **Testing**: [How does THIS method test other cNodes? What contradictions does it reveal?]
- **Generation**: [How does THIS method generate new structures or claimnodes?]
- **Transformation**: [How does THIS method transform other cNodes? Into what?]
- **Rupture**: [Does THIS method cause ecstasis or rupture? How?]

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
