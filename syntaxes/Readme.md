# TextMate Cheatsheet

## Notes

* When the token to be matched has the same length, the regexp
to be chosen will be the first one in the list of patterns.
* `(?=...)` means `followed by`.
* N`\s` means whitespace, newline, etc. (hopefully unicode),
and `\S` means `[^\s]`.
* The pattern for `\.` should be listed before the pattern for `\.\.` otherwise `5..5` is recognized as `("5", ".", ".5")` instead of `("5", "..", "5")`.
* Likewise, the pattern for the symbol `@` should be listed before the pattern with the deprecated free operator starting with `@`.

## TextMate categories

### 1. Comments (comment.*)

* comment.line → single-line (-- foo)
* comment.block → multi-line (/* ... */)
* comment.documentation → doc comments (e.g., ///, /** ... */)

#### Coloring

* Always gray or faded. Documentation comments sometimes get italic.

### 2. Strings (string.*)

* string.quoted.single → 'foo'
* string.quoted.double → "foo"
* string.quoted.triple → """foo"""
* string.interpolated → "Hello #{name}"
* string.regexp → /regex/
* string.unquoted → shell-style words without quotes

#### Inside strings

* constant.character.escape → escape sequences (\n, %N, \")
* constant.other.placeholder → format placeholders (%s, {0})

#### Coloring

* Whole string = green (Dark+), red (Light+), or yellow (Monokai).
* Escapes (constant.character.escape) are often bright cyan/blue, distinct from the base string.
* Placeholders often show up as bold or magenta in some themes.

### 3. Constants (constant.*)

* constant.numeric → numbers (42, 3.14)
* constant.character → character literals ('A')
* constant.language → language literals (true, false, Void)
* constant.other → other literal constants

#### Coloring

* Numerics = orange in most themes.
* Characters = same as numbers (orange) unless scoped inside string.*, in which case they may look like strings.
* Escapes (constant.character.escape) often get a distinct cyan highlight.

### 4. Variables (variable.*)

* variable.language → special reserved variables (self, Current, this)
* variable.parameter → parameters in a function
* variable.other.local → locals
* variable.other.member → object members
* variable.other.constant → symbolic constants

#### Coloring

* Typically plain text (white in Dark+). Language vars (this, self) often italic cyan.

### 5. Keywords (keyword.*)

* keyword.control → control flow (if, else, end, loop)
* keyword.operator → operators (+, -, :=)
* keyword.other → everything else reserved (alias, external)

#### Coloring

* Bright blue in Dark+ and most modern themes.

### 6. Storage (storage.*)

* storage.type → type keywords (class, interface)
* storage.modifier → modifiers (public, deferred, frozen)

#### Coloring

* Purple or bold blue.

### 7. Entities (entity.*)

* entity.name.type.class → class names
* entity.name.function → function names
* entity.name.tag → markup tags (HTML/XML)
* entity.other.inherited-class → superclass names in inherit

#### Coloring

* Classes → yellow/gold.
* unctions → cyan or blue.
* Inherited classes → italic cyan (varies by theme).

### 8. Support (support.*)

* support.function → built-in library functions
* support.type → built-in types
* support.constant → built-in constants
* support.variable → built-in variables

#### Coloring

* Usually cyan/teal (so they stand out as library items, not user code).

### 9. Invalid (invalid.*)

* invalid.illegal → syntax errors
* invalid.deprecated → old constructs

#### Coloring

* Red background, white or yellow foreground.

### 10. Punctuation (punctuation.*)

* punctuation.definition.comment → -- in Eiffel
* punctuation.definition.string.begin / .end → delimiters for "..." or 'A'
* punctuation.separator → commas, semicolons
* punctuation.section.block.begin / .end → {, }, or Eiffel do/end

#### Coloring

* Subtle gray, sometimes faint white.

### 11. Meta (meta.*)

* meta.class → whole class body region
* meta.function → whole function body region
* meta.block → a block of code
* meta.import → import/include statements

#### Coloring

* Typically no direct color — used for semantic grouping and folding. Themes rarely color meta.* directly.
