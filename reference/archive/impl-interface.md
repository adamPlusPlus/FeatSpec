# Integration Interface Definition

**Purpose**: Define clear integration interfaces for the feature.

**Input**: Validated implementation specification from Implementation Spec Validation
**Output**: Complete integration interface specification
**Cross-Reference**: Uses Implementation Spec Validation output. Output feeds into Final Document Assembly

**Prompt:**

```
Define integration interfaces for the following feature implementation.

Implementation Specification:
[OUTPUT_FROM_SECTION_8_VALIDATED]

Reference Documents:
- Dependencies: feature-spec-reference.md (Part 3: Dependency Mapping)
- Quality Metrics: feature-spec-reference.md (Part 4: Quality Metrics & Validation)

**Note**: Extract and formalize interfaces that are mentioned in the implementation specification. This step creates a focused interface document that supersedes the interface sections scattered throughout the implementation spec. The implementation spec's interface sections can be removed from the final document in favor of this consolidated interface definition.

Interface Definition Requirements:

1. **Required Interface** (What the application must provide)
   For each required interface:
   - Function signature (pseudocode)
   - Input parameters
   - Return values
   - Behavior contract
   - Example implementation (pseudocode)

2. **Provided Interface** (What the feature provides)
   For each provided interface:
   - Function signature (pseudocode)
   - Input parameters
   - Return values
   - Behavior contract
   - Usage examples (pseudocode)

3. **Interface Contracts**
   - Preconditions (what must be true before calling)
   - Postconditions (what is guaranteed after calling)
   - Error conditions (what can go wrong)
   - Side effects (what else happens)

4. **Integration Pattern**
   - How to integrate (Adapter pattern, etc.)
   - Integration steps
   - Initialization sequence
   - Cleanup sequence

5. **Example Integration**
   - Pseudocode example of integration
   - Shows how app implements required interface
   - Shows how app uses provided interface

Output Format:
```markdown
## Integration Interface

### Required Interface (App Must Provide)

#### Interface: [Interface Name]
- **Purpose**: [What it does]
- **Signature**: `function interfaceName(params): ReturnType`
- **Parameters**: [parameter descriptions]
- **Returns**: [return value description]
- **Contract**:
  - Preconditions: [what must be true]
  - Postconditions: [what is guaranteed]
  - Error Conditions: [what can fail]
- **Example Implementation**:
  ```pseudocode
  function interfaceName(params) {
      // Implementation
  }
  ```

### Provided Interface (Feature Provides)

#### Interface: [Interface Name]
- **Purpose**: [What it does]
- **Signature**: `function interfaceName(params): ReturnType`
- **Parameters**: [parameter descriptions]
- **Returns**: [return value description]
- **Contract**: [behavior contract]
- **Usage Example**:
  ```pseudocode
  // How to use this interface
  result = featureInterfaceName(params)
  ```

### Integration Pattern
[How to integrate]

### Example Integration
[Complete integration example]
```

Quality Checklist:
- ✓ Required interface minimal (only what's needed)
- ✓ Provided interface complete (all functionality exposed)
- ✓ Contracts clearly specified
- ✓ Examples provided
- ✓ Integration pattern clear
```

**Output Format:**
```markdown
## Integration Interface

### Required Interface
[What app must provide]

### Provided Interface
[What feature provides]

### Integration Pattern
[How to integrate]

### Example Integration
[Complete example]
```

**Quality Criteria:**
- Minimal required interface
- Complete provided interface
- Clear contracts
- Integration examples

**Cross-Reference**: Output feeds into Final Document Assembly (Final Document Assembly)

---