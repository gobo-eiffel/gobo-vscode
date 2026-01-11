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

Write-Host "G1"
if ($Version) {
	Write-Host "G2"
	$GOBO_VERSION = "$Version"
	Write-Host "G3"
} else {
	Write-Host "G4"
	$GOBO_DATE = git show -s --date=iso --format=%cd
	Write-Host "G5"
	if ($LastExitCode -ne 0) {
		Write-Error "Command 'git show -s --date=iso --format=%cd' exited with code $LastExitCode"
		exit $LastExitCode
	}
	Write-Host "G6"
	$GOBO_DATE = [datetime]$GOBO_DATE
	Write-Host "G7"
	$GOBO_DATE = $GOBO_DATE.ToUniversalTime().ToString("yyyyMMdd")
	Write-Host "G8"
	$GOBO_SHA1 = git rev-parse --short HEAD
	Write-Host "G9"
	if ($LastExitCode -ne 0) {
		Write-Error "Command 'git rev-parse --short HEAD' exited with code $LastExitCode"
		exit $LastExitCode
	}
	Write-Host "G10"
	$GOBO_VERSION = "0.0.0-$GOBO_DATE+$GOBO_SHA1"
	Write-Host "G11"
}
Write-Host "G12"
$GOBO_VERSION = '$1' + """$GOBO_VERSION"""
Write-Host "$GOBO_VERSION"
Write-Host "G13"
$GOBO_PATTERN = "(\""name\"": \""gobo-eiffel\"",\r?\n\t*\""version\"": )\""[0-9]+(\.[0-9]+){2}(\-[0-9a-zA-Z]+)?(\+[0-9a-zA-Z]+)?\"""
Write-Host "G14"

(Get-Content -Raw "$FilePath") | Foreach-Object { $_ -replace "$GOBO_PATTERN", $GOBO_VERSION } | Set-Content -NoNewLine "$FilePath"
Write-Host "G15"
