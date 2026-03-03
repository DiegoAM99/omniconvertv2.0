// Document Processor with PDF to DOCX conversion and OCR support
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const Tesseract = require('tesseract.js');
const { pdf } = require('pdf-to-img');

class MockDocumentProcessor {
  static async convert(inputBuffer, inputFormat, outputFormat, options = {}) {
    console.log(`[PROCESSOR] Converting ${inputBuffer.length} bytes from ${inputFormat} to ${outputFormat}`);
    
    try {
      // PDF to DOCX conversion
      if (inputFormat === 'pdf' && outputFormat === 'docx') {
        return await this.pdfToDocx(inputBuffer, options);
      }
      
      // PDF to TXT conversion
      if (inputFormat === 'pdf' && outputFormat === 'txt') {
        return await this.pdfToText(inputBuffer);
      }
      
      // For other conversions, return a valid DOCX file
      if (outputFormat === 'docx') {
        return await this.createSimpleDocx(inputFormat);
      }
      
      // Fallback to text
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockContent = `Converted from ${inputFormat} to ${outputFormat}\n\nThis is a simulated conversion.\nConverted at: ${new Date().toISOString()}\n`;
      return Buffer.from(mockContent);
      
    } catch (error) {
      console.error('[PROCESSOR] Conversion error:', error);
      throw error;
    }
  }
  
  static async pdfToDocx(pdfBuffer, options = {}) {
    try {
      // Extract text from PDF
      console.log('[PROCESSOR] Extracting text from PDF...');
      console.log('[PROCESSOR] PDF buffer size:', pdfBuffer.length);
      
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text || '';
      
      console.log(`[PROCESSOR] PDF info:`, {
        pages: pdfData.numpages,
        textLength: text.length,
        info: pdfData.info,
        metadata: pdfData.metadata
      });
      
      // If no text extracted, try OCR
      if (!text || text.trim().length === 0) {
        console.warn('[PROCESSOR] No text extracted from PDF - attempting OCR...');
        
        // Check if OCR is enabled
        if (options.ocr !== false) {
          try {
            const ocrText = await this.performOCR(pdfBuffer, options.ocrLanguage || 'spa');
            
            if (ocrText && ocrText.trim().length > 0) {
              console.log(`[PROCESSOR] OCR extracted ${ocrText.length} characters`);
              return await this.createDocxFromText(ocrText);
            }
          } catch (ocrError) {
            console.error('[PROCESSOR] OCR failed:', ocrError.message);
          }
        }
        
        // If OCR failed or disabled, return informative message
        return await this.createSimpleDocx('pdf', 
          'No se pudo extraer texto del PDF.\n\n' +
          'El PDF puede contener solo imágenes escaneadas.\n' +
          'El sistema intentó usar OCR pero no pudo extraer texto.\n\n' +
          `Páginas: ${pdfData.numpages}\n\n` +
          'Sugerencias:\n' +
          '- Use un PDF con texto seleccionable\n' +
          '- Verifique que las imágenes sean legibles\n' +
          '- Intente con un PDF de mejor calidad'
        );
      }
      
      console.log(`[PROCESSOR] Extracted ${text.length} characters from PDF`);
      console.log(`[PROCESSOR] First 200 chars: ${text.substring(0, 200)}`);
      
      return await this.createDocxFromText(text);
    } catch (error) {
      console.error('[PROCESSOR] PDF to DOCX conversion failed:', error);
      console.error('[PROCESSOR] Error stack:', error.stack);
      // Fallback to simple DOCX
      return await this.createSimpleDocx('pdf', `Error extracting PDF: ${error.message}`);
    }
  }
  
  static async performOCR(pdfBuffer, language = 'spa') {
    console.log('[PROCESSOR] Starting OCR process with pdf-to-img...');
    console.log('[PROCESSOR] OCR language:', language);
    
    try {
      console.log('[OCR] Converting PDF pages to images...');
      const images = await pdf(pdfBuffer, { scale: 2.0 });

      let fullText = '';
      let pageNum = 0;
      const worker = await Tesseract.createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Page ${pageNum || 1} progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      for await (const imageBuffer of images) {
        pageNum += 1;
        console.log(`[OCR] Processing page ${pageNum}...`);

        try {
          const { data } = await worker.recognize(imageBuffer);
          const pageText = (data && data.text ? data.text : '').trim();

          if (pageText.length > 0) {
            console.log(`[OCR] Page ${pageNum}: extracted ${pageText.length} characters`);
            fullText += `${pageText}\n\n`;
          } else {
            console.log(`[OCR] Page ${pageNum}: no text recognized`);
          }
        } catch (pageError) {
          console.error(`[OCR] Error processing page ${pageNum}:`, pageError.message);
        }
      }

      await worker.terminate();
      console.log(`[OCR] Completed. Pages: ${pageNum}, text length: ${fullText.trim().length}`);

      return fullText.trim().length > 0 ? fullText : null;
    } catch (error) {
      console.error('[PROCESSOR] OCR error:', error);
      console.error('[PROCESSOR] OCR stack:', error.stack);
      throw error;
    }
  }
  
  static async createDocxFromText(text) {
    // Create DOCX document from text
    const paragraphs = text.split('\n').map(line => 
      new Paragraph({
        children: [new TextRun(line || ' ')],
        spacing: { after: 200 }
      })
    );
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs.length > 0 ? paragraphs : [
          new Paragraph({
            children: [new TextRun('Documento sin contenido')]
          })
        ]
      }]
    });
    
    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc);
    console.log(`[PROCESSOR] Generated DOCX file: ${buffer.length} bytes`);
    
    return buffer;
  }
  
  static async pdfToText(pdfBuffer) {
    try {
      const pdfData = await pdfParse(pdfBuffer);
      return Buffer.from(pdfData.text);
    } catch (error) {
      console.error('[PROCESSOR] PDF to TXT conversion failed:', error);
      return Buffer.from(`Error extracting PDF text: ${error.message}`);
    }
  }
  
  static async createSimpleDocx(sourceFormat, errorMessage = null) {
    const content = errorMessage || `Document converted from ${sourceFormat.toUpperCase()}\n\nConverted at: ${new Date().toISOString()}`;
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({
              text: content,
              size: 24
            })]
          })
        ]
      }]
    });
    
    return await Packer.toBuffer(doc);
  }
}

module.exports = { MockDocumentProcessor };
