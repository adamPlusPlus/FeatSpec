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

**CRITICAL - Context Integration** (for subsequent Theoria steps):
- **Previous Steps Available**: All previously established cAtoms, ccompounds (compound structures), and cElements from previous steps are available in the conversation history
- **You MUST consider**: All cAtoms, ccompounds, and cElements from previous steps when analyzing the current input
- **Fresh Input**: The input field contains NEW input specific to this step that should be processed
- **Integration**: Your analysis should integrate both:
  1. Previously established foundations (cAtoms, ccompounds, cElements) from conversation history
  2. Fresh input provided in the current step's input field

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

**CRITICAL INSTRUCTION**: Your output must be **cNodes and cElements**, not summaries or explanations. Extract the actual theoria cNodes from the input. Do NOT explain what theoria is. Do NOT invent content that doesn't exist in the input. Extract what exists in the input, using direct quotes when available, or extracting the essential content when the meaning is clear but wording differs.

1. **Extract Theoria cNodes** (from the input)
   - Identify each distinct theoric orientation, assumption, or frame **as a separate cNode**
   - Label each cNode with its type: `theoria`
   - Extract sighting, posture, or frame **from input** - use direct quotes when available, otherwise extract the essential orientation content
   - Extract epistemic mode and episteme **from input** - extract if present, otherwise OMIT this section
   - Extract ontological assumptions **from input** - extract what ontological assumptions are described

2. **Extract cAtoms** (from the input)
   - Identify statements that **function as axiomatic foundations** — these are non-negotiable assumptions, structural premises, or foundational claims that anchor other structures
   - Look for:
     - Explicit axiomatic language ("X is foundational", "X must", "there is no excuse", "should always", "states", etc.)
     - **AND** implicit axiomatic foundations — statements that function as non-negotiable premises even if not explicitly labeled as such
     - Strong assertions that serve as structural assumptions
     - Claims that other statements depend upon or presuppose
     - Non-derivable premises that ground the reasoning
   - Label each cAtom with its type: `cAtom`
   - Extract what each cAtom anchors **as cAtom properties** — what structures, claims, or reasoning depend on this foundation
   - **CRITICAL**: Extract cAtoms based on their **functional role** as axiomatic foundations, not just explicit axiomatic language. If a statement serves as a foundational premise that other content depends upon, it qualifies as a cAtom.

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

5. **Extract Instance-Specific cElement Properties** (from input only)
   - For each theoria cNode, extract instance-specific properties **directly from the input**:
     - **State**: [Extract from input: Persistent/Latent/Active/etc. - describe the actual state of THIS specific orientation]
     - **Trace Behavior**:
       - **Mutation Rate**: [Extract from input: Low/Medium/High - how quickly does THIS specific orientation mutate?]
       - **Stability**: [Extract from input: High/Medium/Low - how stable is THIS specific orientation?]
       - **Formation Rate**: [Extract from input if present - how quickly does THIS orientation form or fragment?]
       - **CRITICAL**: Extract actual behavior patterns from input. If not present in input, OMIT rather than using defaults.
     - **Affinity Bonds**: [Extract from input: Strong/Medium/Weak with specific cElements/cNodes - what does THIS orientation actually bond with?]
     - **Prestige Role**: [Extract from input: High/Medium/Low - what prestige does THIS specific orientation carry?]
   - **DO NOT** include static type-level properties (Function, Epistemic Role, Ecstasis Role) - these are redundant with the cNode type.
   - **DO** provide rich, specific details about THIS particular instance extracted from the input.

6. **Extract Cross-Type Interactions and Derivations** (from input)
   - **Interactions**: Identify how THIS theoria cNode interacts with other cElement types (Praxis, Doctrine, Poiesis, Techne, Design, Foam):
     - **With Praxis**: [How does THIS orientation interact with methods? Does praxis test, instantiate, or challenge it?]
     - **With Doctrine**: [How does THIS orientation interact with rules? Does it inform doctrine or get constrained by it?]
     - **With Poiesis**: [How does THIS orientation interact with creative expression? Does it limit or unleash poiesis?]
     - **With Techne**: [How does THIS orientation interact with tools? Does it guide techne or emerge from it?]
     - **With Design**: [How does THIS orientation interact with functional forms? Does it frame design or get expressed through it?]
   - **Derivations**: Identify what THIS theoria cNode generates or transforms into:
     - **Frames**: [What does THIS orientation frame or make possible?]
     - **Presupposes**: [What does THIS orientation presuppose or require?]
     - **Enables**: [What does THIS orientation enable or make askable?]
     - **Transforms into**: [Does THIS orientation crystallize into Doctrine? Become Praxis? Feed into Poiesis?]
   - **Hybridizations**: Identify creative combinations where THIS theoria cNode combines with other types:
     - **Hybrid Frames**: [What emerges when THIS orientation combines with Praxis/Doctrine/Poiesis/etc.?]
     - **Emergent Possibilities**: [What new possibility spaces open when THIS orientation hybridizes?]
     - **Creative Recombination**: [How does THIS orientation recombine with other elements to create novel frames?]
   - **Interaction Dynamics**: Extract the actual dynamics from input:
     - **Framing**: [How does THIS orientation frame other cNodes? What becomes visible/invisible?]
     - **Constraint**: [How does THIS orientation constrain what can be known or asked?]
     - **Enabling**: [How does THIS orientation enable new questions or possibilities?]
     - **Triggering**: [Does THIS orientation trigger ecstasis or rupture? How?]

**Output Format:**

```markdown
## Theoria cNodes

### cNode: [Orientation Name from Input]
**Type:** `theoria`
**Source:** input

**Content:**
- **Sighting**: [extract from input - the sighting/orientation described]
- **Posture**: [extract from input - the posture/position described]
- **Frame**: [extract from input - the frame/lens described]

**Epistemic Properties:**
- **Mode**: [extract from input if present - the epistemic mode described, otherwise OMIT]
- **Episteme**: [extract from input if present - the episteme class described, otherwise OMIT]

**cElement Properties:**
- **State**: [Extract from input: specific state description for THIS orientation - e.g., "Persistent across transformations", "Latent, activated under pressure", etc.]
- **Trace Behavior**:
  - **Mutation Rate**: [Extract from input: Low/Medium/High - specific mutation rate of THIS orientation]
  - **Stability**: [Extract from input: High/Medium/Low - specific stability characteristics]
  - **Formation Rate**: [Extract from input if present - how quickly THIS orientation forms or fragments]
  - **Other behaviors**: [Extract any other trace behaviors specific to THIS orientation from input]
- **Affinity Bonds**: [Extract from input: specific bonds THIS orientation forms - e.g., "Strong with [specific cNode X], weak with [specific cNode Y]"]
- **Prestige Role**: [Extract from input: High/Medium/Low - specific prestige characteristics of THIS orientation]

**Cross-Type Interactions:**
- **With Praxis**: [How THIS orientation interacts with methods - test, instantiate, or challenge?]
- **With Doctrine**: [How THIS orientation interacts with rules - inform or get constrained?]
- **With Poiesis**: [How THIS orientation interacts with creative expression - limit or unleash?]
- **With Techne**: [How THIS orientation interacts with tools - guide or emerge from?]
- **With Design**: [How THIS orientation interacts with functional forms - frame or get expressed through?]

**Derivations:**
- **Frames**: [What does THIS orientation frame or make possible?]
- **Presupposes**: [What does THIS orientation presuppose or require?]
- **Enables**: [What does THIS orientation enable or make askable?]
- **Transforms into**: [Does THIS orientation crystallize into Doctrine? Become Praxis? Feed into Poiesis?]

**Hybridizations:**
- **Hybrid Frames**: [What emerges when THIS orientation combines with other cElement types?]
- **Emergent Possibilities**: [What new possibility spaces open when THIS orientation hybridizes?]
- **Creative Recombination**: [How does THIS orientation recombine with other elements to create novel frames?]

**Interaction Dynamics:**
- **Framing**: [How does THIS orientation frame other cNodes? What becomes visible/invisible?]
- **Constraint**: [How does THIS orientation constrain what can be known or asked?]
- **Enabling**: [How does THIS orientation enable new questions or possibilities?]
- **Triggering**: [Does THIS orientation trigger ecstasis or rupture? How?]

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

**Axiomatic Foundation:**
- [the foundational claim or assumption from input - extract the actual statement that functions as an axiomatic foundation]

**Anchors:**
- [what structures, claims, or reasoning this cAtom anchors - what depends on this foundation]
- [what structures, claims, or reasoning this cAtom anchors - what depends on this foundation]
...

**Functional Role:**
- [How does this statement function as an axiomatic foundation? What makes it non-negotiable or foundational?]

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
