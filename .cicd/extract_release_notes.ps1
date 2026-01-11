<#
.SYNOPSIS
	Extract release notes from CHANGELOG file.

.DESCRIPTION
	Extract release notes from CHANGELOG file.

.PARAMETER Version
	Release Version number.

.PARAMETER InputFilePath
	File containing the Changelogs.

.PARAMETER OutputFilePath
	File where to write the release notes.

.EXAMPLE
	# Extract release notes from file CHANGELOG.md for version 1.2.3:
	extract_release_notes.ps1 1.2.3 CHANGELOG.md release_notes.md

.NOTES
	Copyright: "Copyright (c) 2026 Eric Bezault and others"
	License: "MIT License"
#>

param
(
	[Parameter(Mandatory=$true)]
	[string] $Version,
	[Parameter(Mandatory=$true)]
	[string] $InputFilePath,
	[Parameter(Mandatory=$true)]
	[string] $OutputFilePath
)

$ErrorActionPreference = "Stop"

$startPattern = "^## \[$Version\]"
$nextHeaderPattern = "^## \["

$lines = Get-Content $InputFilePath

$capture = $false
$output = @()

foreach ($line in $lines) {
	if ($line -match $startPattern) {
		$capture = $true
		continue
	}

	if ($capture -and $line -match $nextHeaderPattern) {
		break
	}

	if ($capture) {
		$output += $line
	}
}

if ($output.Count -eq 0) {
	Write-Error "ERROR: No changelog entry found for version $Version"
	exit 1
}

# Trim trailing blank lines
while ($output.Count -gt 0 -and $output[-1] -match '^\s*$') {
	$output = $output[0..($output.Count - 2)]
}

# Remove trailing '---' (Markdown horizontal rule)
if ($output[-1] -match '^\s*---\s*$') {
	$output = $output[0..($output.Count - 2)]
}

# Trim trailing blank lines
while ($output.Count -gt 0 -and $output[-1] -match '^\s*$') {
	$output = $output[0..($output.Count - 2)]
}

# Trim leading blank lines
while ($output.Count -gt 0 -and $output[0] -match '^\s*$') {
	$output = $output[1..($output.Count - 1)]
}

if ($output.Count -eq 0) {
	Write-Error "ERROR: Changelog entry for version $Version is empty after cleanup"
	exit 1
}

$output | Set-Content -Path $OutputFilePath -Encoding utf8
