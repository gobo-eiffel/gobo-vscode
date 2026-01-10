# Compile And Run in the *Terminal* panel

You can easily **compile and run Eiffel systems** using commands available
in the *Command Palette* and contextual menus. The commands are:

* [Compile & Run With Workspace ECF File](#compile--run-with-workspace-ecf-file)
* [Compile With Workspace ECF File](#compile-with-workspace-ecf-file)
* [Run With ECF Workspace File](#run-with-workspace-ecf-file)
* [Lint With ECF Workspace File](#run-with-workspace-ecf-file)
* [Compile & Run With Current ECF File](#compile--run-with-current-ecf-file)
* [Compile With Current ECF File](#compile-with-current-ecf-file)
* [Run With ECF Current File](#run-with-current-ecf-file)
* [Lint With ECF Current File](#run-with-current-ecf-file)
* [Compile & Run Eiffel File](#compile--run-eiffel-file)
* [Compile Eiffel File](#compile-eiffel-file)
* [Run Eiffel File](#run-eiffel-file)
* [Lint Eiffel File](#lint-eiffel-file)

They are prefixed with ***Gobo Eiffel:*** in the *Command Palette*. So you
can open the *Command Palette* with `Ctrl+Shift+P` (or `Cmd+Shift+P` on
MacOS) and type `Gobo Eiffel` to see available commands.

The same commands are also available from the right-click contextual menus
for Eiffel files (`.e`) or ECF files (`.ecf`) in both the *Editor* and
*Explorer* panels.

 Compilation output appears in the *Output* panel, whereas the compiled
 executable runs in the *Terminal* panel.

To run the compiled executable in the *Debug Console* panel, use the
[launch configurations](compile_and_run_in_debug_console.md) available
in the *Debug And Run* panel.

## Compile & Run With Workspace ECF File

This command compiles the Eiffel system described by the
[workspace ECF file](workspace_ecf_file.md)
and runs it in the *Terminal* panel.

This command is configurable using the values (compilation options, arguments,
etc.) specified in the configuration
[*Compile & Run With Workspace ECF File*](compile_and_run_in_debug_console.md#compile--run-with-workspace-ecf-file)
f found in the `launch.json` file.

## Compile With Workspace ECF File

This command compiles the Eiffel system described by the **worspace ECF file**,
but **does not execute** the compiled executable.

This command is configurable using the values (compilation options, arguments,
etc.) specified in the configuration
[*Compile With Workspace ECF File*](compile_and_run_in_debug_console.md#compile-with-workspace-ecf-file)
if found in the `launch.json` file.

## Run With Workspace ECF File

This command **runs an already-compiled executable** for the Eiffel system
described by the workspace ECF file, in the *Terminal* panel.

This command is configurable using the values (compilation options, arguments,
etc.) specified in the configuration
[*Run With Workspace ECF File*](compile_and_run_in_debug_console.md#run-with-workspace-ecf-file)
if found in the `launch.json` file.

## Lint With Workspace ECF File

This command runs
[*Gobo Eiffel Lint*](https://www.gobosoft.com/eiffel/gobo/tool/gelint/doc/index.html)
on the Eiffel system described by the workspace ECF file. Output appears in the *Output* panel.

This command is configurable using the values (compilation options, etc.)
specified in the configuration
[*Compile With Workspace ECF File*](compile_and_run_in_debug_console.md#compile-with-workspace-ecf-file)
if found in the `launch.json` file.

## Compile & Run With Current ECF File

This command compiles the Eiffel system described by the **ECF file currently
open** in the *Editor* (or currently selected in the *Explorer* panel) and
runs it in the *Terminal* panel.

Learn more about ECF files in the
[Gobo Eiffel documentation](https://www.gobosoft.com/eiffel/gobo/library/tools/doc/ecf.html).

This command is configurable using the values (compilation options, arguments,
etc.) specified in the configuration
[*Compile & Run With Current ECF File*](compile_and_run_in_debug_console.md#compile--run-with-current-ecf-file)
f found in the `launch.json` file.

## Compile With Current ECF File

This command compiles the Eiffel system described by the **ECF file currently
open** in the *Editor* (or currently selected in the *Explorer* panel), but
**does not execute** the compiled executable.

This command is configurable using the values (compilation options, arguments,
etc.) specified in the configuration
[*Compile With Current ECF File*](compile_and_run_in_debug_console.md#compile-with-current-ecf-file)
if found in the `launch.json` file.

## Run With Current ECF File

This command **runs an already-compiled executable** for the Eiffel system
described by the ECF file currently open in the *Editor* (or currently
selected in the *Explorer* panel), in the *Terminal* panel.

This command is configurable using the values (compilation options, arguments,
etc.) specified in the configuration
[*Run With Current ECF File*](compile_and_run_in_debug_console.md#run-with-current-ecf-file)
if found in the `launch.json` file.

## Lint With Current ECF File

This command runs
[*Gobo Eiffel Lint*](https://www.gobosoft.com/eiffel/gobo/tool/gelint/doc/index.html)
on the Eiffel system described by the ECF file currently open in the *Editor*
(or currently selected in the *Explorer* panel). Output appears in the *Output* panel.

This command is configurable using the values (compilation options, etc.)
specified in the configuration
[*Compile With Current ECF File*](compile_and_run_in_debug_console.md#compile-with-current-ecf-file)
if found in the `launch.json` file.

## Compile & Run Eiffel File

This command compiles the Eiffel class currently open in the *Editor* (or
currently selected in the *Explorer* panel) and runs it in the *Terminal*
panel.

![Compile & Run Eiffel File](../images/compile_and_run_in_terminal.gif)

This command is configurable using the values (compilation options, arguments,
etc.) specified in the configuration
[*Compile & Run Current Eiffel File*](compile_and_run_in_debug_console.md#compile--run-current-eiffel-file)
if found in the `launch.json` file.

## Compile Eiffel File

This command compiles the Eiffel class currently open in the *Editor* (or
currently selected in the *Explorer* panel) but **does not execute** the
compiled executable.

This command is configurable using the values (compilation options, etc.)
specified in the configuration
[*Compile Current Eiffel File*](compile_and_run_in_debug_console.md#compile-current-eiffel-file)
if found in the `launch.json` file.

## Run Eiffel File

This command  **runs an already-compiled executable** for the Eiffel class
currently open in the *Editor* (or currently selected in the *Explorer* panel),
in the *Terminal* panel.

This command is configurable using the values (arguments, etc.) specified in
the configuration
[*Run Current Eiffel File*](compile_and_run_in_debug_console.md#run-current-eiffel-file)
if found in the `launch.json` file.

## Lint Eiffel File

This command runs
[*Gobo Eiffel Lint*](https://www.gobosoft.com/eiffel/gobo/tool/gelint/doc/index.html)
on the Eiffel class currently open in the *Editor* (or currently selected in
the *Explorer* panel) and on Eiffel classes it depends on. Output appears in
the *Output* panel.

This command is configurable using the values (compilation options, etc.)
specified in the configuration
[*Compile Current Eiffel File*](compile_and_run_in_debug_console.md#compile-current-eiffel-file)
if found in the `launch.json` file.
