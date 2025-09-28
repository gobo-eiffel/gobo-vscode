# Compile And Run from the *Debug Console* panel

It is possible to compile and run an Eiffel system from the *Debug And Run* panel. When you click on `create a launch.json file`, this file will be initially populated with several *Launch Configurations* which can be used unmodified, or which can be adapted for more advanced usages.

![Create a launch.json file](../images/create_launch_file.png)

> ⚠️ **Note:** Breakpoints are not yet supported when running an Eiffel system.

## Compile & Run Current Eiffel File

```json
{
	"name": "Compile & Run Current Eiffel File",
	"type": "eiffel",
	"request": "launch",
	"compilationOptions": [],
	"buildDir": "",
	"args": [],
	"workingDir": "",
	"environmentVariables": {}
}
```

When running this launch configuration, the Eiffel class in the currently selected *Editor* panel will be compiled in the *Output* panel, and then executed in the *Debug Console* panel.

![Compile & Run Current Eiffel File](../images/compile_and_run_in_debugger.gif)

### Compilation Options

Compilation options can be specified using `compilationOptions`. For example:

```json
"compilationOptions": ["--finalize"]
```

can be used to compile an optimized executable, ready for release. The
complete list of compilation options can be found in the *Gobo Eiffel Compiler* documentation [here](https://www.gobosoft.com/eiffel/gobo/tool/gec/doc/usage.html).

### Build Directory

By default, the compiled executable file as well as intermediary file will be generated in the folder containing the Eiffel file. The executable file will be named after the Eiffel class, e.g. `hello_world.exe` on Windows and `hello_world` on Linux and MacOS if the name of the Eiffel class is `HELLO_WORLD`. Intermediate files will be found in a subfolder `.gobo`. These compilation artifacts can generated in another folder of your choice by telling the *Gobo Eiffel Compiler* to run in this folder:

```json
"buildDir": "path/to/my/build/folder"
```

Note that this pathname can contain environment variables of the form `$VAR` or `${VAR}`.

### Arguments

When running the compiled executable, it is possible to pass command-line arguments:

```json
"args": ["arg1", "arg2"]
```

### Working Directory

By default the compiled executable will be launched in the folder containing the Eiffel file. Specify a different folder as follows:

```json
"workingDir": "path/to/my/working/folder"
```

Note that this pathname can contain environment variables of the form `$VAR` or `${VAR}`.

### Environment Variables

Environment variables needed to compile the Eiffel system and/or to run it can be specified with `environmentVariables`:

```json
"environmentVariables": {
	"VAR1": "value1",
	"VAR2": "value2"
}
```

## Compile Current Eiffel File

```json
{
	"name": "Compile Current Eiffel File",
	"type": "eiffel",
	"request": "launch",
	"compilationOptions": [],
	"buildDir": "",
	"environmentVariables": {},
	"compileOnly": true
}
```

When running this launch configuration, the Eiffel class in the currently selected *Editor* panel will be compiled in the *Output* panel, but the compiled executable will not be executed.

`compileOnly` indicates that the compiled executable will not be executed.

The other configuration entries have already been explained above.

## Run Current Eiffel File

```json
{
	"name": "Run Current Eiffel File",
	"type": "eiffel",
	"request": "launch",
	"buildDir": "",
	"args": [],
	"workingDir": "",
	"environmentVariables": {},
	"runOnly": true
}
```

When running this launch configuration, the executable file previously compiled (if there is one) for the Eiffel class in the currently selected *Editor* panel will be executed in the *Debug Console* panel.

`runOnly` indicates that no compilation will be performed.

The other configuration entries have already been explained above. Note that even though there is no compilation, `buildDir` is necessary to locate the executable file.

## Compile & Run With Current ECF File

```json
{
	"name": "Compile & Run With Current ECF File",
	"type": "eiffel",
	"request": "launch",
	"compilationOptions": [],
	"buildDir": "",
	"args": [],
	"workingDir": "",
	"environmentVariables": {}
}
```

When running this launch configuration, the ECF file in the currently selected *Editor* panel will used to compile the Eiffel system it describes in the *Output* panel, and then executed in the *Debug Console* panel.

In order to know more about ECF files, please read the *Gobo Eiffel* documentation [here](https://www.gobosoft.com/eiffel/gobo/library/tools/doc/ecf.html).

### ECF Target

When the ECF file has several targets, the last one will be used by default to compile the Eiffel system. Choose another target with:

```json
"ecfTarget": "my_target"
```

### Compilation Options

Compilation options can be specified using `compilationOptions`. For example:

```json
"compilationOptions": ["--finalize"]
```

can be used to compile an optimized executable, ready for release. The
complete list of compilation options can be found in the *Gobo Eiffel Compiler* documentation [here](https://www.gobosoft.com/eiffel/gobo/tool/gec/doc/usage.html).

### Build Directory

By default, the compiled executable file as well as intermediary file will be generated in the folder containing the ECF file. The name of the executable file is inferred from the ECF description. Intermediate files will be found in a subfolder `.gobo`. These compilation artifacts can generated in another folder of your choice by telling the *Gobo Eiffel Compiler* to run in this folder:

```json
"buildDir": "path/to/my/build/folder"
```

Note that this pathname can contain environment variables of the form `$VAR` or `${VAR}`.

### Arguments

When running the compiled executable, it is possible to pass command-line arguments:

```json
"args": ["arg1", "arg2"]
```

### Working Directory

By default the compiled executable will be launched in the folder containing the Eiffel file. Specify a different folder as follows:

```json
"workingDir": "path/to/my/working/folder"
```

Note that this pathname can contain environment variables of the form `$VAR` or `${VAR}`.

### Environment Variables

Environment variables needed to compile the Eiffel system and/or to run it can be specified with `environmentVariables`:

```json
"environmentVariables": {
	"VAR1": "value1",
	"VAR2": "value2"
}
```

## Compile With Current ECF File

```json
{
	"name": "Compile With Current ECF File",
	"type": "eiffel",
	"request": "launch",
	"ecfTarget": "",
	"compilationOptions": [],
	"buildDir": "",
	"environmentVariables": {},
	"compileOnly": true
}
```

When running this launch configuration, the ECF file in the currently selected *Editor* panel will used to compile the Eiffel system it describes in the *Output* panel, but the compiled executable will not be executed.

`compileOnly` indicates that the compiled executable will not be executed.

The other configuration entries have already been explained above.

## Run With Current ECF File

```json
{
	"name": "Run With Current ECF File",
	"type": "eiffel",
	"request": "launch",
	"ecfTarget": "",
	"buildDir": "",
	"args": [],
	"workingDir": "",
	"environmentVariables": {},
	"runOnly": true
}
```

When running this launch configuration, the executable file previously compiled (if there is one) with the ECF file in the currently selected *Editor* panel will be executed in the *Debug Console* panel.

`runOnly` indicates that no compilation will be performed.

The other configuration entries have already been explained above. Note that even though there is no compilation, `ecfTarget` and `buildDir` are necessary to locate the executable file.

## Compile & Run Eiffel System

```json
{
	"name": "Compile & Run Eiffel System",
	"type": "eiffel",
	"request": "launch",
	"ecfFile": "${GOBO}/library/common/example/hello_world/system.ecf",
	"ecfTarget": "hello_world",
	"compilationOptions": [],
	"buildDir": "",
	"args": [],
	"workingDir": "",
	"environmentVariables": {}
}
```

Running this launch configuration is similar to *Compile & Run With ECF File* above, except that the ECF file is explicitly specified with `ecfFile` instead of using the file in the currently selected *Editor* panel. This is just a template to compile and run the *Hello World* example included in the *Gobo Eiffel* installation. Replace `ecfFile` and `ecfTarget` with your own values.

Note that this pathname for `ecfFile` can contain environment variables of the form `$VAR` or `${VAR}`.

If you need to compile several Eiffel systems, or need several compilation modes or several sets of arguments, you can add more such *Launch Configurations* by clicking on the *Add Configuration* button and selecting *Gobo Eiffel: Compile & Run Eiffel System*.

![Add Launch Configuration](../images/add_launch_configuration.gif)

## Compile Eiffel System

```json
{
	"name": "Compile Eiffel System",
	"type": "eiffel",
	"request": "launch",
	"ecfFile": "${GOBO}/library/common/example/hello_world/system.ecf",
	"ecfTarget": "hello_world",
	"compilationOptions": [],
	"buildDir": "",
	"environmentVariables": {},
	"compileOnly": true
}
```

Running this launch configuration is similar to *Compile With ECF File* above, except that the ECF file is explicitly specified with `ecfFile` instead of using the file in the currently selected *Editor* panel. This is just a template to compile the *Hello World* example included in the *Gobo Eiffel* installation. Replace `ecfFile` and `ecfTarget` with your own values.

Note that this pathname for `ecfFile` can contain environment variables of the form `$VAR` or `${VAR}`.

If you need to compile several Eiffel systems, or need several compilation modes, you can add more such *Launch Configurations* by clicking on the *Add Configuration* button and selecting *Gobo Eiffel: Compile Eiffel System*.

## Run Eiffel System

```json
{
	"name": "Run Eiffel System",
	"type": "eiffel",
	"request": "launch",
	"ecfFile": "${GOBO}/library/common/example/hello_world/system.ecf",
	"ecfTarget": "hello_world",
	"buildDir": "",
	"args": [],
	"workingDir": "",
	"environmentVariables": {},
	"runOnly": true
}
```

Running this launch configuration is similar to *Run With ECF File* above, except that the ECF file is explicitly specified with `ecfFile` instead of using the file in the currently selected *Editor* panel. This is just a template to run the *Hello World* example included in the *Gobo Eiffel* installation. Replace `ecfFile` and `ecfTarget` with your own values.

Note that this pathname for `ecfFile` can contain environment variables of the form `$VAR` or `${VAR}`.

If you need to compile several Eiffel systems, or need several sets of arguments, you can add more such *Launch Configurations* by clicking on the *Add Configuration* button and selecting *Gobo Eiffel: Run Eiffel System*.
