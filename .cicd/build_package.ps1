<#
.SYNOPSIS
	Build Gobo Eiffel VS Code extension package.

.DESCRIPTION
	Build Gobo Eiffel VS Code extension package.

.EXAMPLE
	# Build Gobo Eiffel VS Code extension package:
	build_package.ps1

.NOTES
	Copyright: "Copyright (c) 2026, Eric Bezault and others"
	License: "MIT License"
#>

$ErrorActionPreference = "Stop"

& "$PSScriptRoot/set_package_version.ps1" package.json
if ($LastExitCode -ne 0) {
	Write-Error "Command 'set_package_version.ps1 package.json' exited with code $LastExitCode"
	exit $LastExitCode
}
& "$PSScriptRoot/set_package_version.ps1" package-lock.json
if ($LastExitCode -ne 0) {
	Write-Error "Command 'set_package_version.ps1 package-lock.json' exited with code $LastExitCode"
	exit $LastExitCode
}

npm install -g vsce
if ($LastExitCode -ne 0) {
	Write-Error "Command 'npm install -g vsce' exited with code $LastExitCode"
	exit $LastExitCode
}

vsce package
if ($LastExitCode -ne 0) {
	Write-Error "Command 'vsce package' exited with code $LastExitCode"
	exit $LastExitCode
}
