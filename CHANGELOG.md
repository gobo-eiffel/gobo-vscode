# Changelog  

All notable changes to the **Gobo Eiffel VS Code Extension** will be documented
here.  

---

## [1.4.0] – 22 April 2026

### Added

* 🌍 **Workspace environment variables support**:
  * Environment variables defined at the workspace level are now taken into account.
  * This is especially useful when the workspace ECF file relies on environment variables.

* ⚙️ **Improved workspace onboarding**:
  * When opening a workspace for the first time, you are prompted to select a
    **workspace ECF file** if none is configured.
  * This helps ensure code navigation, analysis, and compilation features are
    available immediately.

* ✨ **Improved Eiffel code awareness in the editor**:
  * Click on a keyword to highlight all related keywords of the enclosing Eiffel construct.
  * Expand/shrink selection to the enclosing Eiffel construct using:
    * `Shift+Alt+RightArrow` to expand
    * `Shift+Alt+LeftArrow` to shrink
  * Selection expansion can be repeated to progressively select larger constructs.

---

## [1.3.0] – 7 March 2026

### Added

* ✨ **Improved code completion for Eiffel**:
  * Completion snippets for common Eiffel structures such as
    `if ... then ... end` and `from ... until ... loop ... end`.

* 🧭 **Extended code navigation support** tailored to Eiffel:
  * **Feature Callers/Callees** to explore features that call or are
    called by a given feature.
  * **Client/Supplier Classes** to explore the client and supplier
    relationships of a given class.
  * **Ancestor/Descendant Classes** to navigate the inheritance
    hierarchy of a class.

### Improved

* ⚙️ **More fault-tolerant analysis and error reporting**:
  * Code navigation and completion remain available even when the
    current file contains syntax or compilation errors.
  * Improved syntax error diagnostics and messages.

---

## [1.2.0] – 11 January 2026

### Added

* ✨ **Code completion for Eiffel**:
  * Auto-completion of class names, feature and variable names while typing.
  * Context-aware suggestions based on scope and static type
    information.

* 🧭 **Extended code navigation support** tailored to Eiffel:
  * **Go to Type Definition** to jump directly to the class defining a symbol’s type.
  * **Go to Implementations** to explore feature precursors and redeclarations across inheritance hierarchies.
  * **Class and feature search** integrated with standard VS Code symbol navigation.

* ⚙️ **Improved workspace ECF handling and documentation**:
  * Dedicated documentation page describing how the workspace ECF file and target
    are used by the Eiffel analyzer.
  * Commands to **select**, **show**, and **set** a workspace ECF file directly
    from contextual menus.
  * New compile, run, and lint commands that explicitly use the **workspace ECF**:
    * **Compile & Run With Workspace ECF File**
    * **Compile With Workspace ECF File**
    * **Run With Workspace ECF File**
    * **Lint With Workspace ECF File**
  * Clearer behavior when no ECF file or target is explicitly specified.

### Improved

* 🧩 **Contextual menu reorganization**:
  * Compile-related commands are now grouped under a **Compile & Run** submenu.
  * ECF-related commands are grouped under a new **Eiffel Configuration** submenu.
  * This makes contextual menus shorter, clearer, and easier to navigate.

* 📖 **Documentation and README improvements**:
  * Reorganized README with a clear separation between feature highlights
    and detailed Eiffel-specific capabilities.
  * New **Code Navigation** section explaining navigation features in context.
  * Better onboarding guidance for both beginners and advanced users,
    including clearer explanations of workspace ECF usage.
  * Cross-linked documentation pages for easier discovery of related
    commands and settings.
  * Improved Markdown formatting for readability and Markdownlint
    compliance.

---

## [1.1.1] – 12 December 2025

### Fixed

* 🔧 **Syntax highlighting restored** for Eiffel files in VS Code ≥ **1.107**.  
  A compatibility issue in recent VS Code versions prevented the extension from
  loading its grammar definition, resulting in missing or incomplete highlighting.
  This update ensures the grammar is correctly recognized again.

---

## [1.1.0] – 3 December 2025

### Added

* 🧭 **Feature navigation** in the *Outline* panel (jump to features and feature clauses).
* 📝 **Feature signatures** displayed on hover (types, signatures, variable information).
* 🔍 **Go to definition** for variables and features.
* 🧪 **Inline error reporting as you type**, with live squiggles in the editor.
* ⚙️ **Workspace-only settings**:
  * `gobo-eiffel.workspaceEcfFile`  
  * `gobo-eiffel.workspaceEcfTarget`  
  These allow selecting the ECF file and target used to analyze Eiffel classes
  in the workspace. Automatic discovery of ECF files in the workspace when no
  explicit choice is provided.

---

## [1.0.0] – 1 October 2025

### Added

* 🎉 Initial public release on the VS Code Marketplace.
* 🖋️ Eiffel syntax highlighting for `.e` files.
* 🚀 “Compile & Run” command from the *Command Palette* and contextual menus.
* 🛑 Inline errors in *Problems* panel.
* 🖥️ Integrated *Gobo Eiffel Terminal* with environment preconfigured.
* ✨ Creation of simple ECF files.
* 🔄 Automatic check for newer *Gobo Eiffel* releases.

---
