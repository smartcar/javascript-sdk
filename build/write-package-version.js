#!/usr/bin/env node

/**
 * Writes the given version number into package.json and package-lock.json
 *
 * Usage: build/write-package-version.js <version>
 * Example: build/write-package-version.js 2.0.0
 */
const fs = require('fs');
const NEXT_RELEASE = process.argv[2];

/**
 * Reads, updates, and writes file
 *
 * @param {String} file - name of file to update
 */
function update(file) {
  const pkg = require(`../${file}`);
  pkg.version = NEXT_RELEASE;
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
}

update('package.json');
update('package-lock.json');
