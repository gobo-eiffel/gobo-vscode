<#
.SYNOPSIS
	Build Gobo Eiffel VS Code extension package.

.DESCRIPTION
	Build Gobo Eiffel VS Code extension package.

.EXAMPLE
	# Build Gobo Eiffel VS Code extension nightly build package:
	build_package.ps1

.EXAMPLE
	# Build Gobo Eiffel VS Code extension release package:
	build_package.ps1 1.2.3

.NOTES
	Copyright: "Copyright (c) 2026, Eric Bezault and others"
	License: "MIT License"
#>

param
(
	[Parameter(Mandatory=$false)]
	[string] $Version
)

$ErrorActionPreference = "Stop"

& "$PSScriptRoot/set_package_version.ps1" package.json $Version
if ($LastExitCode -ne 0) {
	Write-Error "Command 'set_package_version.ps1 package.json $Version' exited with code $LastExitCode"
	exit $LastExitCode
}
& "$PSScriptRoot/set_package_version.ps1" package-lock.json $Version
if ($LastExitCode -ne 0) {
	Write-Error "Command 'set_package_version.ps1 package-lock.json $Version' exited with code $LastExitCode"
	exit $LastExitCode
}

# Install dependencies.
npm ci
if ($LastExitCode -ne 0) {
	Write-Error "Command 'npm ci' exited with code $LastExitCode"
	exit $LastExitCode
}

# Package extension.
npx vsce package
if ($LastExitCode -ne 0) {
	Write-Error "Command 'npx vsce package' exited with code $LastExitCode"
	exit $LastExitCode
}
