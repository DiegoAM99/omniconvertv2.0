// Test script to verify pdf-parse import
const pdfParse = require('pdf-parse');

console.log('=== PDF-PARSE MODULE INSPECTION ===');
console.log('Type:', typeof pdfParse);
console.log('Is function:', typeof pdfParse === 'function');
console.log('Has default:', pdfParse.default ? 'YES' : 'NO');
console.log('Constructor name:', pdfParse.constructor.name);
console.log('Keys:', Object.keys(pdfParse));
console.log('Module:', pdfParse);

if (pdfParse.default) {
  console.log('\n=== DEFAULT EXPORT ===');
  console.log('Type:', typeof pdfParse.default);
  console.log('Is function:', typeof pdfParse.default === 'function');
}
