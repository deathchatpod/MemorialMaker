import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { z } from 'zod';

// Enhanced document validation schema
export const documentValidationSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  size: z.number()
    .min(1, "File cannot be empty")
    .max(10 * 1024 * 1024, "File size cannot exceed 10MB"),
  mimetype: z.string().refine((type) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/pdf',
      'text/plain'
    ];
    return allowedTypes.includes(type);
  }, "Only .docx, .doc, .pdf, and .txt files are allowed")
});

export interface ProcessedDocument {
  extractedText: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    pageCount?: number;
    hasImages?: boolean;
    processedAt: Date;
  };
  quality: {
    score: number; // 0-100
    issues: string[];
    suggestions: string[];
  };
}

export class DocumentProcessor {
  private static readonly MIN_WORD_COUNT = 50;
  private static readonly MAX_WORD_COUNT = 5000;

  static async processDocument(buffer: Buffer, mimetype: string, filename: string): Promise<ProcessedDocument> {
    let extractedText = '';
    let pageCount: number | undefined;
    let hasImages = false;

    try {
      switch (mimetype) {
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          const docxResult = await mammoth.extractRawText({ buffer });
          extractedText = docxResult.value;
          hasImages = docxResult.messages.some(msg => msg.type === 'warning' && msg.message.includes('image'));
          break;

        case 'application/pdf':
          const pdfResult = await pdfParse(buffer);
          extractedText = pdfResult.text;
          pageCount = pdfResult.numpages;
          break;

        case 'text/plain':
          extractedText = buffer.toString('utf-8');
          break;

        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }

      // Clean and normalize text
      extractedText = this.cleanText(extractedText);

      // Generate metadata
      const metadata = {
        wordCount: this.countWords(extractedText),
        characterCount: extractedText.length,
        pageCount,
        hasImages,
        processedAt: new Date()
      };

      // Assess document quality
      const quality = this.assessQuality(extractedText, metadata);

      return {
        extractedText,
        metadata,
        quality
      };

    } catch (error) {
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')          // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')      // Remove excessive line breaks
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .replace(/^\s+|\s+$/gm, '')      // Trim lines
      .trim();
  }

  private static countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private static assessQuality(text: string, metadata: any): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check word count
    if (metadata.wordCount < this.MIN_WORD_COUNT) {
      issues.push(`Document is too short (${metadata.wordCount} words). Minimum ${this.MIN_WORD_COUNT} words recommended.`);
      score -= 30;
    } else if (metadata.wordCount > this.MAX_WORD_COUNT) {
      issues.push(`Document is very long (${metadata.wordCount} words). Consider summarizing key points.`);
      score -= 10;
    }

    // Check for common obituary elements
    const hasName = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text);
    const hasDates = /\b(19|20)\d{2}\b/.test(text) || /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(text);
    const hasPersonalInfo = /\b(age|years old|born|died|passed away|survived by)\b/i.test(text);

    if (!hasName) {
      issues.push("No clear name detected. Ensure the deceased's full name is included.");
      score -= 20;
    }

    if (!hasDates) {
      issues.push("No dates detected. Consider including birth/death dates.");
      score -= 15;
    }

    if (!hasPersonalInfo) {
      issues.push("Limited personal information detected. Consider adding more biographical details.");
      score -= 10;
    }

    // Generate suggestions
    if (metadata.wordCount < 200) {
      suggestions.push("Consider adding more details about the person's life, achievements, and relationships.");
    }

    if (!text.includes("service") && !text.includes("funeral") && !text.includes("memorial")) {
      suggestions.push("Consider adding information about memorial services or funeral arrangements.");
    }

    if (!text.includes("family") && !text.includes("survived") && !text.includes("children")) {
      suggestions.push("Consider mentioning surviving family members or relationships.");
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      suggestions
    };
  }

  static validateFile(file: { filename: string; size: number; mimetype: string }): void {
    const result = documentValidationSchema.safeParse(file);
    if (!result.success) {
      throw new Error(result.error.errors.map(e => e.message).join(', '));
    }
  }
}