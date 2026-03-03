// Test with PDFParse class
const pdfLib = require('pdf-parse');

console.log('Testing PDFParse class...');
const { PDFParse } = pdfLib;

console.log('PDFParse:', typeof PDFParse);

if (typeof PDFParse === 'function') {
  console.log('PDFParse is a class/function');
  
  // Try to use it
  const parser = new PDFParse();
  console.log('Parser instance:', parser);
  console.log('Parser methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
} else {
  console.log('PDFParse is not a function');
}

// Try default module function
console.log('\n\nTrying as direct function...');
console.log('Module type:', typeof pdfLib);
console.log('Module:', pdfLib);
