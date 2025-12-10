# Pseudocode Document Generation

**Purpose**: Create pseudocode for the architecture that includes implementation of all features in the atomic document.

**Input**: Architecture document and atomic document (both from previous steps)
**Output**: Complete pseudocode document with all feature implementations
**Case**: {CASE}
**Modifiers Applied**: {MODIFIERS}

**Cross-Reference**: 
- Previous: Architecture Document, Atomic Document
- Next: (Final output)
- Process Steps: Validation Loop (after completion)

---

## Input Guidance

**What to enter in the Input field:**

- Paste the **Architecture Document** output
- Paste the **Atomic Document** output
- The pseudocode should implement all features described in the atomic document using the architecture defined

**Tip**: Pseudocode should be detailed enough for implementation but remain platform-agnostic.

---

## File Watching Instructions

**For Automation Mode:**

- **Target Directory**: `{AUTOMATION_DIR}/pseudocode-document-output`
- **Files to Watch**: `pseudocode-document-draft.md`
- **Complete Files**: `pseudocode-document-complete.md`
- **Wait Time**: 2000ms
- **Stability Time**: 10000ms
- **File Count**: 1

---

## Prompt

{INJECT_MODIFIER_CONTENT_HERE}

**Pseudocode Document Creation Tasks**:

1. **Review Architecture and Atomic Features**
   - Understand architecture structure
   - Review all atomic features to implement
   - Map features to architectural components
   - Identify implementation requirements

2. **Write Component Pseudocode**
   For each component in architecture:
   - Define data structures with complete types
   - Implement component interfaces with full method signatures
   - Write algorithms for component operations
   - Handle error cases with error codes
   - Implement feature logic
   - Document preconditions and postconditions

3. **Implement Feature Logic**
   For each atomic feature:
   - Write pseudocode implementing the feature
   - Show component interactions
   - Implement user interactions
   - Handle edge cases and errors
   - Show data flow
   - Include error handling contracts

4. **Document API Specifications**
   - Complete method signatures with parameter types and return types
   - Document all public interfaces
   - Specify error handling contracts
   - Define preconditions and postconditions
   - Document side effects

5. **Document Platform Abstraction** (if applicable)
   - Abstract platform operations (do NOT use specific APIs like Win32, COM, POSIX)
   - Use generic system operations (e.g., "file system operation", "system notification", not "Windows registry")
   - Document integration points in platform-agnostic terms
   - Note: Pseudocode should remain platform-agnostic; platform-specific details belong in actual implementation

6. **Document Implementation Details**
   - Threading and concurrency model
   - Memory management approach
   - Data serialization formats
   - Performance requirements and constraints

7. **Document Production Concerns**
   - Error codes and recovery strategies
   - Security considerations
   - Build and deployment configuration
   - Testing strategy

8. **Organize Implementation**
   - Organize by component
   - Show feature implementations
   - Include algorithm descriptions
   - Document data structures
   - Note all implementation details

**Pseudocode Guidelines**:
- Use clear, readable syntax
- **Platform-agnostic**: NO platform-specific APIs, libraries, or system calls
- **Language-agnostic**: NO language-specific syntax or features
- Use abstract operations (e.g., "file system operation" not "Windows API call")
- Include comments explaining logic
- Show control flow clearly
- Document data structures
- Include error handling
- Focus on algorithms and logic, not implementation details

**Output Format**:

```markdown
## Pseudocode Document

### Data Structures
```
[Platform-agnostic data structure definitions with complete types]

Structure ComponentName:
    field1: Type
    field2: Type
    ...
```

### API Specifications

#### Component: [Component Name]

**Public Interface**:
```
function methodName(param1: Type1, param2: Type2): ReturnType
    Preconditions:
        - [Condition 1]
        - [Condition 2]
    Postconditions:
        - [Result 1]
        - [Result 2]
    Side Effects:
        - [Side effect 1]
    Error Handling:
        - ErrorCode1: [When it occurs, how to handle]
        - ErrorCode2: [When it occurs, how to handle]
    Returns:
        - Success: [Return value]
        - Error: [Error code and description]
```

### Component Implementations

#### Component: [Component Name]

**Data Structures**:
```
[Internal data structures]
```

**Method Implementations**:
```
function methodName(param1: Type1, param2: Type2): ReturnType
    // Precondition checks
    if not precondition1:
        return Error(ErrorCode1, "Description")
    
    // Implementation
    [Detailed pseudocode]
    
    // Postcondition verification
    assert postcondition1
    
    return result
```

### Feature Implementations

#### Feature: [Feature Name] (from Atomic Document)
**Component**: [Component that implements it]

**Implementation**:
```
[Detailed pseudocode showing how this feature is implemented]
[Include component interactions]
[Show data flow]
[Handle edge cases]
[Include error handling]
```

**Error Handling**:
- ErrorCode1: [When it occurs, recovery strategy]
- ErrorCode2: [When it occurs, recovery strategy]

### Platform Abstraction

#### Abstract System Operations
```
[Platform-agnostic system operations]
[Generic file system operations]
[Abstract notification mechanisms]
[Generic system integration points]

Note: All operations should be described in abstract terms.
Do NOT reference specific platforms (Windows, macOS, Linux, etc.)
or specific APIs (Win32, Cocoa, POSIX, etc.).
```

**Example of Platform-Agnostic Pseudocode**:
```
// GOOD - Platform-agnostic
function saveToFileSystem(data: DataType, path: String): ErrorCode
    fileHandle = openFile(path, WRITE_MODE)
    if fileHandle == null:
        return ErrorCode.FILE_OPEN_FAILED
    writeData(fileHandle, data)
    closeFile(fileHandle)
    return ErrorCode.SUCCESS

// BAD - Platform-specific (DO NOT USE)
function saveToWindowsRegistry(data: DataType, key: String): ErrorCode
    result = RegSetValueEx(hKey, ...)  // Windows-specific API
    ...
```

### Implementation Details

#### Concurrency Model
```
[Abstract concurrency model]
[Generic synchronization patterns]
[Thread safety guarantees (described abstractly)]
[Concurrency control mechanisms]

Note: Describe concurrency in abstract terms (e.g., "worker threads", 
"mutex", "semaphore") without assuming specific threading libraries.
```

#### Resource Management
```
[Abstract resource allocation patterns]
[Resource lifecycle management]
[Resource cleanup patterns]
[Resource safety guarantees]

Note: Describe memory and resource management abstractly,
without assuming specific memory models (garbage collection, manual, etc.).
```

#### Data Serialization
```
[Serialization formats]
[Serialization methods]
[Deserialization methods]
[Version compatibility]
```

### Performance Requirements

- [Performance requirement 1]
- [Performance requirement 2]
- [Constraints and limitations]

### Production Concerns

#### Error Codes and Recovery
```
ErrorCode Enum:
    SUCCESS = 0
    ERROR_CODE_1 = 1  // Description
    ERROR_CODE_2 = 2  // Description
    ...

Recovery Strategies:
    - ErrorCode1: [Recovery approach]
    - ErrorCode2: [Recovery approach]
```

#### Security Considerations
- [Security requirement 1]
- [Security requirement 2]
- [Security patterns used]

#### Build and Deployment
- [Build configuration]
- [Deployment requirements]
- [Dependencies]

#### Testing Strategy
- [Unit testing approach]
- [Integration testing approach]
- [Test coverage requirements]

### Algorithms
[Detailed algorithm descriptions with pseudocode, including complexity analysis]

### Error Handling Patterns
[Comprehensive error handling patterns and implementations]
```

---

## Quality Criteria

- All atomic features implemented in pseudocode
- Architecture fully realized in pseudocode
- Component interfaces implemented
- Error handling included
- Ready for actual code implementation

