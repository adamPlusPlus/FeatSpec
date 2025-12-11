# Doctrine

**Purpose**: Codify structure into declared principles, rules, or standards. Doctrine is what Theoria becomes when it **hardens** — expressed, encoded, defended. Doctrine **frames the permitted operations**, limits ambiguity, and calcifies lineage. It is **institutionalized Theoria**.

**Input**: {USER_INPUT} or portions from previous steps ({PREVIOUS_OUTPUT})
**Output**: Declared structure, codified principles, rules, or standards
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**:

- Can link to: Theoria, Praxis, Poiesis
- Can be repeated to refine, expand, or create alternative doctrines
- Previous steps: {PREVIOUS_STEPS}

---

## Input Guidance

**What to enter in the Input field:**

- **Your principles, rules, or structures**: Enter the principles, rules, standards, or structures you want to analyze
- **Portions from previous steps**: Reference Theoria (to formalize orientation), Praxis (to encode method), or Poiesis (to structure expression)
- **Mixed input**: Combine your own principles with fragments from previous steps
- **Empty input**: Begin with pure structure and let doctrine emerge

**Tip**: Doctrine enforces **ontological boundaries** and **prescriptive structure**. It is semi-stable and adapts only through external contradiction or internal strain.

**CRITICAL**: Your task is to **IDENTIFY and ARTICULATE** the doctrine (principles, rules, structures) that **already exists** in the input, not to create a new doctrine. The doctrine is already present in the input—you must reveal it, not invent it.

**CRITICAL - Context Integration**: 
- **Previous Steps Available**: All previously established cAtoms, ccompounds (compound structures), and cElements from previous steps (Theoria, Praxis, Doctrine, Poiesis) are available in the conversation history
- **You MUST consider**: All cAtoms, ccompounds, and cElements from previous steps when analyzing the current input
- **Fresh Input**: The input field contains NEW input specific to this step that should be processed
- **Integration**: Your analysis should integrate both:
  1. Previously established foundations (cAtoms, ccompounds, cElements) from conversation history
  2. Fresh input provided in the current step's input field
- **Reference Previous**: When extracting doctrine cNodes, reference and build upon cAtoms, ccompounds, and cElements from previous steps
- **Build Upon**: Your doctrine should build upon the axiomatic foundations (cAtoms) and structures (ccompounds, cElements) already established

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/doctrine-output`
- **Files to Watch**: `doctrine-{AUTOMATION_ID}-draft.md`
- **Complete Files**: `doctrine-{AUTOMATION_ID}-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms (file must be unchanged for 10 seconds)
- **File Count**: 1

**Important Instructions for LLM Agents:**

1. **Create the target directory** as specified above
2. **Use the automation ID**: The automation ID for this step is `{AUTOMATION_ID}`. You MUST include this ID in all filenames.
3. **Start with draft files**: Begin writing to files with the pattern `doctrine-{AUTOMATION_ID}-draft.md` (replace `{AUTOMATION_ID}` with the actual ID shown above)
4. **Edit incrementally**: You may edit the draft file multiple times as you compose the document
5. **Signal completion**: When finished, create the file `doctrine-{AUTOMATION_ID}-complete.md` (replace `{AUTOMATION_ID}` with the actual ID)
6. **File stability**: The system waits for files to be stable (unchanged) before processing
7. **CRITICAL**: The automation ID must be included in the filename exactly as shown. Do not omit it or use a different format.

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Doctrine Tasks:**

**CRITICAL INSTRUCTION**: Your output must be **cNodes and cElements**, not summaries or explanations. Extract the actual doctrine cNodes from the input. Do NOT explain what doctrine is. Do NOT invent content that doesn't exist in the input. Extract what exists in the input, using direct quotes when available, or extracting the essential content when the meaning is clear but wording differs.

1. **Extract Doctrine cNodes** (from the input)
   - Identify each distinct principle, rule, or standard **as a separate cNode**
   - Label each cNode with its type: `doctrine`
   - Extract principle/rule/standard **from input** - use direct quotes when available, otherwise extract the essential principle/rule/standard content
   - Extract boundary conditions **from input** - extract what boundary conditions are described
   - Extract validation criteria **from input** - extract what validation criteria are described

2. **Extract Structure cNodes** (from the input)
   - Identify hierarchy **as hierarchy cNodes** (type: `hierarchy`)
   - Identify dependencies **as dependency cNodes** (type: `dependency`)
   - Identify exceptions/edge cases **as exception cNodes** (type: `exception`)
   - Identify enforcement mechanisms **as enforcement cNodes** (type: `enforcement`)
   - Identify trace architecture **as trace-architecture cNodes** (type: `trace-architecture`)
   - Identify trace patterns **as trace-pattern cNodes** (type: `trace-pattern`)

3. **Extract Tagged cNodes** (from the input)
   - Identify cNodes tagged with `doctrine` **as doctrine-tagged cNodes** (type: `doctrine-tagged`)

4. **Extract Relationship cNodes** (from the input)
   - Identify relationships to previous steps **as relationship cNodes** (type: `relationship`)
   - Identify affinity bonds **as bond cNodes** (type: `affinity-bond`)
   - Identify contradictions **as contradiction cNodes** (type: `contradiction`)
   - Identify ecstasis potential **as ecstasis cNodes** (type: `ecstasis`)
   - Identify doctrinal recursion **as recursion cNodes** (type: `doctrinal-recursion`)
   - Identify prestige economies **as prestige-economy cNodes** (type: `prestige-economy`)

5. **Extract Instance-Specific cElement Properties** (from input only)
   - For each doctrine cNode, extract instance-specific properties **directly from the input**:
     - **State**: [Extract from input: Semi-stable/Stable/Rigid/etc. - describe the actual state of THIS specific principle/rule]
     - **Trace Behavior**:
       - **Replication Tendency**: [Extract from input: High/Medium/Low - how much does THIS specific doctrine replicate?]
       - **Mutation Rate**: [Extract from input: Low/Medium/High - how quickly does THIS specific doctrine mutate?]
       - **Rigidity**: [Extract from input if present - how rigid is THIS specific doctrine?]
       - **CRITICAL**: Extract actual behavior patterns from input. If not present in input, OMIT rather than using defaults.
     - **Affinity Bonds**: [Extract from input: Strong/Medium/Weak with specific cElements/cNodes - what does THIS doctrine actually bond with?]
     - **Prestige Role**: [Extract from input: High/Medium/Low - what prestige does THIS specific doctrine carry?]
   - **DO NOT** include static type-level properties (Function, Epistemic Role, Ecstasis Role) - these are redundant with the cNode type.
   - **DO** provide rich, specific details about THIS particular instance extracted from the input.

6. **Extract Cross-Type Interactions and Derivations** (from input)
   - **Interactions**: Identify how THIS doctrine cNode interacts with other cElement types (Theoria, Praxis, Poiesis, Techne, Design, Foam):
     - **With Theoria**: [How does THIS doctrine interact with orientations? Does it constrain, inform, or get informed by theoria?]
     - **With Praxis**: [How does THIS doctrine interact with methods? Does it get challenged, reified, or transformed by praxis?]
     - **With Poiesis**: [How does THIS doctrine interact with creative expression? Does it constrain, shape, or get disrupted by poiesis?]
     - **With Techne**: [How does THIS doctrine interact with tools? Does it govern techne or get embedded in it?]
     - **With Design**: [How does THIS doctrine interact with functional forms? Does it constrain design or get expressed through it?]
   - **Derivations**: Identify what THIS doctrine cNode generates or transforms into:
     - **Governs**: [What does THIS doctrine govern or constrain?]
     - **Enables**: [What does THIS doctrine enable or make possible?]
     - **Transforms into**: [Does THIS doctrine break into Practopoiesis? Collapse? Evolve into new doctrine?]
     - **Becomes**: [What does THIS doctrine become when it recurses or fragments?]
   - **Hybridizations**: Identify creative combinations where THIS doctrine cNode combines with other types:
     - **Hybrid Structures**: [What emerges when THIS doctrine combines with Theoria/Praxis/Poiesis/etc.?]
     - **Emergent Rules**: [What new rules or structures emerge from these combinations?]
     - **Creative Recombination**: [How does THIS doctrine recombine with other elements to create novel structures?]
   - **Interaction Dynamics**: Extract the actual dynamics from input:
     - **Constraint**: [How does THIS doctrine constrain other cNodes? What boundaries does it enforce?]
     - **Enforcement**: [How does THIS doctrine enforce its rules? What mechanisms does it use?]
     - **Rupture**: [How does THIS doctrine break or fragment? What triggers ecstasis?]
     - **Recursion**: [How does THIS doctrine recurse? What nested structures does it create?]

**Output Format:**

```markdown
## Doctrine cNodes

### cNode: [Principle/Rule Name from Input]
**Type:** `doctrine`
**Source:** input

**Content:**
- **Principle**: [principle from input]
- **Rule**: [rule from input]
- **Standard**: [standard from input]

**cElement Properties:**
- **State**: [Extract from input: specific state description for THIS doctrine - e.g., "Semi-stable, adapts only under pressure", "Rigid, resistant to change", etc.]
- **Trace Behavior**:
  - **Replication Tendency**: [Extract from input: High/Medium/Low - specific replication characteristics of THIS doctrine]
  - **Mutation Rate**: [Extract from input: Low/Medium/High - specific mutation rate of THIS doctrine]
  - **Rigidity**: [Extract from input if present - specific rigidity characteristics]
  - **Other behaviors**: [Extract any other trace behaviors specific to THIS doctrine from input]
- **Affinity Bonds**: [Extract from input: specific bonds THIS doctrine forms - e.g., "Strong with [specific cNode X], medium with [specific cNode Y]"]
- **Prestige Role**: [Extract from input: High/Medium/Low - specific prestige characteristics of THIS doctrine]

**Cross-Type Interactions:**
- **With Theoria**: [How THIS doctrine interacts with orientations - constrain, inform, or get informed?]
- **With Praxis**: [How THIS doctrine interacts with methods - get challenged, reified, or transformed?]
- **With Poiesis**: [How THIS doctrine interacts with creative expression - constrain, shape, or get disrupted?]
- **With Techne**: [How THIS doctrine interacts with tools - govern techne or get embedded?]
- **With Design**: [How THIS doctrine interacts with functional forms - constrain design or get expressed through?]

**Derivations:**
- **Governs**: [What does THIS doctrine govern or constrain?]
- **Enables**: [What does THIS doctrine enable or make possible?]
- **Transforms into**: [Does THIS doctrine break into Practopoiesis? Collapse? Evolve into new doctrine?]
- **Becomes**: [What does THIS doctrine become when it recurses or fragments?]

**Hybridizations:**
- **Hybrid Structures**: [What emerges when THIS doctrine combines with other cElement types?]
- **Emergent Rules**: [What new rules or structures emerge from these combinations?]
- **Creative Recombination**: [How does THIS doctrine recombine with other elements to create novel structures?]

**Interaction Dynamics:**
- **Constraint**: [How does THIS doctrine constrain other cNodes? What boundaries does it enforce?]
- **Enforcement**: [How does THIS doctrine enforce its rules? What mechanisms does it use?]
- **Rupture**: [How does THIS doctrine break or fragment? What triggers ecstasis?]
- **Recursion**: [How does THIS doctrine recurse? What nested structures does it create?]

**Governs:**
- [cNode/Body structures from input]

---

### cNode: [Boundary Name from Input]
**Type:** `boundary`
**Source:** input

**Permitted:**
- [action/expression from input]
- [action/expression from input]
...

**Forbidden:**
- [action/expression from input]
- [action/expression from input]
...

**Related:**
- [doctrine cNode] → enforces this boundary

---

### cNode: [Validation Name from Input]
**Type:** `validation`
**Source:** input

**Criteria:**
- [validation criteria from input]

**Related:**
- [doctrine cNode] → uses this validation

---

### cNode: [Expression Requirement Name]
**Type:** `expression-requirement`
**Source:** input

**Requirement:**
- [expression requirement from input]

**Related:**
- [doctrine cNode] → requires this expression

---

### cNode: [Hierarchy Name from Input]
**Type:** `hierarchy`
**Source:** input

**Hierarchy:**
- [Level 1 from input]: [Principle/Rule]
  - [Level 2 from input]: [Sub-principle/Sub-rule]
    - [Level 3 from input]: [Detail]
...

**Related:**
- [doctrine cNode] → organized in this hierarchy

---

### cNode: [Dependency Name from Input]
**Type:** `dependency`
**Source:** input

**Dependency:**
- [Principle A from input] → depends on [Principle B from input]
- [Rule X from input] → requires [Rule Y from input]
...

---

### cNode: [Exception Name from Input]
**Type:** `exception`
**Source:** input

**Exception:**
- [Exception from input]: [Condition] → [Alternative rule]

---

### cNode: [Enforcement Name from Input]
**Type:** `enforcement`
**Source:** input

**Mechanism:**
- [enforcement mechanism from input]

**Related:**
- [doctrine cNode] → enforced by this mechanism

---

### cNode: [Tagged cNode Name]
**Type:** `doctrine-tagged`
**Source:** input

**Tagged with:** `doctrine`

**Content:**
- [cNode content from input]

---

### cNode: [Trace Architecture Name]
**Type:** `trace-architecture`
**Source:** input

**Architecture:**
- [trace architecture from input]

**Related:**
- [doctrine cNode] → creates this architecture

---

### cNode: [Trace Pattern Name]
**Type:** `trace-pattern`
**Source:** input

**Pattern:**
- [Linear / Tree-like / Hierarchical] - [from input]

**Related:**
- [doctrine cNode] → prefers this pattern

---

### cNode: [Relationship Name]
**Type:** `relationship`
**Source:** input

**Links:**
- [doctrine cNode] → [previous step cNode] - [relationship from input]

---

### cNode: [Bond Name]
**Type:** `affinity-bond`
**Source:** input

**Bond:**
- [doctrine cNode] → [Theoria/Praxis/Poiesis/Techne/Design/Metaphysic] - [Strong/Medium/Weak] - [bond from input]

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
**Type:** `doctrinal-recursion`
**Source:** input

**Recursion:**
- [rules about rules, tracebleed from input]

---

### cNode: [Prestige Economy Name]
**Type:** `prestige-economy`
**Source:** input

**Economy:**
- [prestige economy from input]
```

---

## Quality Criteria

- Core principles clearly articulated
- Boundary conditions (permitted/forbidden) defined
- Validation criteria specified
- Doctrinal structure mapped in cNode terms (hierarchy, dependencies, exceptions, trace architecture)
- cElement properties described
- Relationships to other steps traced as cElements
- Recursion and rupture potential identified
- Tracegraph integration explained
- Ready for linking to Theoria, Praxis, or Poiesis

---

## Linking Instructions

**To use this Doctrine in other steps:**

- **For Theoria**: Use this doctrine to understand what orientation it formalizes
- **For Praxis**: Use this doctrine to see what methods are limited or enabled
- **For Poiesis**: Use this doctrine to understand what expression is throttled or shaped
- **For repeated Doctrine**: Use this output to refine, expand, or create alternative doctrines

**To reference previous steps:**

- Use specific sections from previous Theoria, Praxis, Doctrine, or Poiesis outputs
- Quote relevant portions in your input
- Note how this doctrine builds on or conflicts with previous structures
- Reference cNode, cElement, or Body structures from previous steps
