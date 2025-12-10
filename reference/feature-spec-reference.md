# Feature Specification System - Complete Reference

This document consolidates all reference materials needed for the feature specification pipeline. It combines terminology, taxonomy, dependency mapping, quality metrics, and validation rules into a single, organized, non-redundant reference.

---

## Table of Contents

1. [Terminology](#part-1-terminology)
2. [Feature Taxonomy](#part-2-feature-taxonomy)
3. [Dependency Mapping](#part-3-dependency-mapping)
4. [Quality Metrics & Validation](#part-4-quality-metrics--validation)

---

## Part 1: Terminology

This section defines the controlled vocabulary used throughout the feature specification system. All feature documentation must use these terms consistently to ensure platform-agnostic, modular specifications.

### Usage Guidelines

1. **Always use terminology from this key** - Never use platform-specific terms (touch, click, swipe, tap, etc.)
2. **Use qualifiers when parameters matter** - Use syntax: `term[parameter:value, parameter:value]`
3. **Consistent across all documents** - Terminology must be identical in UX and Implementation specs
4. **Reference this document** - All prompt templates should reference this terminology key

---

### Interaction Terms

#### Primary Actions

- **action1**: Primary activation input
  - Platform mappings: touch on touchscreen, left-click on mouse, primary button press on gamepad
  - Usage: `action1` for any primary activation
  - Example: "User presses action1 to select element"
  - ❌ Incorrect: "User touches element" or "User clicks element"
  - ✅ Correct: "User presses action1 on element"

- **action2**: Secondary activation input
  - Platform mappings: right-click on mouse, secondary button on gamepad, long-press on touchscreen (context-dependent)
  - Usage: `action2` for secondary actions
  - Example: "Pressing action2 opens context menu"
  - ❌ Incorrect: "Right-click opens menu"
  - ✅ Correct: "action2 opens context menu"

- **action3**: Cancel/back input
  - Platform mappings: Escape key, back button, cancel gesture
  - Usage: `action3` for cancel or back actions
  - Example: "Pressing action3 exits edit mode"
  - ❌ Incorrect: "Escape key exits"
  - ✅ Correct: "action3 exits edit mode"

#### Input Actions

- **press**: Initiation of primary input
  - Definition: Moment when action1 begins (touch down, mouse down, button press)
  - Usage: `press` for the start of an interaction
  - Example: "On press, element enters selected state"
  - Parameters: `press[position:x,y]` when position matters

- **release**: Termination of primary input
  - Definition: Moment when action1 ends (finger lift, mouse button release, button release)
  - Usage: `release` for the end of an interaction
  - Example: "On release, element drops at current position"
  - Parameters: `release[position:x,y]` when position matters

- **hold**: Sustained primary input for extended duration
  - Definition: Maintaining action1 continuously beyond threshold
  - Usage: `hold` for extended press actions
  - Example: "Hold for 500ms activates edit mode"
  - Parameters: `hold[duration:500ms, stability_threshold:10px]`
  - Threshold: Default 500ms, configurable

- **drag**: Movement while maintaining primary input
  - Definition: Moving pointer while action1 is active
  - Usage: `drag` for movement during press
  - Example: "During drag, element follows pointer position"
  - Parameters: `drag[start_position:x,y, current_position:x,y, velocity:vx,vy]`

- **tap**: Brief primary input
  - Definition: Quick press and release without significant movement
  - Usage: `tap` for quick interactions
  - Example: "Tap on element activates it"
  - Parameters: `tap[duration:<200ms, movement:<5px]`

- **long-press**: Extended hold duration
  - Definition: Hold that exceeds typical threshold (typically 0.5-1.0 seconds)
  - Usage: `long-press` for extended hold actions
  - Example: "Long-press on icon enters edit mode"
  - Parameters: `long-press[duration:>500ms]`

#### Pointer

- **pointer**: Input position indicator
  - Definition: Current position of input device (finger on touchscreen, mouse cursor, pointer position)
  - Usage: `pointer` for position tracking
  - Example: "Element follows pointer position during drag"
  - Parameters: `pointer[position:x,y, velocity:vx,vy]`

---

### State Terms

#### Basic States

- **active_state**: Feature is engaged and responsive
  - Definition: Feature is currently operational and accepting input
  - Usage: "Feature enters active_state when activated"
  - Transitions: From inactive_state via activation

- **inactive_state**: Feature is disengaged
  - Definition: Feature is not operational, not accepting input
  - Usage: "Feature returns to inactive_state when deactivated"
  - Transitions: From active_state via deactivation

- **transition**: Movement between states
  - Definition: Process of changing from one state to another
  - Usage: "Transition from inactive_state to active_state takes 300ms"
  - Parameters: `transition[from:state1, to:state2, duration:300ms]`

#### Persistent States

- **persistent_state**: State that survives mode changes
  - Definition: State information that is maintained across mode transitions
  - Usage: "Layout positions are stored in persistent_state"
  - Example: "Edit mode changes are saved to persistent_state"

- **temporary_state**: State that is discarded on exit
  - Definition: State information that is only valid during current session
  - Usage: "Drag preview uses temporary_state"
  - Example: "Selection highlight is temporary_state"

#### State Qualifiers

- **selected_state**: Element is currently selected
  - Definition: Element is chosen but not yet acted upon
  - Usage: "Element enters selected_state on press"

- **dragging_state**: Element is currently being dragged
  - Definition: Element is following pointer during drag
  - Usage: "Element enters dragging_state when drag begins"

- **hover_state**: Pointer is over element without activation
  - Definition: Pointer positioned over element, action1 not pressed
  - Usage: "Element enters hover_state when pointer enters bounds"
  - Note: May not apply to touch-only interfaces

---

### Visual Terms

#### Transformations

- **opacity**: Visual transparency
  - Definition: Level of transparency from 0.0 (fully transparent) to 1.0 (fully opaque)
  - Usage: `opacity[value:0.75]` for semi-transparent elements
  - Example: "Dragged element uses opacity[value:0.75]"
  - Range: 0.0 to 1.0

- **scale**: Size transformation
  - Definition: Size multiplier relative to original (1.0 = original size)
  - Usage: `scale[value:1.1]` for 110% size
  - Example: "Selected element scales to scale[value:1.1]"
  - Common values: 0.9 (90%), 1.0 (100%), 1.1 (110%)

- **position**: Spatial location
  - Definition: X and Y coordinates in screen space
  - Usage: `position[x:100, y:200]` for specific coordinates
  - Example: "Element moves to position[x:150, y:300]"

- **rotation**: Angular transformation
  - Definition: Rotation angle in degrees
  - Usage: `rotation[angle:15deg]` for rotation
  - Example: "Wiggle animation uses rotation[angle:±3deg]"
  - Range: -180deg to 180deg

#### Visual Properties

- **elevation**: Visual depth
  - Definition: Perceived depth through shadows, z-index, or 3D transforms
  - Usage: `elevation[level:2]` for depth level
  - Example: "Selected element has elevation[level:3]"
  - Levels: 0 (flat) to 5 (maximum depth)

- **color**: Visual color
  - Definition: Color value (avoid platform-specific color names)
  - Usage: `color[hex:#007AFF]` or `color[rgb:0,122,255]`
  - Example: "Accent color is color[hex:#007AFF]"
  - Avoid: "blue", "red" (use hex/rgb values)

- **border**: Edge definition
  - Definition: Visual boundary around element
  - Usage: `border[width:2px, color:hex:#CCCCCC]`
  - Example: "Edit mode adds border[width:1px, color:hex:#007AFF]"

- **shadow**: Depth shadow
  - Definition: Shadow effect for depth perception
  - Usage: `shadow[offset:2px, blur:4px, color:hex:#000000, opacity:0.3]`
  - Example: "Elevated element has shadow[offset:0, blur:8px, opacity:0.2]"

---

### Timing Terms

#### Duration

- **duration**: Length of time for an action or animation
  - Definition: Time span in milliseconds (ms) or seconds (s)
  - Usage: `duration[value:300ms]` for 300 milliseconds
  - Example: "Animation completes in duration[value:300ms]"
  - Common ranges: 100-200ms (quick), 200-400ms (standard), 400-600ms (complex)

- **threshold**: Boundary value that triggers action
  - Definition: Value that when crossed triggers a state change
  - Usage: `threshold[hold_duration:500ms]` for hold activation
  - Example: "Hold threshold is threshold[hold_duration:500ms]"

- **delay**: Time before action begins
  - Definition: Wait time before starting an action
  - Usage: `delay[value:100ms]` for 100ms delay
  - Example: "Animation starts after delay[value:100ms]"

- **interval**: Time between repeated actions
  - Definition: Time gap between recurring events
  - Usage: `interval[value:16ms]` for 60fps updates
  - Example: "Animation updates at interval[value:16ms]"

#### Timing Relationships

- **simultaneous**: Actions occurring at the same time
  - Definition: Multiple actions starting together
  - Usage: "All icons enter edit mode simultaneous"

- **sequential**: Actions occurring one after another
  - Definition: Actions following in order
  - Usage: "Icons reorganize sequential with 50ms stagger"

- **stagger**: Offset between sequential actions
  - Definition: Time delay between similar actions
  - Usage: `stagger[value:50ms]` for 50ms offset
  - Example: "Icons animate with stagger[value:50ms]"

---

### Feedback Terms

#### Haptic Feedback

- **haptic_feedback**: Tactile response
  - Definition: Vibration or force feedback
  - Usage: `haptic_feedback[type:light_tap, duration:50ms]`
  - Types: light_tap, medium_tap, heavy_tap, pattern
  - Duration: 50-200ms typically
  - Example: "Hold threshold reached triggers haptic_feedback[type:medium_tap]"

- **haptic_types**:
  - **light_tap**: Brief, subtle vibration (50-100ms)
  - **medium_tap**: Moderate vibration (100-150ms)
  - **heavy_tap**: Strong vibration (150-200ms)
  - **pattern**: Sequential vibrations creating rhythm

#### Audio Feedback

- **audio_feedback**: Sound response
  - Definition: Audio cue for user action
  - Usage: `audio_feedback[type:click, volume:0.3]`
  - Types: click, success, error, warning
  - Volume: 0.0 to 1.0

#### Visual Feedback

- **visual_feedback**: Visual response to action
  - Definition: Visual change indicating action occurred
  - Usage: "Press triggers visual_feedback[type:highlight]"
  - Types: highlight, glow, pulse, scale, color_change

- **feedback_types**:
  - **highlight**: Background or border highlight
  - **glow**: Luminous border effect
  - **pulse**: Rhythmic size or opacity change
  - **scale**: Size transformation
  - **color_change**: Color modification

---

### Error Terms

#### Error States

- **error_state**: Invalid condition
  - Definition: State indicating an error has occurred
  - Usage: "Invalid action enters error_state"
  - Recovery: Requires user action or automatic fallback

- **invalid_action**: Action that cannot be performed
  - Definition: User attempted action that is not allowed
  - Usage: "Dragging to invalid zone triggers invalid_action"
  - Response: Visual feedback and optional error message

#### Recovery

- **recovery**: Return to valid state
  - Definition: Process of returning from error to normal operation
  - Usage: "System performs automatic recovery from error_state"
  - Types: automatic, user_required

- **fallback**: Alternative action when primary fails
  - Definition: Backup behavior when preferred action cannot execute
  - Usage: "If drop fails, fallback returns element to origin"

- **validation**: Check for valid conditions
  - Definition: Verification that action can be performed
  - Usage: "System performs validation before executing action"
  - Result: pass or fail

---

### Animation Terms

#### Animation Types

- **animation**: Visual motion over time
  - Definition: Change in visual properties over duration
  - Usage: `animation[type:scale, duration:300ms, easing:ease_out]`
  - Types: scale, move, fade, rotate, combination

- **easing**: Animation acceleration curve
  - Definition: How animation accelerates/decelerates
  - Usage: `easing[type:ease_out]` or `easing[cubic_bezier:0.0,0.0,0.58,1.0]`
  - Types: linear, ease_in, ease_out, ease_in_out, cubic_bezier
  - Example: "Scale animation uses easing[type:ease_out]"

#### Animation Properties

- **keyframe**: Specific point in animation timeline
  - Definition: Moment where property has specific value
  - Usage: "Keyframe at 0%: scale[value:1.0], keyframe at 100%: scale[value:1.1]"

- **interpolation**: Calculation between keyframes
  - Definition: Smooth transition between keyframe values
  - Usage: "System interpolates between keyframes using easing function"

---

### Layout Terms

#### Grid

- **grid_position**: Position in layout grid
  - Definition: Row and column coordinates in grid system
  - Usage: `grid_position[row:2, column:3]`
  - Example: "Element moves to grid_position[row:1, column:2]"

- **grid_cell**: Individual grid unit
  - Definition: Single position in grid layout
  - Usage: "Element occupies one grid_cell"

- **grid_layout**: Overall grid structure
  - Definition: Complete grid system with rows and columns
  - Usage: "grid_layout[rows:6, columns:4]"

#### Positioning

- **snap**: Alignment to grid position
  - Definition: Automatic alignment to nearest grid position
  - Usage: "Element snaps to grid_position when within threshold"
  - Parameters: `snap[threshold:25px, force:0.1]`

- **displacement**: Movement to accommodate other element
  - Definition: Element moving out of way for another element
  - Usage: "Icons perform displacement to make room"

---

### Qualifier Syntax

#### Parameter Format

Use bracket notation for parameterized terms:

```
term[parameter1:value1, parameter2:value2]
```

#### Examples

- `hold[duration:500ms, stability_threshold:10px]`
- `drag[start_position:100,200, current_position:150,250, velocity:50,50]`
- `opacity[value:0.75]`
- `scale[value:1.1]`
- `position[x:100, y:200]`
- `haptic_feedback[type:medium_tap, duration:100ms]`
- `animation[type:scale, duration:300ms, easing:ease_out]`
- `snap[threshold:25px, force:0.1]`

#### Unit Standards

- **Time**: milliseconds (ms) or seconds (s)
- **Distance**: pixels (px) or relative units
- **Angles**: degrees (deg)
- **Opacity**: 0.0 to 1.0 (no unit)
- **Scale**: multiplier (no unit, 1.0 = 100%)
- **Colors**: hex (#RRGGBB) or rgb(r,g,b)

---

### Platform-Specific Terms to Avoid

**Never use these terms** - Use generic alternatives instead:

| ❌ Avoid | ✅ Use Instead |
|----------|----------------|
| touch, tap, swipe | action1, press, drag |
| click, right-click | action1, action2 |
| mouse cursor | pointer |
| finger | pointer |
| iOS, Android, Web | (platform-agnostic descriptions) |
| React, Vue, Angular | (generic component descriptions) |
| CSS, JavaScript | (pseudocode descriptions) |
| DOM, View | (generic element descriptions) |

---

### Terminology Examples

#### Correct Usage

✅ "User presses action1 on element, triggering hold detection. After threshold[hold_duration:500ms], feature enters active_state. During drag, element follows pointer with opacity[value:0.75]. On release, element snaps to grid_position with haptic_feedback[type:medium_tap]."

✅ "Animation uses scale[value:1.1] over duration[value:300ms] with easing[type:ease_out]. Simultaneous haptic_feedback[type:light_tap] confirms action."

#### Incorrect Usage

❌ "User touches icon, triggering long-press. After 500ms, iOS-style edit mode activates. During drag, icon follows finger with 75% opacity. On release, icon snaps to grid with vibration."

❌ "CSS animation scales to 110% over 300ms with ease-out. Haptic feedback confirms."

---

## Part 2: Feature Taxonomy

This section defines the hierarchical taxonomy for categorizing and organizing features in the specification system. Features are classified by category, type, and atomicity to enable composition and reuse.

---

### Feature Categories

Features are organized into top-level categories:

#### UI (User Interface)
Features related to visual presentation and user interface elements.

**Subcategories:**
- Layout: Grid systems, positioning, responsive design
- Visual: Animations, transitions, visual feedback
- Components: Buttons, inputs, modals, overlays
- Navigation: Menus, tabs, routing, breadcrumbs

#### Interaction
Features related to user input and interaction patterns.

**Subcategories:**
- Gestures: Hold, drag, swipe, pinch
- Selection: Single, multiple, range selection
- Editing: Text editing, content editing, mode switching
- Input: Forms, validation, autocomplete

#### Data
Features related to data management and processing.

**Subcategories:**
- Storage: Local storage, caching, persistence
- Retrieval: Fetching, loading, synchronization
- Transformation: Filtering, sorting, aggregation
- Validation: Data validation, sanitization

#### System
Features related to system-level operations and integration.

**Subcategories:**
- State: State management, application state
- Events: Event systems, messaging, notifications
- Performance: Optimization, lazy loading, caching
- Security: Authentication, authorization, encryption

---

### Feature Types

Within each category, features are further classified by type:

#### Atomic Features
Features that cannot be meaningfully decomposed further.

**Criteria:**
- Represents a single, complete interaction
- Has clear input and output
- Can be described in one UX flow
- Implements one specific behavior

**Examples:**
- `ui-interaction-hold-detection-001`: Detects hold gesture
- `interaction-gesture-drag-init-001`: Initiates drag operation
- `visual-feedback-haptic-light-tap-001`: Light haptic feedback

#### Composite Features
Features composed of multiple atomic features.

**Criteria:**
- Combines two or more atomic features
- Features work together to achieve a goal
- Can be decomposed into atomic features
- Has clear composition boundaries

**Examples:**
- `ui-interaction-hold-to-edit-001`: Combines hold detection, edit mode activation, drag-and-drop
- `interaction-selection-multi-select-001`: Combines selection, range selection, group operations

#### Meta Features
Features that modify or enhance other features.

**Criteria:**
- Doesn't provide functionality alone
- Adds capabilities to existing features
- Can be applied to multiple feature types
- Optional enhancement

**Examples:**
- `system-performance-animation-optimization-001`: Optimizes animations across features
- `ui-visual-accessibility-high-contrast-001`: Adds high contrast mode to visual features

---

### Feature ID Format

Features are identified using a structured ID format:

```
[category]-[type]-[name]-[version]
```

#### Components

- **category**: One of: `ui`, `interaction`, `data`, `system`
- **type**: Feature type within category (kebab-case): `hold-detection`, `drag-init`, `edit-mode`
- **name**: Descriptive feature name (kebab-case): `hold-to-edit`, `multi-select`
- **version**: Three-digit version number: `001`, `002`, `003`

#### Examples

```
ui-interaction-hold-to-edit-001
interaction-gesture-drag-init-001
visual-feedback-haptic-light-tap-001
system-state-edit-mode-manager-001
data-storage-layout-persistence-001
```

#### Versioning

- **001**: Initial version
- **002+**: Updates or variations
  - Different implementation approach
  - Additional capabilities
  - Platform-specific variations (use suffix: `-web`, `-ios`, `-android`)

---

### Atomicity Definitions

#### What Makes a Feature Atomic

A feature is atomic if it meets ALL of these criteria:

1. **Single Responsibility**: Implements one specific behavior or function
2. **Complete Interaction**: Represents a complete user interaction cycle
3. **Clear Boundaries**: Has well-defined inputs and outputs
4. **Independent**: Can be understood and tested in isolation
5. **Non-Decomposable**: Cannot be meaningfully broken into smaller features

#### Atomic Feature Examples

✅ **Atomic:**
- Hold detection (detects hold gesture, outputs hold event)
- Drag initiation (starts drag, outputs drag state)
- Grid snap (snaps element to grid, outputs snapped position)

❌ **Not Atomic:**
- "Home screen editing" (too broad, contains multiple interactions)
- "App management" (multiple features combined)
- "User interface" (entire category, not a feature)

#### Decomposition Guidelines

When decomposing a feature:

1. **Identify user actions**: What can the user do?
2. **Identify system responses**: What happens in response?
3. **Separate concerns**: Each concern becomes a potential atomic feature
4. **Test atomicity**: Can it be further decomposed? If yes, continue.
5. **Verify completeness**: Does the atomic feature represent a complete interaction?

---

### Composition Rules

#### How Features Can Be Combined

Features can be composed when they meet these compatibility criteria:

##### 1. Sequential Composition
Features that occur in sequence can be combined.

**Rules:**
- Output of Feature A is valid input for Feature B
- Features don't conflict in their state management
- Timing is compatible (no race conditions)

**Example:**
- `hold-detection` → `edit-mode-activation` → `drag-and-drop`
- Sequential: Each feature's output feeds into the next

##### 2. Parallel Composition
Features that operate independently can run in parallel.

**Rules:**
- Features don't share state (or share state safely)
- No conflicting inputs or outputs
- No resource conflicts

**Example:**
- `haptic-feedback` + `visual-feedback` + `audio-feedback`
- Parallel: All can occur simultaneously

##### 3. Enhancement Composition
Meta-features that enhance other features.

**Rules:**
- Meta-feature doesn't change core behavior
- Enhancement is optional (feature works without it)
- No breaking changes to interfaces

**Example:**
- `animation-optimization` enhances `drag-and-drop`
- Enhancement: Adds performance optimization without changing behavior

##### 4. Conditional Composition
Features that can be combined based on conditions.

**Rules:**
- Clear conditions for when features combine
- Conditional logic is explicit
- Fallback behavior defined

**Example:**
- `folder-creation` (if two icons dragged together) OR `icon-reposition` (if single icon dragged)
- Conditional: Behavior depends on context

#### Composition Compatibility Matrix

| Composition Type | Requires | Allows | Conflicts With |
|------------------|----------|--------|----------------|
| Sequential | Output compatibility | State transitions | Conflicting state changes |
| Parallel | Independent operation | Simultaneous execution | Shared state modification |
| Enhancement | Optional behavior | Meta-features | Breaking changes |
| Conditional | Clear conditions | Context-dependent | Ambiguous conditions |

---

## Part 3: Dependency Mapping

This section defines how to identify, document, and manage dependencies between features in the specification system. Dependency mapping ensures features can be properly composed, integrated, and validated.

---

### Dependency Types

#### Prerequisite (Required)

A feature that must exist and be functional for another feature to work.

**Characteristics:**
- Feature A cannot function without Feature B
- Feature B must be implemented before Feature A
- Feature B must be active/running for Feature A to work
- Removing Feature B breaks Feature A

**Notation:**
```
FeatureA → FeatureB (prerequisite)
```

**Example:**
```
edit-mode-visual-state → edit-mode-state-manager (prerequisite)
```
Edit mode visual state requires the state manager to track and update state.

**Documentation Format:**
```yaml
dependency:
  target: edit-mode-visual-state
  requires: edit-mode-state-manager
  type: prerequisite
  reason: "Visual state depends on state manager for state updates"
  impact: "Cannot display edit mode without state manager"
```

---

#### Optional (Enhancement)

A feature that enhances another feature but is not required.

**Characteristics:**
- Feature A works without Feature B
- Feature B improves Feature A if present
- Feature A has fallback behavior without Feature B
- Removing Feature B doesn't break Feature A

**Notation:**
```
FeatureA → FeatureB (optional)
```

**Example:**
```
drag-and-drop → haptic-feedback (optional)
```
Drag and drop works without haptic feedback, but haptics improve the experience.

**Documentation Format:**
```yaml
dependency:
  target: drag-and-drop
  uses: haptic-feedback
  type: optional
  reason: "Haptic feedback enhances drag experience"
  fallback: "Drag works without haptics, just no tactile feedback"
```

---

#### Conflicting (Incompatible)

Features that cannot coexist or operate simultaneously.

**Characteristics:**
- Feature A and Feature B cannot both be active
- Features have incompatible requirements
- Must choose one or the other
- Activating one disables the other

**Notation:**
```
FeatureA ✗ FeatureB (conflicting)
```

**Example:**
```
single-select-mode ✗ multi-select-mode (conflicting)
```
Cannot have both single and multi-select modes active at the same time.

**Documentation Format:**
```yaml
conflict:
  feature_a: single-select-mode
  feature_b: multi-select-mode
  type: conflicting
  reason: "Both modify selection behavior in incompatible ways"
  resolution: "Use mode switcher to toggle between modes"
```

---

#### Composable (Compatible)

Features that can work together without conflicts.

**Characteristics:**
- Feature A and Feature B can operate simultaneously
- No conflicts or incompatibilities
- Combined behavior is well-defined
- Features enhance each other

**Notation:**
```
FeatureA + FeatureB (composable)
```

**Example:**
```
hold-detection + drag-init (composable)
```
Hold detection can trigger drag initiation, they work together.

**Documentation Format:**
```yaml
composition:
  features: [hold-detection, drag-init]
  type: composable
  relationship: "Hold detection triggers drag initiation"
  behavior: "When hold detected, drag can be initiated"
```

---

### Dependency Notation Format

#### Standard Notation

Use arrow notation for dependencies:

```
Source → Target (dependency_type)
```

**Direction:**
- Source depends on Target
- Source requires Target (for prerequisite)
- Source uses Target (for optional)
- Source conflicts with Target (for conflicting)
- Source composes with Target (for composable)

#### Extended Notation

For more detail, use structured format:

```yaml
dependencies:
  - target: FeatureA
    depends_on: FeatureB
    type: prerequisite
    version: "001"
    interface: "FeatureB must provide: getState(), setState()"
    
  - target: FeatureA
    depends_on: FeatureC
    type: optional
    version: "001"
    interface: "FeatureC provides: playFeedback()"
    fallback: "FeatureA works without FeatureC"
```

---

### Dependency Graph Structure

#### Node Representation

Each feature is a node in the dependency graph:

```
[FeatureID]
  - Name: Feature Name
  - Type: atomic | composite | meta
  - Dependencies: [list of dependencies]
  - Dependents: [features that depend on this]
```

#### Edge Types

Edges represent relationships:

- **Solid Arrow (→)**: Prerequisite dependency
- **Dashed Arrow (⇢)**: Optional dependency
- **Double Line (═)**: Conflicting relationship
- **Bidirectional (↔)**: Composable relationship

#### Graph Example

```
hold-detection
    ↓ (prerequisite)
edit-mode-state-manager
    ↓ (prerequisite)
edit-mode-visual-state
    ↓ (prerequisite)
drag-and-drop
    ⇢ (optional)
haptic-feedback
```

---

### Dependency Analysis Process

#### Step 1: Identify Dependencies

For each feature, identify:

1. **Prerequisites**: What must exist?
2. **Optional Dependencies**: What enhances it?
3. **Conflicts**: What can't coexist?
4. **Compositions**: What works with it?

#### Step 2: Document Dependencies

Document each dependency with:

- **Type**: prerequisite, optional, conflicting, composable
- **Target Feature**: What feature is related
- **Interface**: What interface is required/provided
- **Reason**: Why this dependency exists
- **Impact**: What happens if dependency is missing

#### Step 3: Validate Dependencies

Check for:

- **Circular Dependencies**: A → B → A (prerequisite cycles are invalid)
- **Missing Prerequisites**: Required features not identified
- **Unresolved Conflicts**: Conflicting features both required
- **Interface Mismatches**: Required interfaces don't match

#### Step 4: Create Dependency Map

Generate dependency map showing:

- All dependencies for each feature
- Dependency chains (prerequisite paths)
- Conflict groups
- Composition opportunities

---

### Conflict Resolution Strategies

#### Strategy 1: Mode Switching

One feature at a time, user switches between them.

**Example:**
- Single-select mode OR multi-select mode
- User toggles between modes

**Implementation:**
- Mode manager controls which feature is active
- Only one feature active at a time

#### Strategy 2: Feature Priority

When conflicts occur, one feature takes priority.

**Example:**
- Edit mode takes priority over normal mode
- Normal mode disabled when edit mode active

**Implementation:**
- Priority system determines which feature wins
- Lower priority feature is disabled

#### Strategy 3: Contextual Activation

Features activate based on context, avoiding conflicts.

**Example:**
- Different features for different contexts
- Context determines which features are available

**Implementation:**
- Context manager determines active features
- Features only available in appropriate context

#### Strategy 4: Feature Merging

Combine conflicting features into unified feature.

**Example:**
- Merge single-select and multi-select into unified selection
- One feature handles both cases

**Implementation:**
- Create new composite feature
- Handles both use cases

---

### Dependency Validation Rules

#### Rule 1: No Circular Prerequisites

Prerequisite chains cannot form cycles.

❌ **Invalid:**
```
A → B (prerequisite)
B → C (prerequisite)
C → A (prerequisite)  // Circular!
```

✅ **Valid:**
```
A → B (prerequisite)
B → C (prerequisite)
C → D (prerequisite)  // Linear chain
```

#### Rule 2: Prerequisites Must Exist

All prerequisite features must be identified and documented.

❌ **Invalid:**
```
Feature A requires Feature X (but Feature X not documented)
```

✅ **Valid:**
```
Feature A → Feature B (prerequisite)
Feature B is documented and defined
```

#### Rule 3: Conflicts Must Be Resolved

Conflicting features cannot both be required.

❌ **Invalid:**
```
Feature A requires Feature X
Feature A requires Feature Y
Feature X ✗ Feature Y (conflicting)
```

✅ **Valid:**
```
Feature A uses Feature X OR Feature Y
Feature X ✗ Feature Y (conflicting)
Resolution: Feature A works with either X or Y
```

#### Rule 4: Optional Dependencies Need Fallbacks

Optional dependencies must have documented fallback behavior.

❌ **Invalid:**
```
Feature A → Feature B (optional)
(No fallback behavior documented)
```

✅ **Valid:**
```
Feature A → Feature B (optional)
Fallback: "Feature A works without Feature B, just without enhancement"
```

---

## Part 4: Quality Metrics & Validation

This section provides comprehensive quality checklists and validation rules for ensuring feature specifications meet quality standards. Use these at validation steps (Sections 5 and 8) to ensure specifications meet quality standards.

---

### UX Specification Quality Checklist

#### Terminology Check

**Criteria**: All terminology must come from terminology key (Part 1).

**Verification:**
- [ ] Review document for platform-specific terms
- [ ] Check all interaction terms (action1, action2, etc.)
- [ ] Verify use of terminology key terms
- [ ] Check for qualifier syntax (term[parameter:value])

**Examples:**

✅ **Pass:**
- "User presses action1"
- "Element follows pointer position"
- "Hold threshold is threshold[hold_duration:500ms]"

❌ **Fail:**
- "User touches element" (use "presses action1")
- "Element follows mouse cursor" (use "pointer")
- "iOS-style hold" (remove platform reference)

**How to Fix:**
- Replace platform terms with terminology key equivalents
- Use action1, action2, action3 for inputs
- Use pointer instead of cursor/finger
- Use hold, drag, release instead of touch/click/swipe

---

#### Completeness Check

**Criteria**: All interactions, feedback, timing, and edge cases must be documented.

**Verification:**
- [ ] All user interactions documented
- [ ] All visual feedback specified
- [ ] All haptic feedback specified
- [ ] All audio feedback specified (if applicable)
- [ ] All timing values provided (durations, thresholds, delays)
- [ ] All state changes documented
- [ ] All edge cases covered
- [ ] All error states handled

**Examples:**

✅ **Pass:**
- "Hold detection: threshold[hold_duration:500ms]"
- "Visual feedback: opacity[value:0.75], scale[value:1.1]"
- "Haptic feedback: haptic_feedback[type:medium_tap, duration:100ms]"
- "Edge case: If pointer moves >10px during hold, hold is cancelled"

❌ **Fail:**
- "Hold activates edit mode" (missing duration/threshold)
- "Element scales up" (missing scale value)
- "Haptic feedback occurs" (missing type and duration)

**How to Fix:**
- Add missing timing specifications
- Add missing visual property values
- Add missing feedback specifications
- Document all edge cases

---

#### Timing Specification Check

**Criteria**: Every timing-related aspect must have explicit values.

**Verification:**
- [ ] All animations have duration[value:Xms]
- [ ] All thresholds have threshold[value:Xms]
- [ ] All delays have delay[value:Xms]
- [ ] All intervals have interval[value:Xms]
- [ ] Timing relationships clear (simultaneous, sequential, stagger)

**Examples:**

✅ **Pass:**
- "Animation duration: duration[value:300ms]"
- "Hold threshold: threshold[hold_duration:500ms]"
- "Stagger delay: stagger[value:50ms]"
- "Updates at: interval[value:16ms]"

❌ **Fail:**
- "Animation is quick" (missing duration)
- "Hold for a while" (missing threshold)
- "Icons animate with delay" (missing delay value)

**How to Fix:**
- Add explicit timing values
- Use proper notation (duration[value:Xms])
- Specify timing relationships

---

#### Visual Property Check

**Criteria**: All visual properties must use exact notation with values.

**Verification:**
- [ ] All opacity values: opacity[value:X]
- [ ] All scale values: scale[value:X]
- [ ] All positions: position[x:X, y:Y]
- [ ] All colors: color[hex:#XXXXXX] or color[rgb:X,Y,Z]
- [ ] All animations: animation[type:X, duration:Y, easing:Z]
- [ ] All borders: border[width:X, color:hex:#XXXXXX]
- [ ] All shadows: shadow[offset:X, blur:Y, color:hex:#XXXXXX, opacity:Z]

**Examples:**

✅ **Pass:**
- "Opacity: opacity[value:0.75]"
- "Scale: scale[value:1.1]"
- "Color: color[hex:#007AFF]"
- "Animation: animation[type:scale, duration:300ms, easing:ease_out]"

❌ **Fail:**
- "Semi-transparent" (missing opacity value)
- "Slightly larger" (missing scale value)
- "Blue color" (missing color value)
- "Smooth animation" (missing type, duration, easing)

**How to Fix:**
- Add explicit values for all properties
- Use proper notation format
- Specify all animation parameters

---

#### Edge Case Coverage Check

**Criteria**: All edge cases, boundary conditions, and unusual situations must be documented.

**Verification:**
- [ ] Boundary conditions handled (screen edges, limits)
- [ ] Invalid inputs handled
- [ ] Error recovery documented
- [ ] Interruption scenarios covered
- [ ] Multi-input scenarios handled
- [ ] State conflicts handled

**Examples:**

✅ **Pass:**
- "Edge case: If pointer moves >10px during hold, hold is cancelled"
- "Error: If drop zone invalid, element returns to origin with animation"
- "Interruption: If system interruption occurs, edit mode pauses and resumes"

❌ **Fail:**
- "Edge cases handled" (no specifics)
- "Errors handled gracefully" (no details)
- Missing interruption scenarios

**How to Fix:**
- Document specific edge cases
- Specify error handling behavior
- Cover all interruption scenarios

---

#### Multi-Input Support Check

**Criteria**: Feature must work with different input methods (touch, mouse, gamepad).

**Verification:**
- [ ] Works with action1 (touch/click/primary button)
- [ ] Works with mouse input (if applicable)
- [ ] Works with gamepad input (if applicable)
- [ ] Input method doesn't change behavior
- [ ] No input-method-specific assumptions

**Examples:**

✅ **Pass:**
- "User presses action1 (touch, click, or primary button)"
- "Pointer position (finger, cursor, or pointer)"
- "No input-method-specific behavior"

❌ **Fail:**
- "User touches screen" (touch-specific)
- "Mouse cursor moves" (mouse-specific)
- "Finger drag" (touch-specific)

**How to Fix:**
- Use generic input terms (action1, pointer)
- Remove input-method-specific references
- Ensure behavior is consistent across inputs

---

#### User Perspective Check

**Criteria**: Document must be written from user experience perspective, not technical.

**Verification:**
- [ ] Focuses on what user sees/feels/hears
- [ ] Not focused on technical implementation
- [ ] Describes perception and experience
- [ ] Uses user-centric language

**Examples:**

✅ **Pass:**
- "User sees element scale up smoothly"
- "User feels haptic feedback"
- "User perceives magnetic snap effect"

❌ **Fail:**
- "Component calls setScale(1.1)"
- "System dispatches HAPTIC_FEEDBACK event"
- "Animation controller updates transform"

**How to Fix:**
- Rewrite from user perspective
- Remove technical implementation details
- Focus on user perception

---

### Implementation Specification Quality Checklist

#### Modularity Check

**Criteria**: Components must be independently removable and testable.

**Verification:**
- [ ] Components can be removed independently
- [ ] No hidden dependencies between components
- [ ] Clear component boundaries
- [ ] Components communicate only through interfaces
- [ ] Components can be tested in isolation

**Examples:**

✅ **Pass:**
- "HoldDetector component can be removed without affecting DragHandler"
- "Components communicate through EventSystem interface"
- "Each component can be tested independently"

❌ **Fail:**
- "HoldDetector directly accesses DragHandler internals"
- "Components share global state"
- "Cannot test components separately"

**How to Fix:**
- Define clear interfaces between components
- Remove direct dependencies
- Make components independent

---

#### Platform-Agnostic Check

**Criteria**: Specification must not assume any platform, framework, or language.

**Verification:**
- [ ] No platform-specific APIs (React, Vue, iOS, Android)
- [ ] No language-specific syntax (JavaScript, Swift, Kotlin)
- [ ] Generic data structures (Element, Position, not DOM, View)
- [ ] Pseudocode only (no real code)
- [ ] No framework assumptions

**Examples:**

✅ **Pass:**
- "function handleHold(position: Position): Event"
- "Element data structure with position and state"
- Pseudocode using generic types

❌ **Fail:**
- "function onTouchStart(e: TouchEvent)" (platform-specific)
- "React.useState()" (framework-specific)
- "document.getElementById()" (platform API)

**How to Fix:**
- Replace platform APIs with generic descriptions
- Use pseudocode with generic types
- Remove framework-specific code

---

#### Integration Interface Check

**Criteria**: Interfaces must be minimal, clear, and well-defined.

**Verification:**
- [ ] Required interface clearly defined (what app must provide)
- [ ] Provided interface clearly defined (what feature provides)
- [ ] Interface is minimal (only what's needed)
- [ ] Interface contracts specified (preconditions, postconditions)
- [ ] Integration points clear

**Examples:**

✅ **Pass:**
- "Required: function getElementAtPosition(position): Element"
- "Provided: function startEditMode()"
- "Contract: Precondition: position is valid, Postcondition: element returned"

❌ **Fail:**
- "App must provide UI framework" (too vague)
- "Feature provides everything" (not specific)
- Missing contract specifications

**How to Fix:**
- Define minimal required interface
- Specify complete provided interface
- Add contract specifications

---

#### State Management Check

**Criteria**: State machine must be complete and well-defined.

**Verification:**
- [ ] State machine defined
- [ ] All states identified
- [ ] All transitions defined
- [ ] State persistence specified
- [ ] Error states included

**Examples:**

✅ **Pass:**
- "States: NORMAL, HOLD_DETECTING, EDIT_MODE, DRAGGING"
- "Transitions: NORMAL → HOLD_DETECTING on hold"
- "State persisted to storage on changes"

❌ **Fail:**
- "States managed" (not specified)
- "Transitions handled" (not defined)
- Missing error states

**How to Fix:**
- Define complete state machine
- List all states and transitions
- Include error states

---

#### Event System Check

**Criteria**: Event system must be complete and conflict-free.

**Verification:**
- [ ] Event types defined
- [ ] Event flow documented
- [ ] Event handlers specified
- [ ] Event ordering clear
- [ ] No event conflicts

**Examples:**

✅ **Pass:**
- "Event types: HOLD_DETECTED, EDIT_MODE_ENTERED, DRAG_STARTED"
- "Event flow: HoldDetector → EventSystem → StateManager"
- "Event ordering: HOLD_DETECTED before EDIT_MODE_ENTERED"

❌ **Fail:**
- "Events are used" (not specified)
- "Event system handles events" (not detailed)
- Event conflicts possible

**How to Fix:**
- Define all event types
- Document event flow
- Ensure no conflicts

---

#### Abstraction Level Check

**Criteria**: Specification must be at appropriate abstraction level.

**Verification:**
- [ ] Appropriate abstraction (not too low-level, not too high-level)
- [ ] Conceptual descriptions (not implementation details)
- [ ] Pseudocode where needed (not real code)
- [ ] Focus on structure and relationships

**Examples:**

✅ **Pass:**
- "HoldDetector checks if hold duration exceeds threshold"
- "GridManager calculates nearest grid position"
- Conceptual descriptions with pseudocode

❌ **Fail:**
- "Check if Date.now() - startTime > 500" (too low-level)
- "Feature works" (too high-level)
- Real code instead of pseudocode

**How to Fix:**
- Find appropriate abstraction level
- Use conceptual descriptions
- Use pseudocode for complex logic

---

#### Completeness Check

**Criteria**: All aspects of implementation must be specified.

**Verification:**
- [ ] All components specified
- [ ] All interfaces defined
- [ ] All algorithms described
- [ ] All edge cases handled
- [ ] All error cases handled

**Examples:**

✅ **Pass:**
- All components documented
- All interfaces defined
- All algorithms described
- Edge cases handled
- Error cases handled

❌ **Fail:**
- Missing component specifications
- Undefined interfaces
- Incomplete algorithms
- Missing edge case handling

**How to Fix:**
- Add missing specifications
- Define all interfaces
- Complete all descriptions

---

### Validation Rules

#### Rule 1: Must Use Master Terminology

**Rule**: All terms must come from terminology key (Part 1).

**Violation Examples:**
- ❌ "User touches element"
- ❌ "User clicks button"
- ❌ "Mouse cursor moves"
- ❌ "iOS-style interaction"

**Correct Usage:**
- ✅ "User presses action1 on element"
- ✅ "User presses action1 on button"
- ✅ "Pointer moves"
- ✅ "Platform-agnostic interaction"

**Validation Pattern:**
```
Search for platform-specific terms:
- touch, tap, swipe (use action1, hold, drag)
- click, right-click (use action1, action2)
- mouse cursor, finger (use pointer)
- iOS, Android, Web (remove platform references)
```

---

#### Rule 2: Qualifier Syntax

**Rule**: Parameterized terms must use bracket notation: `term[parameter:value]`

**Violation Examples:**
- ❌ "Hold for 500ms"
- ❌ "Opacity 0.75"
- ❌ "Scale 1.1"

**Correct Usage:**
- ✅ "hold[duration:500ms]"
- ✅ "opacity[value:0.75]"
- ✅ "scale[value:1.1]"

**Validation Pattern:**
```
Check for timing/values without qualifier syntax:
- Duration values without duration[value:Xms]
- Opacity values without opacity[value:X]
- Scale values without scale[value:X]
```

---

#### Rule 3: No Platform-Specific Code

**Rule**: Implementation specifications must not contain platform-specific APIs or frameworks.

**Violation Examples:**
- ❌ `function onTouchStart(e: TouchEvent)`
- ❌ `React.useState()`
- ❌ `document.getElementById()`
- ❌ `UIView.animate()`

**Correct Usage:**
- ✅ `function handlePress(position: Position): Event`
- ✅ Generic state management description
- ✅ `function getElementAtPosition(position): Element`
- ✅ Generic animation description

**Validation Pattern:**
```
Search for platform-specific patterns:
- Framework APIs (React, Vue, Angular)
- Platform APIs (DOM, iOS, Android)
- Language-specific syntax (TypeScript types, Swift syntax)
```

---

#### Rule 4: Atomicity Requirements

**Rule**: Atomic features must meet atomicity criteria.

**Criteria:**
1. Represents single, complete interaction
2. Has clear input and output
3. Can be described in one UX flow
4. Implements one specific behavior

**Violation Examples:**
- ❌ "Home screen editing" (too broad)
- ❌ "User interface" (entire category)
- ❌ Multiple interactions in one feature

**Correct Usage:**
- ✅ "Hold detection" (atomic)
- ✅ "Drag initiation" (atomic)
- ✅ "Grid snapping" (atomic)

**Validation Pattern:**
```
Check feature description:
- Can it be further decomposed?
- Does it represent single interaction?
- Is input/output clear?
```

---

#### Rule 5: No Circular Prerequisites

**Rule**: Prerequisite chains cannot form cycles.

**Violation Examples:**
- ❌ A → B → C → A (circular)
- ❌ Circular prerequisite chains

**Correct Usage:**
- ✅ Linear chains: A → B → C
- ✅ No cycles in prerequisites

**Validation Pattern:**
```
Build dependency graph:
- Check for cycles
- Validate prerequisite chains
- Ensure linear dependencies
```

---

#### Rule 6: Optional Dependencies Need Fallbacks

**Rule**: Optional dependencies must have documented fallback behavior.

**Violation Examples:**
- ❌ Optional dependency without fallback
- ❌ Missing fallback documentation

**Correct Usage:**
- ✅ Optional dependency with fallback
- ✅ Fallback behavior documented

**Validation Pattern:**
```
Check optional dependencies:
- Is fallback documented?
- Does feature work without optional dependency?
```

---

#### Rule 7: Minimal Required Interface

**Rule**: Required interface must be minimal (only what's needed).

**Violation Examples:**
- ❌ Requiring entire framework
- ❌ Requiring unnecessary interfaces
- ❌ Overly broad requirements

**Correct Usage:**
- ✅ Minimal interface
- ✅ Only required functions
- ✅ Clear necessity

**Validation Pattern:**
```
Check required interface:
- Is each function necessary?
- Can interface be reduced?
- Is it truly minimal?
```

---

#### Rule 8: Complete Provided Interface

**Rule**: Provided interface must expose all necessary functionality.

**Violation Examples:**
- ❌ Missing exposed functions
- ❌ Incomplete interface
- ❌ Hidden functionality

**Correct Usage:**
- ✅ All functions exposed
- ✅ Complete interface
- ✅ All functionality accessible

**Validation Pattern:**
```
Check provided interface:
- Are all functions exposed?
- Is interface complete?
- Can users access all functionality?
```

---

#### Rule 9: Interface Contracts

**Rule**: All interfaces must have contracts (preconditions, postconditions).

**Violation Examples:**
- ❌ Interface without contract
- ❌ Missing preconditions
- ❌ Missing postconditions

**Correct Usage:**
- ✅ Complete contract
- ✅ Preconditions specified
- ✅ Postconditions specified

**Validation Pattern:**
```
Check interfaces:
- Do they have contracts?
- Are preconditions specified?
- Are postconditions specified?
```

---

#### Rule 10: Independent Components

**Rule**: Components must be independently removable.

**Violation Examples:**
- ❌ Components with hidden dependencies
- ❌ Cannot remove without breaking
- ❌ Tightly coupled components

**Correct Usage:**
- ✅ Components independent
- ✅ Can remove without breaking
- ✅ Loose coupling

**Validation Pattern:**
```
Check components:
- Can each be removed?
- Are dependencies clear?
- Is coupling loose?
```

---

#### Rule 11: All Timing Must Be Specified

**Rule**: All timing-related aspects must have explicit values.

**Violation Examples:**
- ❌ "Quick animation" (no duration)
- ❌ "After a while" (no threshold)
- ❌ "With delay" (no delay value)

**Correct Usage:**
- ✅ "duration[value:300ms]"
- ✅ "threshold[hold_duration:500ms]"
- ✅ "delay[value:100ms]"

**Validation Pattern:**
```
Check for timing descriptions:
- Missing duration values
- Missing threshold values
- Missing delay values
- Vague timing descriptions
```

---

#### Rule 12: All Visual Properties Must Have Values

**Rule**: All visual properties must use exact notation with values.

**Violation Examples:**
- ❌ "Semi-transparent" (no opacity value)
- ❌ "Slightly larger" (no scale value)
- ❌ "Blue color" (no color value)

**Correct Usage:**
- ✅ "opacity[value:0.75]"
- ✅ "scale[value:1.1]"
- ✅ "color[hex:#007AFF]"

**Validation Pattern:**
```
Check visual properties:
- Opacity values specified?
- Scale values specified?
- Color values specified?
- Using proper notation?
```

---

### Overall Quality Assessment

#### Scoring

For each checklist:
- **PASS**: All items checked
- **NEEDS_REVISION**: Some items need fixes
- **FAIL**: Critical items missing

#### Overall Status

- **PASS**: All checklists pass
- **NEEDS_REVISION**: Some checklists need revision
- **FAIL**: Critical checklists fail

#### Priority Levels

1. **Critical**: Must fix before proceeding
   - Terminology violations
   - Platform assumptions
   - Missing critical components

2. **Important**: Should fix for quality
   - Missing timing specifications
   - Incomplete edge cases
   - Missing interface contracts

3. **Minor**: Nice to have
   - Documentation improvements
   - Additional examples
   - Formatting improvements

---

### Validation Workflow

1. **Review Checklist**: Go through each checklist item
2. **Identify Issues**: Mark items that fail
3. **Categorize Issues**: Critical, Important, Minor
4. **Provide Recommendations**: How to fix each issue
5. **Determine Status**: PASS, NEEDS_REVISION, or FAIL
6. **Create Report**: Document findings and recommendations

---

## Reference

This consolidated reference document is used in:
- All pipeline prompt templates
- UX specification documents
- Implementation specification documents
- Validation steps (Sections 5 and 8)
- Quality assessment

All feature specifications should reference this document for consistent terminology, taxonomy, dependency mapping, and quality standards.

