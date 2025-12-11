// Input Guidance Data - Case and Step Specific Input Instructions
// This file contains highly specific Input Guidance for every case/step combination
// Based on actual prompt templates and modifiers

const InputGuidanceData = {
    // Case 1: Codebase Analysis
    "1": {
        "research": {
            "modifiers": ["codebase-rag"],
            "guidance": "**What to enter in the Input field:**\n\n- **Codebase files**: Paste source code files, function definitions, class structures, or code snippets you want analyzed\n- **Documentation URLs**: Paste links to official documentation, API docs, developer guides, or README files\n- **Code comments**: Include code files with inline comments, JSDoc, docstrings, or function/class documentation\n- **Test files**: Include unit tests, integration tests, or test descriptions that document expected behavior\n- **Build a searchable knowledge base**: The system will scan all provided code and documentation to build a retrieval-augmented generation knowledge base\n\n**Tip**: Include as much code and documentation as possible. The more sources you provide, the better the research summary will be. Use \"Paste from Previous\" button if you want to include output from a previous step."
        },
        "feature-extraction": {
            "modifiers": ["codebase-deep"],
            "guidance": "**What to enter in the Input field:**\n\n- **If using conversation memory**: The input field is optional - previous step outputs are available in the conversation history. Only enter NEW input specific to this step.\n- **If NOT using conversation memory**: Paste the **Research Summary** output from the Research step\n- The research summary should contain scanned codebase sources, documentation, code comments, and test files\n- The system will perform deep code analysis to extract architectural patterns, code formatting, atomic/composite boundaries, and implementation details\n- If using `enhancement-input` modifier: Also include existing feature documentation from previous case output\n\n**Tip**: If the LLM has conversation memory and scope, you don't need to paste previous outputs - they're available in the conversation. Use \"Paste from Previous\" only if conversation memory is disabled."
        },
        "validation": {
            "modifiers": ["codebase"],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Feature Extraction** output from the previous step\n- The system will cross-reference extracted features against the actual codebase implementation\n- Validation will verify features exist in code, check documentation accuracy, validate behavior matches code, and identify missing code paths\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Feature Extraction output. The validation will ensure extracted features accurately reflect the codebase."
        },
        "app-analysis": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Validated Features** output from the Validation step\n- Optionally include application description or existing features for context\n- The system will create a comprehensive feature inventory with user goals, interactions, visual indicators, and context\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Validation output. This step creates the feature inventory that will be decomposed."
        },
        "decomposition": {
            "modifiers": ["codebase-pseudocode"],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Feature Inventory** output from the App Analysis step\n- The system will break features into atomic components and may convert relevant code to pseudocode\n- Complex pseudocode will be atomized into smaller blocks\n- If using `enhancement-input` modifier: Also include existing decomposition from previous case output\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the App Analysis output. The decomposition will create a hierarchical structure showing parent features → child features → atomic features."
        },
        "atomic-features": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Decomposed Features** output from the Decomposition step\n- This contains the hierarchical decomposition with atomic features identified\n- The system will create detailed, platform-agnostic descriptions for each atomic feature\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Decomposition output. Each atomic feature will be described with user goals, triggers, interaction flows, visual feedback, timing, edge cases, and error states."
        },
        "ux-specification": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomic Features** output from the previous step\n- This contains detailed descriptions of each atomic feature\n- The system will create an extremely detailed UX specification document with phase-by-phase breakdowns, terminology key, and complete interaction specifications\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Atomic Features output. The UX specification will be ready for implementation or further analysis."
        },
        "validation-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **output from the previous workflow step** that you want to validate\n- This should be the complete output from Research, Feature Extraction, App Analysis, Decomposition, Atomic Features, or UX Specification step\n- The validation loop will assess completeness, identify gaps, and determine if iteration is needed\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the previous step's output. The validation will help ensure quality before proceeding."
        },
        "refinement-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste **complex elements** from the Decomposition step that need further refinement\n- This includes complex pseudocode, composite features, or descriptions that are too complex\n- The system will identify complex elements and apply atomization process if needed\n\n**Tip**: Use this step when decomposition produces elements that are still too complex and need further breaking down."
        }
    },
    
    // Case 2: UI/UX-Only Analysis
    "2": {
        "research": {
            "modifiers": ["ui-only"],
            "guidance": "**What to enter in the Input field:**\n\n- **UI screenshots**: Paste screenshots of all UI states, screens, and interaction points\n- **Interaction recordings**: Paste recordings or descriptions of user interaction sequences, navigation flows, and state transitions\n- **Visual observations**: Include detailed notes about visual elements, their properties (colors, sizes, positions), animations, and transitions\n- **UI behavior notes**: Document timing information, feedback mechanisms (visual, haptic, audio), error states, and recovery flows\n- **Systematic UI documentation**: The system will document UI observations systematically when codebase is not available\n\n**Tip**: Be thorough in documenting UI states and interactions. Include screenshots of error states, edge cases, and all major interaction flows. Use \"Paste from Previous\" button if you want to include output from a previous step."
        },
        "feature-extraction": {
            "modifiers": ["ui-only"],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Research Summary** output from the Research step\n- The research summary should contain UI observations, screenshots, interaction recordings, and visual behavior notes\n- The system will extract features from UI observations, infer feature boundaries from UI behavior, and document visual and interaction patterns\n- If using `enhancement-input` modifier: Also include existing feature documentation from previous case output\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Research step output. The feature extraction will infer features from what you observed in the UI."
        },
        "validation": {
            "modifiers": ["ui-only"],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Feature Extraction** output from the previous step\n- The system will cross-reference inferred features against observed UI behavior\n- Validation will verify inferred features match observations, check feature boundaries against UI structure, and identify missing UI states\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Feature Extraction output. The validation ensures inferred features accurately reflect what was observed in the UI."
        },
        "app-analysis": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Validated Features** output from the Validation step\n- Optionally include application description or existing features for context\n- The system will create a comprehensive feature inventory based on UI observations\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Validation output. This step creates the feature inventory from UI-observed features."
        },
        "decomposition": {
            "modifiers": ["standard"],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Feature Inventory** output from the App Analysis step\n- The system will break features into components using standard decomposition process\n- Features will be classified as atomic or composite, with composite components further decomposed\n- If using `enhancement-input` modifier: Also include existing decomposition from previous case output\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the App Analysis output. The decomposition will create a hierarchical structure of UI-observed features."
        },
        "atomic-features": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Decomposed Features** output from the Decomposition step\n- This contains the hierarchical decomposition with atomic features identified from UI observations\n- The system will create detailed, platform-agnostic descriptions for each atomic feature based on UI behavior\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Decomposition output. Each atomic feature will be described based on what was observed in the UI."
        },
        "ux-specification": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomic Features** output from the previous step\n- This contains detailed descriptions of each atomic feature inferred from UI observations\n- The system will create an extremely detailed UX specification document\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Atomic Features output. The UX specification will be based on UI observations."
        },
        "data-model-inference": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomic Features** output from the Atomic Features step\n- Optionally paste the **UX Specification** output if available\n- The system will infer data structures from UI observations (fields, lists, displays, UI connections)\n- Data types, validation constraints, default values, and data relationships will be inferred from UI behavior\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Atomic Features output. This inference step creates data models when codebase is not available."
        },
        "state-machine-inference": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomic Features** output from the Atomic Features step\n- Paste the **Data Model Inference** output from the previous inference step\n- Optionally paste the **UX Specification** output if available\n- The system will infer state machines from UI behavior and state changes observed\n- States, transitions, state properties, and state relationships will be inferred from UI observations\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the previous outputs. This inference step creates state machines from UI behavior."
        },
        "api-contract-inference": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomic Features** output from the Atomic Features step\n- Paste the **State Machine Inference** output from the previous inference step\n- Optionally paste the **UX Specification** output if available\n- The system will infer API contracts from user interactions and system responses observed in the UI\n- Operations, parameters, return values, and error handling will be inferred from interaction patterns\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the previous outputs. This inference step creates API contracts from UI interactions."
        },
        "behavioral-implementation-spec": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Data Model Inference** output\n- Paste the **State Machine Inference** output\n- Paste the **API Contract Inference** output\n- Paste the **Atomic Features** output\n- This step consolidates all inference outputs into a single behavioral implementation specification\n- The system will create functional requirements, data requirements, state requirements, API requirements, and behavioral specifications\n\n**Tip**: This is the final inference step that combines all previous inference outputs. Paste all inference step outputs to create a complete behavioral specification."
        },
        "validation-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **output from the previous workflow step** that you want to validate\n- This should be the complete output from Research, Feature Extraction, App Analysis, Decomposition, Atomic Features, UX Specification, or any Inference step\n- The validation loop will assess completeness and identify gaps\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the previous step's output."
        }
    },
    
    // Case 3: User Input Analysis
    "3": {
        "research": {
            "modifiers": ["user-input"],
            "guidance": "**What to enter in the Input field:**\n\n- **User descriptions**: Paste free-form text descriptions, user stories, feature requests, bug reports, or user feedback\n- **VTT files**: Paste VTT (WebVTT) transcript files with temporal information, timestamps, and flow descriptions\n- **Transcripts**: Paste text transcripts of user descriptions, interviews, or discussions\n- **Unstructured user input**: Include any unstructured descriptions that need to be parsed and analyzed\n- The system will parse user descriptions, extract key actions and goals, identify interaction patterns, and build a research knowledge base from user-provided information\n\n**Tip**: Include as much user input as possible. VTT files are especially valuable as they contain temporal information. Use \"Paste from Previous\" button if you want to include output from a previous step."
        },
        "feature-extraction": {
            "modifiers": ["user-input"],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Research Summary** output from the Research step\n- The research summary should contain parsed user descriptions, extracted actions, goals, and interaction patterns\n- The system will extract features from parsed descriptions, map to existing features if available, and identify gaps in existing documentation\n- If using `enhancement-input` modifier: Also include existing feature documentation from previous case output for enhancement\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Research step output. The feature extraction will identify features from user descriptions."
        },
        "validation": {
            "modifiers": ["user-input"],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Feature Extraction** output from the previous step\n- The system will validate parsed descriptions against existing features, check for redundancy, and validate enhancement opportunities\n- Validation will verify feature mappings are accurate and confirm new features are truly new\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Feature Extraction output. The validation ensures user descriptions are properly mapped to features."
        },
        "app-analysis": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Validated Features** output from the Validation step\n- Optionally include application description or existing features for context\n- The system will create a comprehensive feature inventory from user-described features\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Validation output. This step creates the feature inventory from user input."
        },
        "decomposition": {
            "modifiers": ["standard"],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Feature Inventory** output from the App Analysis step\n- The system will break features into components using standard decomposition process\n- Features described by users will be decomposed into atomic components\n- If using `enhancement-input` modifier: Also include existing decomposition from previous case output\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the App Analysis output. The decomposition will create a hierarchical structure of user-described features."
        },
        "atomic-features": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Decomposed Features** output from the Decomposition step\n- This contains the hierarchical decomposition with atomic features identified from user descriptions\n- The system will create detailed, platform-agnostic descriptions for each atomic feature based on user input\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Decomposition output. Each atomic feature will be described based on what users described."
        },
        "ux-specification": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomic Features** output from the previous step\n- This contains detailed descriptions of each atomic feature extracted from user descriptions\n- The system will create an extremely detailed UX specification document based on user-described features\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Atomic Features output. The UX specification will be based on user descriptions."
        },
        "validation-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **output from the previous workflow step** that you want to validate\n- This should be the complete output from Research, Feature Extraction, App Analysis, Decomposition, Atomic Features, or UX Specification step\n- The validation loop will assess completeness and identify gaps\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the previous step's output."
        },
        "integration-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste **existing features** from a previous case output (Case 1 or Case 2)\n- Paste **new information** from the current case (Case 3 user descriptions)\n- The system will integrate outputs from multiple sources, resolving conflicts and merging complementary information\n- This is used when combining Case 1 → Case 3, Case 2 → Case 3, or Case 3 → Case 1/2\n\n**Tip**: Include both the existing features and the new user descriptions. The integration loop will merge them intelligently."
        }
    },
    
    // Case 4: Input Preparation
    "4": {
        "input-parsing": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- **Raw user input**: Paste free-form text descriptions, user stories, feature requests, bug reports, user feedback, VTT files, text transcripts, or user observation recordings\n- The system will parse raw input from various sources and extract structured information\n- Input types will be identified and parsed: free-form text, user stories, VTT files, transcripts, temporal flow descriptions\n- Key actions, user goals, interaction patterns, data entities, timing information, visual elements, error scenarios, and edge cases will be extracted\n\n**Tip**: Include all raw input sources you want to parse. VTT files and transcripts are especially valuable for temporal information."
        },
        "input-organization": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Parsed Input** output from the Input Parsing step\n- The system will organize parsed input into logical groups and identify relationships\n- Information will be grouped by theme, feature area, domain, type, screen/area, flow, and feature\n- Relationships will be mapped: actions to goals, data entities to actions, interaction patterns to actions, visual elements to actions, timing to flows, errors to actions/features, edge cases to actions/features\n- Feature candidates will be identified from goal groups, action groups, and interaction patterns\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Input Parsing output. This step organizes the parsed information."
        },
        "input-structuring": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Organized Input** output from the Input Organization step\n- The system will structure organized input into standardized formats suitable for injection into pipeline steps\n- Information will be mapped to target pipeline steps: Research, Feature Extraction, App Analysis, Decomposition, Atomic Features, UX Specification\n- Structured outputs will be created for each target step with relevant context, relationships, temporal information, source references, and confidence indicators\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Input Organization output. This step creates structured files ready for pipeline injection."
        },
        "output-mapping": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Structured Input** output from the Input Structuring step\n- The system will map structured outputs to target pipeline steps and create file associations\n- File associations will specify target case number(s), target section ID(s), variable names for substitution, and import methods\n- Dependencies between files will be documented\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Input Structuring output. This step creates the mapping for importing structured input into target projects."
        },
        "validation-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **output from the previous workflow step** that you want to validate\n- This should be the complete output from Input Parsing, Input Organization, Input Structuring, or Output Mapping step\n- The validation loop will assess completeness and identify gaps\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the previous step's output."
        }
    },
    
    // Case 5: Iterative Idea Refinement
    "5": {
        "idea-capture": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- **Formatted Design Document**: Paste a complete design document, specification, or requirements document\n- **Rough Idea**: Paste a rough concept, user story, feature request, or unstructured description\n- **Existing Documentation**: Paste links to or content from existing documentation that describes the idea\n- **Mixed Input**: Combine any of the above\n- The system will capture and structure the initial idea, whether it's formatted or rough\n\n**Tip**: The more detail you provide initially, the fewer interrogation cycles will be needed later. Include any existing documentation you have."
        },
        "documentation-review": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Idea Capture Summary** output from the previous step\n- Optionally paste links to or content from existing documentation\n- The system will review existing documentation, design documents, and related atomization documents to understand context and requirements\n- The system will identify what documentation is needed and may request access to related atomization documents\n\n**Tip**: If you have existing design documents, specifications, or related feature documentation, include them here. Use \"Paste from Previous\" button to automatically copy the Idea Capture output."
        },
        "user-interrogation": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Idea Capture Summary** output from the Idea Capture step\n- Paste the **Documentation Review** findings from the Documentation Review step\n- The system will generate questions based on gaps and unclear areas\n- You will answer questions in the output field, and the system will generate follow-up questions\n- This is an iterative process to gather all necessary information\n\n**Tip**: Be thorough in your answers. The more detail you provide, the better the final specifications will be. Use \"Paste from Previous\" button to include previous step outputs."
        },
        "iterative-refinement": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **User Interrogation Summary** output from the previous step\n- Paste the **Documentation Review** findings\n- The system will refine the idea based on all gathered information\n- This step may iterate multiple times, with each iteration refining the understanding further\n\n**Tip**: This step may iterate multiple times. Each iteration refines the understanding further. Use \"Paste from Previous\" button to include all relevant information."
        },
        "atomization": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Refined Idea Document** output from the iterative refinement step\n- This document contains all features that need to be atomized\n- The system will break composite features into atomic elements following the feature specification system\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Iterative Refinement output. The atomization process will break composite features into atomic elements."
        },
        "flow-document": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomic Document** output from the atomization step\n- This document contains all atomic features that need to be described in flow format\n- The system will create a flow document that is readable by non-technical stakeholders\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Atomic Document output. The flow document should be readable by non-technical stakeholders."
        },
        "atomic-document": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomization** output from the previous step\n- This contains all atomic features that need to be formatted into the final atomic document\n- The system will format and validate the atomic features into the final rich atomic document\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Atomization output. This step formats and validates the atomic features."
        },
        "architecture-document": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Atomic Document** output from the atomization step\n- Optionally paste the **Flow Document** for context\n- The architecture should implement all features described in the atomic document\n- The system will create a platform-agnostic architecture document focusing on structure, not implementation details\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Atomic Document output. The architecture document should be platform-agnostic and focus on structure."
        },
        "pseudocode-document": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Architecture Document** output\n- Paste the **Atomic Document** output\n- The pseudocode should implement all features described in the atomic document using the architecture defined\n- The system will create pseudocode that is detailed enough for implementation but remains platform-agnostic\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy both the Architecture and Atomic Document outputs. Pseudocode should be detailed but platform-agnostic."
        },
        "detailed-pseudocode": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Pseudocode Document** output from the previous step\n- This step will expand it with detailed API specifications, error handling, platform integration, and production concerns\n- The system will create production-ready pseudocode with complete implementation details\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Pseudocode Document output. Use this step when you need production-ready pseudocode."
        },
        "implementation-specification": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Architecture Document** output\n- Paste the **Pseudocode Document** output\n- Paste the **Atomic Document** output\n- If **Detailed Pseudocode** was created, paste it as well\n- This step will create a unified, complete specification\n- The system will ensure nothing is missing for implementation\n\n**Tip**: This is the final consolidation step. Paste all relevant documents. Use \"Paste from Previous\" button to include all outputs."
        },
        "validation-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **output from the previous workflow step** that you want to validate\n- This should be the complete output from Idea Capture, Documentation Review, User Interrogation, Iterative Refinement, or Atomization step\n- The validation loop will assess completeness and identify gaps\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the previous step's output."
        },
        "refinement-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste **complex elements** from Iterative Refinement or Atomization steps that need further refinement\n- This includes complex descriptions, composite features, or elements that are too complex\n- The system will identify complex elements and apply atomization process if needed\n\n**Tip**: Use this step when refinement or atomization produces elements that are still too complex."
        },
        "post-implementation-validation": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Implementation Specification** output from the previous step\n- The system will validate the complete implementation specification for completeness and accuracy\n- This is an optional final validation step after implementation specification is created\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Implementation Specification output. This is an optional validation step."
        }
    },
    
    // Case 6: Poiesis
    "6": {
        "theoria": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- **Fresh input for this step**: Enter NEW design, idea, or concept you want to analyze\n- **Note**: All previously established cAtoms, ccompounds, and cElements from previous steps are available in conversation history\n- **Empty input**: Begin with pure contemplation and let theoria emerge\n\n**Tip**: Theoria is not opinion, doctrine, nor tool — it is **sighting**, **posture**, **frame**. It is a **pre-linguistic orientation** toward structure, which informs all that follows but never enforces.\n\n**CRITICAL**: The LLM will consider BOTH:\n1. Previously established cAtoms, ccompounds, and cElements from conversation history\n2. Fresh input you provide in this field\n\n**CRITICAL**: Your task is to **IDENTIFY and ARTICULATE** the pre-conceptual frame that **already underlies** the input, not to create a new theoria. The theoria is already present in the input—you must reveal it, not invent it."
        },
        "praxis": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- **Fresh input for this step**: Enter NEW method, process, approach, or questions you want to analyze\n- **Note**: All previously established cAtoms, ccompounds, and cElements from previous steps (Theoria, Doctrine, etc.) are available in conversation history\n- **Empty input**: Begin with pure inquiry and let method emerge\n\n**Tip**: Praxis has two modes: **Generation Mode** (systematized pattern execution) and **Inquisition Mode** (problem setting, doubt, interrogation).\n\n**CRITICAL**: The LLM will consider BOTH:\n1. Previously established cAtoms, ccompounds, and cElements from conversation history\n2. Fresh input you provide in this field\n\n**CRITICAL**: Your task is to **IDENTIFY and ARTICULATE** the praxis (method, process, operation) that **already exists** in the input, not to create a new praxis. The praxis is already present in the input—you must reveal it, not invent it."
        },
        "doctrine": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- **Your principles, rules, or structures**: Enter the principles, rules, standards, or structures you want to analyze\n- **Portions from previous steps**: Reference Theoria (to formalize orientation), Praxis (to encode method), or Poiesis (to structure expression)\n- **Mixed input**: Combine your own principles with fragments from previous steps\n- **Empty input**: Begin with pure structure and let doctrine emerge\n\n**Tip**: Doctrine enforces **ontological boundaries** and **prescriptive structure**. It is semi-stable and adapts only through external contradiction or internal strain.\n\n**CRITICAL**: Your task is to **IDENTIFY and ARTICULATE** the doctrine (principles, rules, structures) that **already exists** in the input, not to create a new doctrine. The doctrine is already present in the input—you must reveal it, not invent it."
        },
        "poiesis": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- **Your creative expression or output**: Enter the creative expression, output, or generative structure you want to analyze\n- **Portions from previous steps**: Reference Theoria (to understand generative capacity), Praxis (to channel through method), or Doctrine (to work within or against constraints)\n- **Mixed input**: Combine your own creative expressions with fragments from previous steps\n- **Empty input**: Begin with pure generative pressure and let expression emerge\n\n**Tip**: Poiesis is not directed but pressure-driven. It is felt and expressed, not calculated. Poiesis is the **output mode** of poietic blooming.\n\n**CRITICAL**: Your task is to **IDENTIFY and ARTICULATE** the poiesis (creative expression, generative structure) that **already exists** in the input, not to create a new poiesis. The poiesis is already present in the input—you must reveal it, not invent it."
        },
        "validation-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **output from the previous workflow step** that you want to validate\n- This should be the complete output from Theoria, Praxis, Doctrine, or Poiesis step\n- The validation loop will assess completeness and identify gaps\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the previous step's output. This is an optional validation step in Case 6."
        }
    },
    
    // Case 7: Physis
    "7": {
        "physis": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- **Poiesis output**: Enter the output from a Poiesis step to materialize it into an implementable form\n- **Creative expressions**: Enter creative expressions, generative structures, or emergent forms that need to be made concrete\n- **Portions from previous steps**: Reference Theoria (for conceptual grounding), Praxis (for method), Doctrine (for constraints), or Poiesis (for creative expression)\n- **Mixed input**: Combine poiesis output with additional requirements or constraints\n- **Empty input**: Begin with pure materialization pressure and let the implementable form emerge\n\n**Tip**: Physis is the materialization of poiesis. It takes the creative expression and makes it concrete, implementable, and usable as a blueprint for creation. Physis is the **implementation mode** of creative expression.\n\n**CRITICAL**: Your task is to **TRANSFORM** the poiesis (creative expression) into physis (implementable form). Extract the creative expression from the input and materialize it into a concrete, implementable specification that can be used to create an application or system."
        },
        "validation-loop": {
            "modifiers": [],
            "guidance": "**What to enter in the Input field:**\n\n- Paste the **Physis** output from the previous step\n- The validation loop will assess completeness and identify gaps in the materialized specification\n\n**Tip**: Use \"Paste from Previous\" button to automatically copy the Physis output. This is an optional validation step in Case 7."
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputGuidanceData;
}

