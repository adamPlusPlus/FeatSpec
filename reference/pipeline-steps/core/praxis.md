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

**CRITICAL - Extraction vs. Inference**:
- **If explicit methods/processes/operations exist in input**: Extract them directly using quotes or essential content
- **If input contains only cAtoms (axiomatic foundations)**: Infer the methods/processes/operations that would **instantiate, test, or operationalize** those cAtoms. Ground these inferred methods in the cAtoms—they must be methods that directly implement or test the axiomatic foundations, not arbitrary inventions.
- **If input contains both**: Extract explicit methods AND infer methods from cAtoms
- **Always ground in input**: Whether extracting or inferring, every praxis cNode must be traceable to specific cAtoms, statements, or structures in the input

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

**CRITICAL INSTRUCTION**: Your output must be **cNodes and cElements**, not summaries or explanations. Extract or infer the actual praxis cNodes from the input. Do NOT explain what praxis is. 

**CRITICAL - Praxic cAtoms vs Doctrinal cAtoms**:
- **Praxic cAtoms are QUESTIONS, QUERIES, RECONSIDERATIONS** — not rules or constraints
- **Doctrinal cAtoms are RULES, CONSTRAINTS, "MUST" statements** — these belong in Doctrine, not Praxis
- **Praxic cAtoms** should be stated as:
  - Questions: "What if...?", "How do we test...?", "Why does...?"
  - Queries: "Does X actually work?", "What happens when Y fails?"
  - Reconsiderations: "Should we reconsider Z?", "What if the assumption about W is wrong?"
  - Inquiries: "How can we probe...?", "What would reveal...?"
- **Do NOT** state praxic cAtoms as rules like "Methods must X" — those are doctrinal cAtoms

**Extraction Rules**:
- **If input contains explicit methods/processes/operations**: Extract them directly using quotes when available, or extract essential content when wording differs
- **If input contains only cAtoms (especially theoria cAtoms)**: Infer questions, queries, or reconsiderations that would test, probe, or challenge those cAtoms. Ground each inferred inquiry in specific cAtoms—show which cAtoms it questions or tests
- **Always trace to input**: Every praxis cNode must be traceable to specific content in the input (cAtoms, statements, structures)

1. **Extract Praxic cAtoms** (from the input)
   - Identify questions, queries, reconsiderations, or inquiries **as cAtoms** (type: `cAtom`)
   - **CRITICAL**: Praxic cAtoms are QUESTIONS/QUERIES/RECONSIDERATIONS, not rules
   - Extract or infer questions that test, probe, or challenge theoria cAtoms, doctrinal assumptions, or existing methods
   - Examples of praxic cAtom forms:
     - "What if [theoria cAtom] is wrong?"
     - "How do we test whether [assumption] holds?"
     - "What happens when [process] fails?"
     - "Should we reconsider [doctrine]?"
     - "Does [method] actually preserve [property]?"
   - Ground each praxic cAtom in the cAtoms or structures it questions/tests
   - Label each cAtom with its type: `cAtom`

2. **Extract or Infer Praxis cNodes** (from the input)
   - Identify each distinct method, process, or operation **as a separate cNode**
   - Label each cNode with its type: `praxis`
   - Determine mode: `generation` or `inquisition` or `combined` - [extract from input based on what the method does, or infer from cAtom characteristics]
   - Extract or infer method/process **from input** - use direct quotes when available, otherwise extract essential content, or infer from cAtoms with clear grounding
   - Extract or infer operations and transformations **from input** - extract what operations are described, or infer operations that would implement the cAtoms

3. **Extract Operational cNodes** (from the input)
   - Identify each cNode operation **as a cNode** (type: `operation`)
   - Identify each trace pattern **as a cNode** (type: `trace-pattern`)
   - Identify each Body/cElement cluster **as a cNode** (type: `body` or `cluster`)
   - Identify each signalpath/tracegraph structure **as a cNode** (type: `signalpath` or `tracegraph`)

4. **Extract Composition cNodes** (from the input)
   - Identify how cNodes compose **as composition cNodes** (type: `composition`)
   - Identify new cNodes/claimnodes generated **as generated cNodes** (type: `generated-cnode`)

5. **Extract Relationship cNodes** (from the input)
   - Identify relationships to previous steps **as relationship cNodes** (type: `relationship`)
   - Identify affinity bonds **as bond cNodes** (type: `affinity-bond`)
   - Identify contradictions **as contradiction cNodes** (type: `contradiction`)
   - Identify ecstasis potential **as ecstasis cNodes** (type: `ecstasis`)
   - Identify trace recursion **as recursion cNodes** (type: `trace-recursion`)

6. **Extract Instance-Specific cElement Properties** (from input only)
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

7. **Extract Cross-Type Interactions and Derivations** (from input)
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

### cAtom: [Question/Query/Reconsideration]
**Type:** `cAtom`
**Source:** input
**Form:** [question / query / reconsideration / inquiry]

**Content:**
- **Question/Query**: [The actual question, query, or reconsideration - e.g., "What if seamless continuity cannot be preserved across all transformations?", "How do we test whether data identity persists?", "Should we reconsider the assumption that formats are reversible?"]
- **Tests/Probes**: [What cAtom, assumption, or structure does this question test or probe?]
- **Grounded in**: [Which theoria cAtoms, doctrinal assumptions, or existing methods does this question challenge or test?]

**Anchors:**
- [What structures, processes, or assumptions does this question anchor to?]

**Derivability**: [Derivable/Axiomatic] - [from input]

---

### cNode: [Method/Process Name from Input]
**Type:** `praxis`
**Source:** input
**Mode:** [generation / inquisition / combined] - [from input]

**Content:**
- **Method**: [method from input, or inferred method that implements cAtoms]
- **Process**: [process from input, or inferred process that operationalizes cAtoms]
- **Inquiry**: [inquiry from input, or inferred inquiry that tests cAtoms]
- **Grounded in**: [If inferred, list the specific cAtoms this method implements/tests - e.g., "Implements cAtom 1, 5, 22" or "Tests cAtom 8-11"]

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
