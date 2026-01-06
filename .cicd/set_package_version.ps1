<#
.SYNOPSIS
	Set the version of VS Code extension.

.DESCRIPTION
	Set the version of VS Code extension.

.PARAMETER FilePath
	File containing the version number to be updated.

.PARAMETER Version
	Version number to be used.

.EXAMPLE
	# Set the version of VS Code extension corresponding to the current commit:
	set_package_version.ps1 package.json

.EXAMPLE
	# Set the version of VS Code extension to a release version:
	set_package_version.ps1 package.json "1.2.3"

.NOTES
	Copyright: "Copyright (c) 2026 Eric Bezault and others"
	License: "MIT License"
#>

param
(
	[Parameter(Mandatory=$true)]
	[string] $FilePath,
	[Parameter(Mandatory=$false)]
	[string] $Version
)

$ErrorActionPreference = "Stop"

if ($Version) {
	$GOBO_VERSION = $Version
} else {
	$GOBO_DATE = git show -s --date=iso --format=%cd
	if ($LastExitCode -ne 0) {
		Write-Error "Command 'git show -s --date=iso --format=%cd' exited with code $LastExitCode"
		exit $LastExitCode
	}
	$GOBO_DATE = [datetime]$GOBO_DATE
	$GOBO_DATE = $GOBO_DATE.ToUniversalTime().ToString("yyyyMMdd")
	$GOBO_SHA1 = git rev-parse --short HEAD
	if ($LastExitCode -ne 0) {
		Write-Error "Command 'git rev-parse --short HEAD' exited with code $LastExitCode"
		exit $LastExitCode
	}
	$GOBO_VERSION = "0.0.0-$GOBO_DATE+$GOBO_SHA1"
}
$GOBO_VERSION = '$1' + """$GOBO_VERSION"""
$GOBO_PATTERN = "(\""name\"": \""gobo-eiffel\"",\r?\n\t*\""version\"": )\""[0-9]+(\.[0-9]+){2}(\-[0-9a-zA-Z]+)?(\+[0-9a-zA-Z]+)?\"""

(Get-Content -Raw "$FilePath") | Foreach-Object { $_ -replace "$GOBO_PATTERN", $GOBO_VERSION } | Set-Content -NoNewLine "$FilePath"
