# WebChess API Migration Guide

## Overview

This guide provides instructions for migrating tests when the WebChess API changes in the future. It includes strategies for maintaining test compatibility, updating test patterns, and ensuring comprehensive coverage during API transitions.

## Migration Strategy

### 1. Backward Compatibility Approach

When making API changes, follow this compatibility strategy:

#### Phase 1: Additive Changes (Recommended)
- Add new properties/methods alongside existing ones
- Maintain old property names for compatibility
- Add deprecation warnings for old patterns
- Update documentation to show preferred patterns

```javascript
// Example: Adding new property while maintaining old one
class ChessGame {
  get gameStatus() { return this._gameStatus; }
  
  // Maintain backward compatibility
  get status() { 
    console.warn('DEPRECATED: Use gameStatus instead of status');
    return this._gameStatus; 
  }
}
```

#### Phase 2: Deprecation Period
- Mark old patterns as deprecated
- Provide clear migration instructions
- Update all internal code to use new patterns
- Keep old patterns functional

#### Phase 3: Breaking Changes (Major Version)
- Remove deprecated patterns
- Update all tests to use new patterns
- Provide automated migration tools where possible

### 2. Test Migration Process

#### Step 1: Identify Affected Tests
```bash
# Search for old patterns across test files
grep -r "\.status" tests/
grep -r "\.isValid" tests/
grep -r "\.error" tests/
```

#### Step 2: Create Migration Script
```javascript
// migration-script.js
const fs = require('fs');
const path = require('path');

const migrations = [
  {
    pattern: /\.status\b/g,
    replacement: '.gameStatus',
    description: 'Replace .status with .gameStatus'
  },
  {
    pattern: /expect\(result\.isValid\)\.toBe\(true\)/g,
    replacement: 'expect(result.success).toBe(true)',
    description: 'Replace isValid with success for primary validation'
  },
  {
    pattern: /\.error\b/g,
    replacement: '.message',
    description: 'Replace .error with .message'
  }
];

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  migrations.forEach(migration => {
    if (migration.pattern.test(content)) {
      content = content.replace(migration.pattern, migration.replacement);
      changed = true;
      console.log(`Applied: ${migration.description} in ${filePath}`);
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
  }
}

// Run migration on all test files
const testDir = './tests';
fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .forEach(file => migrateFile(path.join(testDir, file)));
```

#### Step 3: Validate Migration
```javascript
// validation-script.js
const { execSync } = require('child_process');

// Run tests to ensure migration was successful
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ Migration successful - all tests pass');
} catch (error) {
  console.log('❌ Migration issues detected - some tests fail');
  process.exit(1);
}
```

## Common Migration Scenarios

### 1. Property Name Changes

#### Before Migration
```javascript
// Old pattern
expect(game.status).toBe('active');
expect(result.isValid).toBe(true);
expect(result.error).toContain('Invalid');
```

#### After Migration
```javascript
// New pattern
expect(game.gameStatus).toBe('active');
expect(result.success).toBe(true);
expect(result.message).toContain('Invalid');
```

#### Migration Script
```javascript
const propertyMigrations = {
  '.status': '.gameStatus',
  '.isValid': '.success',
  '.error': '.message',
  '.turn': '.currentTurn'
};

function migrateProperties(content) {
  Object.entries(propertyMigrations).forEach(([old, new_]) => {
    const regex = new RegExp(`\\${old}\\b`, 'g');
    content = content.replace(regex, new_);
  });
  return content;
}
```

### 2. Method Signature Changes

#### Before Migration
```javascript
// Old method signatures
game.isValidMove(from, to);
game.makeMove(from, to, promotion);
```

#### After Migration
```javascript
// New method signatures
const result = game.makeMove({ from, to, promotion });
const isValid = result.success;
```

#### Migration Strategy
```javascript
function migrateMethods(content) {
  // Replace old method calls with new format
  content = content.replace(
    /game\.isValidMove\(([^)]+)\)/g,
    'game.makeMove($1).success'
  );
  
  content = content.replace(
    /game\.makeMove\((\w+),\s*(\w+),\s*(\w+)\)/g,
    'game.makeMove({ from: $1, to: $2, promotion: $3 })'
  );
  
  return content;
}
```

### 3. Response Structure Changes

#### Before Migration
```javascript
// Old response structure
{
  isValid: true,
  error: null,
  data: { /* move data */ }
}
```

#### After Migration
```javascript
// New response structure
{
  success: true,
  isValid: true,  // Kept for compatibility
  message: "Move successful",
  errorCode: null,
  data: { /* move data */ },
  metadata: { /* additional info */ }
}
```

#### Migration Approach
```javascript
function migrateResponseValidation(content) {
  // Add success validation alongside isValid
  content = content.replace(
    /expect\(result\.isValid\)\.toBe\(true\)/g,
    'expect(result.success).toBe(true);\n  expect(result.isValid).toBe(true)'
  );
  
  // Replace error property with message
  content = content.replace(
    /expect\(result\.error\)/g,
    'expect(result.message)'
  );
  
  return content;
}
```

## Migration Tools

### 1. Automated Migration Script

```javascript
#!/usr/bin/env node
// migrate-tests.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestMigrator {
  constructor() {
    this.migrations = [];
    this.stats = {
      filesProcessed: 0,
      changesApplied: 0,
      errors: []
    };
  }

  addMigration(pattern, replacement, description) {
    this.migrations.push({ pattern, replacement, description });
  }

  migrateFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let fileChanges = 0;

      this.migrations.forEach(migration => {
        const matches = content.match(migration.pattern);
        if (matches) {
          content = content.replace(migration.pattern, migration.replacement);
          fileChanges += matches.length;
          console.log(`  ✓ ${migration.description}: ${matches.length} changes`);
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        this.stats.changesApplied += fileChanges;
        console.log(`📝 Updated ${filePath} (${fileChanges} changes)`);
      }

      this.stats.filesProcessed++;
    } catch (error) {
      this.stats.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error processing ${filePath}: ${error.message}`);
    }
  }

  migrateDirectory(dirPath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        this.migrateDirectory(fullPath);
      } else if (file.name.endsWith('.test.js')) {
        console.log(`\n🔄 Processing ${fullPath}`);
        this.migrateFile(fullPath);
      }
    });
  }

  validateMigration() {
    console.log('\n🧪 Running tests to validate migration...');
    try {
      execSync('npm test', { stdio: 'inherit' });
      console.log('✅ All tests pass - migration successful!');
      return true;
    } catch (error) {
      console.log('❌ Some tests failed - migration needs review');
      return false;
    }
  }

  printStats() {
    console.log('\n📊 Migration Statistics:');
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   Changes applied: ${this.stats.changesApplied}`);
    console.log(`   Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => {
        console.log(`   ${error.file}: ${error.error}`);
      });
    }
  }
}

// Example usage
const migrator = new TestMigrator();

// Add common migrations
migrator.addMigration(/\.status\b/g, '.gameStatus', 'Replace .status with .gameStatus');
migrator.addMigration(/\.turn\b/g, '.currentTurn', 'Replace .turn with .currentTurn');
migrator.addMigration(/\.error\b/g, '.message', 'Replace .error with .message');

// Run migration
console.log('🚀 Starting test migration...');
migrator.migrateDirectory('./tests');
migrator.printStats();

// Validate migration
if (migrator.validateMigration()) {
  console.log('\n🎉 Migration completed successfully!');
} else {
  console.log('\n⚠️  Migration completed with issues - manual review required');
}
```

### 2. Migration Validation Tool

```javascript
// validate-migration.js
const fs = require('fs');
const path = require('path');

class MigrationValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
  }

  validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for old patterns that should have been migrated
    const oldPatterns = [
      { pattern: /\.status\b/, message: 'Found .status - should be .gameStatus' },
      { pattern: /\.turn\b/, message: 'Found .turn - should be .currentTurn' },
      { pattern: /\.error\b/, message: 'Found .error - should be .message' },
      { pattern: /\.isValid\)\.toBe\(true\)/, message: 'Found isValid without success validation' }
    ];

    oldPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          file: filePath,
          message: message,
          count: matches.length
        });
      }
    });

    // Check for new patterns to ensure migration was applied
    const newPatterns = [
      { pattern: /\.gameStatus\b/, message: 'Uses new .gameStatus property' },
      { pattern: /\.currentTurn\b/, message: 'Uses new .currentTurn property' },
      { pattern: /\.success\)\.toBe\(true\)/, message: 'Uses new .success validation' }
    ];

    newPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.warnings.push({
          file: filePath,
          message: message,
          count: matches.length
        });
      }
    });
  }

  validateDirectory(dirPath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        this.validateDirectory(fullPath);
      } else if (file.name.endsWith('.test.js')) {
        this.validateFile(fullPath);
      }
    });
  }

  printReport() {
    console.log('\n📋 Migration Validation Report');
    console.log('================================');

    if (this.issues.length === 0) {
      console.log('✅ No migration issues found!');
    } else {
      console.log(`❌ Found ${this.issues.length} migration issues:`);
      this.issues.forEach(issue => {
        console.log(`   ${issue.file}: ${issue.message} (${issue.count} occurrences)`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n✅ Successfully migrated patterns (${this.warnings.length} files):`);
      this.warnings.forEach(warning => {
        console.log(`   ${warning.file}: ${warning.message} (${warning.count} occurrences)`);
      });
    }

    return this.issues.length === 0;
  }
}

// Run validation
const validator = new MigrationValidator();
validator.validateDirectory('./tests');
const isValid = validator.printReport();

process.exit(isValid ? 0 : 1);
```

## Future-Proofing Strategies

### 1. Version-Aware Testing

```javascript
// version-aware-test.js
const API_VERSION = process.env.API_VERSION || '2.0';

describe('Version-aware tests', () => {
  test('should work with current API version', () => {
    const game = new ChessGame();
    const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };
    const result = game.makeMove(move);

    if (API_VERSION >= '2.0') {
      // New API patterns
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    } else {
      // Legacy API patterns
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    }
  });
});
```

### 2. Adapter Pattern for API Changes

```javascript
// api-adapter.js
class APIAdapter {
  constructor(apiVersion = '2.0') {
    this.version = apiVersion;
  }

  normalizeResponse(response) {
    if (this.version >= '2.0') {
      return response; // Already in new format
    } else {
      // Convert old format to new format
      return {
        success: response.isValid,
        isValid: response.isValid,
        message: response.error || 'Operation completed',
        errorCode: response.isValid ? null : 'UNKNOWN_ERROR',
        data: response.data || {}
      };
    }
  }

  normalizeGameState(gameState) {
    if (this.version >= '2.0') {
      return gameState;
    } else {
      // Convert old property names
      return {
        ...gameState,
        gameStatus: gameState.status,
        currentTurn: gameState.turn
      };
    }
  }
}

// Usage in tests
const adapter = new APIAdapter();

test('should work with adapter', () => {
  const game = new ChessGame();
  const rawResult = game.makeMove(move);
  const result = adapter.normalizeResponse(rawResult);
  
  expect(result.success).toBe(true);
  expect(result.message).toBeDefined();
});
```

### 3. Configuration-Based Testing

```javascript
// test-config.js
module.exports = {
  apiPatterns: {
    responseValidation: {
      success: 'result.success',
      message: 'result.message',
      errorCode: 'result.errorCode'
    },
    gameState: {
      status: 'game.gameStatus',
      turn: 'game.currentTurn',
      check: 'game.inCheck'
    }
  },
  
  errorCodes: {
    invalidMove: 'INVALID_MOVEMENT',
    noPiece: 'NO_PIECE',
    wrongTurn: 'WRONG_TURN'
  }
};

// Usage in tests
const config = require('./test-config');

test('should use configured patterns', () => {
  const result = game.makeMove(move);
  
  // Use configured property paths
  expect(eval(config.apiPatterns.responseValidation.success)).toBe(true);
  expect(eval(config.apiPatterns.responseValidation.message)).toBeDefined();
});
```

## Rollback Strategy

### 1. Backup Before Migration

```javascript
// backup-tests.js
const fs = require('fs');
const path = require('path');

function backupTests() {
  const backupDir = `./tests-backup-${Date.now()}`;
  fs.mkdirSync(backupDir, { recursive: true });
  
  function copyDirectory(src, dest) {
    const files = fs.readdirSync(src, { withFileTypes: true });
    
    files.forEach(file => {
      const srcPath = path.join(src, file.name);
      const destPath = path.join(dest, file.name);
      
      if (file.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
  
  copyDirectory('./tests', backupDir);
  console.log(`✅ Tests backed up to ${backupDir}`);
  return backupDir;
}

module.exports = { backupTests };
```

### 2. Rollback Script

```javascript
// rollback-migration.js
const fs = require('fs');
const path = require('path');

function rollbackMigration(backupDir) {
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Backup directory ${backupDir} not found`);
    return false;
  }
  
  // Remove current tests
  fs.rmSync('./tests', { recursive: true, force: true });
  
  // Restore from backup
  function copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src, { withFileTypes: true });
    
    files.forEach(file => {
      const srcPath = path.join(src, file.name);
      const destPath = path.join(dest, file.name);
      
      if (file.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
  
  copyDirectory(backupDir, './tests');
  console.log(`✅ Tests restored from ${backupDir}`);
  return true;
}

// Usage
if (require.main === module) {
  const backupDir = process.argv[2];
  if (!backupDir) {
    console.error('Usage: node rollback-migration.js <backup-directory>');
    process.exit(1);
  }
  
  rollbackMigration(backupDir);
}

module.exports = { rollbackMigration };
```

## Best Practices for Future Migrations

### 1. Plan Migrations Carefully
- Document all breaking changes
- Provide clear migration paths
- Test migration scripts thoroughly
- Communicate changes to team

### 2. Use Gradual Migration
- Implement changes in phases
- Maintain backward compatibility during transition
- Provide deprecation warnings
- Allow time for team to adapt

### 3. Automate Where Possible
- Create migration scripts for common patterns
- Validate migrations automatically
- Provide rollback mechanisms
- Test migration scripts on sample data

### 4. Document Everything
- Keep migration logs
- Document new patterns
- Update style guides
- Provide examples

This migration guide ensures smooth transitions when the WebChess API evolves, maintaining test reliability and developer productivity.