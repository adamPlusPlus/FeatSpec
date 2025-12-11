# Poiesis

**Purpose**: Generate creative emergence, generative striving, or expressive output. Poiesis is the blooming of the blossom — the striving for immortality through creation. It is fluid, expansive, and driven by the desire to create or bloom.

**Input**: {USER_INPUT} or portions from previous steps ({PREVIOUS_OUTPUT})
**Output**: Creative expression, generative structure, or emergent form
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**:

- Can link to: Theoria, Praxis, Doctrine
- Can be repeated to refine, expand, or generate new expressions
- Previous steps: {PREVIOUS_STEPS}

---

## Input Guidance

**What to enter in the Input field:**

- **Your creative expression or output**: Enter the creative expression, output, or generative structure you want to analyze
- **Portions from previous steps**: Reference Theoria (to understand generative capacity), Praxis (to channel through method), or Doctrine (to work within or against constraints)
- **Mixed input**: Combine your own creative expressions with fragments from previous steps
- **Empty input**: Begin with pure generative pressure and let expression emerge

**Tip**: Poiesis is not directed but pressure-driven. It is felt and expressed, not calculated. Poiesis is the **output mode** of poietic blooming.

**CRITICAL**: Your task is to **IDENTIFY and ARTICULATE** the poiesis (creative expression, generative structure) that **already exists** in the input, not to create a new poiesis. The poiesis is already present in the input—you must reveal it, not invent it.

**CRITICAL - Context Integration**: 
- **Previous Steps Available**: All previously established cAtoms, ccompounds (compound structures), and cElements from previous steps (Theoria, Praxis, Doctrine, Poiesis) are available in the conversation history
- **You MUST consider**: All cAtoms, ccompounds, and cElements from previous steps when analyzing the current input
- **Fresh Input**: The input field contains NEW input specific to this step that should be processed
- **Integration**: Your analysis should integrate both:
  1. Previously established foundations (cAtoms, ccompounds, cElements) from conversation history
  2. Fresh input provided in the current step's input field
- **Reference Previous**: When extracting poiesis cNodes, reference and build upon cAtoms, ccompounds, and cElements from previous steps
- **Build Upon**: Your poiesis should build upon the axiomatic foundations (cAtoms) and structures (ccompounds, cElements) already established

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/poiesis-output`
- **Files to Watch**: `poiesis-{AUTOMATION_ID}-draft.md`
- **Complete Files**: `poiesis-{AUTOMATION_ID}-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms (file must be unchanged for 10 seconds)
- **File Count**: 1

**Important Instructions for LLM Agents:**

1. **Create the target directory** as specified above
2. **Use the automation ID**: The automation ID for this step is `{AUTOMATION_ID}`. You MUST include this ID in all filenames.
3. **Start with draft files**: Begin writing to files with the pattern `poiesis-{AUTOMATION_ID}-draft.md` (replace `{AUTOMATION_ID}` with the actual ID shown above)
4. **Edit incrementally**: You may edit the draft file multiple times as you compose the document
5. **Signal completion**: When finished, create the file `poiesis-{AUTOMATION_ID}-complete.md` (replace `{AUTOMATION_ID}` with the actual ID)
6. **File stability**: The system waits for files to be stable (unchanged) before processing
7. **CRITICAL**: The automation ID must be included in the filename exactly as shown. Do not omit it or use a different format.

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Poiesis Tasks:**

**CRITICAL INSTRUCTION**: Your output must be **cNodes and cElements**, not summaries or explanations. Extract the actual poiesis cNodes from the input. Do NOT explain what poiesis is. Do NOT invent content that doesn't exist in the input. Extract what exists in the input, using direct quotes when available, or extracting the essential content when the meaning is clear but wording differs.

1. **Extract Poiesis cNodes** (from the input)
   - Identify each distinct creative expression, output, or generative structure **as a separate cNode**
   - Label each cNode with its type: `poiesis`
   - Extract generative impulse **from input** - use direct quotes when available, otherwise extract the essential generative impulse content
   - Extract expression form, content, style, symbolic load **from input** - extract what forms, content, styles, and symbolic loads are described

2. **Extract Expression cNodes** (from the input)
   - Identify form **as form cNodes** (type: `form`)
   - Identify content **as content cNodes** (type: `content`)
   - Identify style **as style cNodes** (type: `style`)
   - Identify symbolic load **as symbolic-load cNodes** (type: `symbolic-load`)
   - Identify cNode binding **as binding cNodes** (type: `cnode-binding`)

3. **Extract Generative Structure cNodes** (from the input)
   - Identify key cNode elements **as element cNodes** (type: `cnode-element`)
   - Identify cNode relationships **as relationship cNodes** (type: `cnode-relationship`)
   - Identify Bodies formed **as body cNodes** (type: `body`)
   - Identify trace patterns **as trace-pattern cNodes** (type: `trace-pattern`)
   - Identify signalpath/tracegraph structures **as structure cNodes** (type: `signalpath` or `tracegraph`)

4. **Extract Relationship cNodes** (from the input)
   - Identify relationships to previous steps **as relationship cNodes** (type: `relationship`)
   - Identify affinity bonds **as bond cNodes** (type: `affinity-bond`)
   - Identify contradictions **as contradiction cNodes** (type: `contradiction`)
   - Identify ecstasis potential **as ecstasis cNodes** (type: `ecstasis`)
   - Identify expression mutation **as mutation cNodes** (type: `expression-mutation`)

5. **Extract Instance-Specific cElement Properties** (from input only)
   - For each poiesis cNode, extract instance-specific properties **directly from the input**:
     - **State**: [Extract from input: Mutable/Stable/Adaptive/Polyformic/etc. - describe the actual state of THIS specific expression]
     - **Trace Behavior**:
       - **Visibility**: [Extract from input: High/Medium/Low - how visible is THIS specific expression's trace?]
       - **Mutation Rate**: [Extract from input: High/Medium/Low - how quickly does THIS specific expression mutate?]
       - **Stability**: [Extract from input if present - how stable is THIS specific expression?]
       - **CRITICAL**: Extract actual behavior patterns from input. If not present in input, OMIT rather than using defaults.
     - **Affinity Bonds**: [Extract from input: Strong/Medium/Weak with specific cElements/cNodes - what does THIS expression actually bond with?]
     - **Prestige Role**: [Extract from input: High/Medium/Low - what prestige does THIS specific expression carry?]
   - **DO NOT** include static type-level properties (Function, Epistemic Role, Ecstasis Role) - these are redundant with the cNode type.
   - **DO** provide rich, specific details about THIS particular instance extracted from the input.

6. **Extract Cross-Type Interactions and Derivations** (from input)
   - **Interactions**: Identify how THIS poiesis cNode interacts with other cElement types (Theoria, Praxis, Doctrine, Techne, Design, Foam):
     - **With Theoria**: [How does THIS expression interact with theoric orientations? Does it amplify, challenge, or transform them?]
     - **With Praxis**: [How does THIS expression interact with methods? Does it channel through praxis or resist it?]
     - **With Doctrine**: [How does THIS expression interact with rules/constraints? Does it work within, against, or transform doctrine?]
     - **With Techne**: [How does THIS expression interact with tools/processes? Does it become techne or use techne?]
     - **With Design**: [How does THIS expression interact with functional forms? Does it inform design or emerge from it?]
   - **Derivations**: Identify what THIS poiesis cNode generates or transforms into:
     - **Generates**: [What new cNodes, Bodies, or structures does THIS expression create?]
     - **Transforms into**: [Does THIS expression stabilize into Doctrine? Become Techne? Feed into Design?]
     - **Becomes**: [What does THIS expression become when it crystallizes or mutates?]
   - **Hybridizations**: Identify creative combinations ("idea sex") where THIS poiesis cNode combines with other types:
     - **Hybrid Forms**: [What emerges when THIS expression combines with Theoria/Praxis/Doctrine/etc.?]
     - **Emergent Properties**: [What new properties, behaviors, or structures emerge from these combinations?]
     - **Creative Recombination**: [How does THIS expression recombine with other elements to create novel forms?]
   - **Interaction Dynamics**: Extract the actual dynamics from input:
     - **Amplification**: [Does THIS expression amplify other cNodes? How?]
     - **Transformation**: [Does THIS expression transform other cNodes? Into what?]
     - **Resistance**: [Does THIS expression resist or challenge other cNodes? How?]
     - **Catalysis**: [Does THIS expression catalyze interactions between other cNodes?]

**Output Format:**

```markdown
## Poiesis cNodes

### cNode: [Expression Name from Input]
**Type:** `poiesis`
**Source:** input

**Content:**
- **Generative Impulse**: [impulse from input]
- **Creative Pressure**: [pressure from input]
- **Form Seeking**: [form from input]
- **Generative Striving**: [striving from input]

**cElement Properties:**
- **State**: [Extract from input: specific state description for THIS expression - e.g., "Highly mutable, adapts to audience context", "Stable symbolic form", etc.]
- **Trace Behavior**:
  - **Visibility**: [Extract from input: High/Medium/Low - specific visibility characteristics of THIS expression]
  - **Mutation Rate**: [Extract from input: High/Medium/Low - specific mutation rate of THIS expression]
  - **Stability**: [Extract from input if present - specific stability characteristics]
  - **Other behaviors**: [Extract any other trace behaviors specific to THIS expression from input]
- **Affinity Bonds**: [Extract from input: specific bonds THIS expression forms - e.g., "Strong with [specific cNode X], weak with [specific cNode Y]"]
- **Prestige Role**: [Extract from input: High/Medium/Low - specific prestige characteristics of THIS expression]

**Generates:**
- [cNode/Body structures from input]

**Cross-Type Interactions:**
- **With Theoria**: [How THIS expression interacts with theoric orientations - amplify, challenge, transform?]
- **With Praxis**: [How THIS expression interacts with methods - channel through or resist?]
- **With Doctrine**: [How THIS expression interacts with rules - work within, against, or transform?]
- **With Techne**: [How THIS expression interacts with tools - becomes techne or uses techne?]
- **With Design**: [How THIS expression interacts with functional forms - informs or emerges from?]

**Derivations:**
- **Generates**: [What new cNodes, Bodies, or structures does THIS expression create?]
- **Transforms into**: [Does THIS expression stabilize into Doctrine? Become Techne? Feed into Design?]
- **Becomes**: [What does THIS expression become when it crystallizes or mutates?]

**Hybridizations:**
- **Hybrid Forms**: [What emerges when THIS expression combines with other cElement types?]
- **Emergent Properties**: [What new properties, behaviors, or structures emerge from these combinations?]
- **Creative Recombination**: [How does THIS expression recombine with other elements to create novel forms?]

**Interaction Dynamics:**
- **Amplification**: [Does THIS expression amplify other cNodes? How?]
- **Transformation**: [Does THIS expression transform other cNodes? Into what?]
- **Resistance**: [Does THIS expression resist or challenge other cNodes? How?]
- **Catalysis**: [Does THIS expression catalyze interactions between other cNodes?]

---

### cNode: [Form Name from Input]
**Type:** `form`
**Source:** input

**Form Type:** [Linguistic / Aesthetic / Functional / Behavioral / Encoded] - [from input]

**Related:**
- [poiesis cNode] → takes this form

---

### cNode: [Content Name from Input]
**Type:** `content`
**Source:** input

**Content:**
- [actual expression/creation/output from input]

**Related:**
- [poiesis cNode] → expresses this content

---

### cNode: [Style Name from Input]
**Type:** `style`
**Source:** input

**Style:**
- [aesthetic or expressive qualities from input]

**Related:**
- [poiesis cNode] → exhibits this style

---

### cNode: [Symbolic Load Name]
**Type:** `symbolic-load`
**Source:** input

**Symbolic Load:**
- [meaning or significance from input]

**Related:**
- [poiesis cNode] → carries this symbolic load

---

### cNode: [Binding Name from Input]
**Type:** `cnode-binding`
**Source:** input

**Binding:**
- [how input binds cNodes, claimnodes, and eframes to visible form]

**Related:**
- [poiesis cNode] → uses this binding

---

### cNode: [Element Name from Input]
**Type:** `cnode-element`
**Source:** input

**Element:**
- [cNode element from input] - [type/role]

**Related:**
- [poiesis cNode] → contains this element

---

### cNode: [Relationship Name from Input]
**Type:** `cnode-relationship`
**Source:** input

**Relationship:**
- [cNode A from input] → relates to [cNode B from input] through [bond type] → forms [Body/Being]

**Related:**
- [poiesis cNode] → contains this relationship

---

### cNode: [Body Name from Input]
**Type:** `body`
**Source:** input

**Body:**
- [Body formed from input]

**Formed by:**
- [cNode relationship] → forms this Body

---

### cNode: [Trace Pattern Name from Input]
**Type:** `trace-pattern`
**Source:** input

**Pattern:**
- [trace pattern from input] → creates [signalpath structure]
- [trace pattern from input] → follows [tracegraph path]

**Related:**
- [poiesis cNode] → generates this pattern

---

### cNode: [Signalpath/Tracegraph Name]
**Type:** `signalpath` or `tracegraph`
**Source:** input

**Structure:**
- [signalpath/tracegraph structure from input]

**Related:**
- [poiesis cNode] → creates this structure

---

### cNode: [Relationship Name]
**Type:** `relationship`
**Source:** input

**Links:**
- [poiesis cNode] → [previous step cNode] - [relationship from input]

---

### cNode: [Bond Name]
**Type:** `affinity-bond`
**Source:** input

**Bond:**
- [poiesis cNode] → [Theoria/Praxis/Doctrine/Techne/Foam] - [Strong/Medium/Weak] - [bond from input]

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

### cNode: [Mutation Name]
**Type:** `expression-mutation`
**Source:** input

**Mutation:**
- **Symbolic Form**: [Before in input] → [After Ecstasis potential]
- **Transmission Channel**: [Before in input] → [After Ecstasis potential]
- **Perceived Fidelity**: [Before in input] → [After Ecstasis potential]
- **Audience Mapping**: [Before in input] → [After Ecstasis potential]

---

### cNode: [Resonance Name]
**Type:** `resonance`
**Source:** input

**Resonance:**
- [Audience/Context from input]: [Why it resonates]

---

### cNode: [Meaning Name]
**Type:** `emergent-meaning`
**Source:** input

**Meaning:**
- [interpretation from input]

---

### cNode: [Generation Name]
**Type:** `further-generation`
**Source:** input

**Generation:**
- [additional creation the input might trigger - new cNodes, Bodies, or tracegraph expansion]
```

---

## Quality Criteria

- Generative impulse clearly identified
- Expression form and content articulated
- Generative structure mapped in cNode terms
- cElement properties described
- Relationships to other steps traced as cElements
- Expression potential identified (resonance, meanings, further generation)
- Expression mutation vectors identified
- Tracegraph integration explained
- Ready for linking to Theoria, Praxis, or Doctrine

---

## Linking Instructions

**To use this Poiesis in other steps:**

- **For Theoria**: Use this poiesis to understand what theoric frames limit or unleash
- **For Praxis**: Use this poiesis to see how method and muse interact
- **For Doctrine**: Use this poiesis to understand how constraints shape expression
- **For repeated Poiesis**: Use this output to refine, expand, or generate new expressions

**To reference previous steps:**

- Use specific sections from previous Theoria, Praxis, Doctrine, or Poiesis outputs
- Quote relevant portions in your input
- Note how this expression builds on or diverges from previous creations
- Reference cNode, cElement, Body, or tracegraph structures from previous steps
