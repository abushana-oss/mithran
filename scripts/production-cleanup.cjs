#!/usr/bin/env node

/**
 * Production Cleanup Script
 * Removes debug code, console statements, and development artifacts
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // Directories to clean
  directories: ['app', 'components', 'lib', 'hooks'],
  
  // File extensions to process
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  
  // Patterns to remove in production
  removePatterns: [
    // Console statements (but keep console.error for actual errors)
    /console\.(log|info|debug|warn)\([^)]*\);?\s*/g,
    
    // Alert statements
    /alert\([^)]*\);?\s*/g,
    
    // TODO comments (optional)
    /\/\/ TODO:.*$/gm,
    
    // Debug comments
    /\/\/ DEBUG:.*$/gm,
    
    // Empty lines after removals (more than 2 consecutive)
    /\n\s*\n\s*\n\s*/g
  ],
  
  // Preserve these console statements
  preservePatterns: [
    /console\.error/,
    /console\.trace/
  ]
};

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return CONFIG.extensions.includes(ext);
}

function shouldPreserveStatement(line) {
  return CONFIG.preservePatterns.some(pattern => pattern.test(line));
}

function cleanupFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalSize = content.length;
  
  let modifications = 0;
  
  // Process each removal pattern
  CONFIG.removePatterns.forEach(pattern => {
    const beforeLength = content.length;
    
    if (pattern.toString().includes('console')) {
      // Special handling for console statements - preserve errors
      content = content.split('\n').map(line => {
        if (line.includes('console.') && !shouldPreserveStatement(line)) {
          modifications++;
          return line.replace(pattern, '');
        }
        return line;
      }).join('\n');
    } else {
      content = content.replace(pattern, (match) => {
        modifications++;
        return pattern.toString().includes('\\n') ? '\n\n' : '';
      });
    }
  });
  
  // Clean up excessive whitespace
  content = content.replace(/\n\s*\n\s*\n\s*/g, '\n\n');
  
  if (modifications > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    const newSize = content.length;
    console.log(`✅ Cleaned ${filePath}: ${modifications} changes, ${originalSize - newSize} bytes saved`);
    return { file: filePath, changes: modifications, bytesSaved: originalSize - newSize };
  }
  
  return null;
}

function processDirectory(dirPath) {
  const results = [];
  
  function walkDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and build directories
        if (!['node_modules', '.next', 'dist', '.git'].includes(item)) {
          walkDirectory(itemPath);
        }
      } else if (stat.isFile() && shouldProcessFile(itemPath)) {
        const result = cleanupFile(itemPath);
        if (result) {
          results.push(result);
        }
      }
    }
  }
  
  walkDirectory(dirPath);
  return results;
}

function main() {
  console.log('🧹 Starting Production Cleanup...\n');
  
  const allResults = [];
  
  CONFIG.directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Processing directory: ${dir}`);
      const results = processDirectory(dirPath);
      allResults.push(...results);
    } else {
      console.log(`⚠️  Directory not found: ${dir}`);
    }
  });
  
  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`Files processed: ${allResults.length}`);
  console.log(`Total changes: ${allResults.reduce((sum, r) => sum + r.changes, 0)}`);
  console.log(`Bytes saved: ${allResults.reduce((sum, r) => sum + r.bytesSaved, 0)}`);
  
  if (allResults.length > 0) {
    console.log('\n🎉 Production cleanup completed successfully!');
  } else {
    console.log('\n✨ No cleanup needed - code is already production-ready!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanupFile, CONFIG };