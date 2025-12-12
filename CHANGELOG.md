# Changelog  

All notable changes to the **Gobo Eiffel VS Code Extension** will be documented
here.  

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
