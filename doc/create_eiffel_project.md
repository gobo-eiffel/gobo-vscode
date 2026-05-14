# Create Eiffel Project

When starting from an empty workspace folder, you can ask the
Gobo Eiffel extension to create a simple Eiffel project for you.

This is a convenient way to get started quickly with a minimal
project structure, including:

* A simple *Hello World* Eiffel class
* A matching ECF file ready for compilation

The generated ECF file is automatically selected as the
[*workspace ECF file*](workspace_ecf_file.md), enabling code navigation,
completion, analysis, and compilation features immediately.

To create a new Eiffel project:

1. Open the *Command Palette* with `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS).

2. Type `Gobo Eiffel` and select **Gobo Eiffel: Create Eiffel Project...**

3. Enter a project name (for example `hello_world`) and press
   `Enter`.

4. If this is your first time using the extension, VS Code will
   guide you through
   [installing Gobo Eiffel](select_gobo_eiffel_installation.html).

![Create Eiffel Project](../images/create_eiffel_project.gif)

The extension generates a ready-to-run Eiffel project that you can
immediately edit, customize, [compile and run](hello_world.md).
