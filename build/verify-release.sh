#!/usr/bin/env bash

NEXT_RELEASE="$1"
LAST_RELEASE="$2"

EXIT_CODE=0

# Prints that $FILE is out of sync
#
# @param FILE - name of file out of sync
fail() {
  local 'file'
  EXIT_CODE=1
  file="$1"
  printf "\033[1;31m[error]\033[0m please run \"npm run prepare-release\" %s need(s) to be updated\n" "$file"
}

# Runs a command and if the command fails, prints that file is bad.
#
# @param FILE - name of file being tested
# @param ...args - command to run
try() {
  local 'file'
  local 'command'

  file="$1"
  command=("${@:2}")

  # Execute command, if it fails, exec fail
  "${command[@]}" > /dev/null || fail "$file"
}

# Print
echo "Checking if all files have version: $NEXT_RELEASE"

# Ensure that package.json is in sync
try "package.json" test "$(jq --raw-output .version package.json)" = "$NEXT_RELEASE"
try "package-lock.json" test "$(jq --raw-output .version package.json)" = "$NEXT_RELEASE"

# Ensure that readme was regenerated
try "README.md" grep --fixed-strings "[version]: $NEXT_RELEASE" README.md

# run jsdoc and fail if any files in the doc folder have changed
npm run jsdoc
try "jsdoc" test -z "$(git diff --name-only | grep 'doc/')"

exit $EXIT_CODE
