import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

export interface DocumentProcessingResult {
  text: string;
  filename: string;
  filePath: string;
}

export async function processDocument(file: Express.Multer.File): Promise<DocumentProcessingResult> {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  let extractedText = '';

  try {
    if (fileExtension === '.docx') {
      const result = await mammoth.extractRawText({ path: file.path });
      extractedText = result.value;
    } else if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else {
      throw new Error('Unsupported file type. Only .docx and .pdf files are allowed.');
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      text: extractedText,
      filename: file.originalname,
      filePath: file.path
    };
  } catch (error) {
    // Clean up the file if processing failed
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function deleteDocument(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to delete document:', error);
  }
}

export function formatDocumentForPrompt(text: string, filename: string): string {
  return `\n\nCONTEXT EXAMPLES FROM "${filename}":\n${text}\n\nPlease use these examples as style and tone reference when writing the obituary.\n`;
}