import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'docx' | 'pdf';
  content: string;
  title?: string;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
    createdAt?: Date;
  };
}

export class ExportService {
  static async exportDocument(options: ExportOptions): Promise<Buffer> {
    switch (options.format) {
      case 'docx':
        return this.generateDocx(options);
      case 'pdf':
        return this.generatePdf(options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static async generateDocx(options: ExportOptions): Promise<Buffer> {
    const { content, title = 'Obituary', metadata = {} } = options;

    // Parse content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    const docParagraphs = [];

    // Add title
    if (title) {
      docParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 28 })],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );
    }

    // Add content paragraphs
    paragraphs.forEach(paragraph => {
      docParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: paragraph.trim(), size: 24 })],
          spacing: { after: 200 }
        })
      );
    });

    // Create document
    const doc = new Document({
      properties: {
        title: title,
        subject: metadata.subject || 'Memorial Obituary',
        creator: metadata.author || 'DeathMatters Platform',
        keywords: metadata.keywords?.join(', ') || 'obituary, memorial',
        created: metadata.createdAt || new Date(),
        modified: new Date()
      },
      sections: [{
        properties: {},
        children: docParagraphs
      }]
    });

    return await Packer.toBuffer(doc);
  }

  private static async generatePdf(options: ExportOptions): Promise<Buffer> {
    const { content, title = 'Obituary', metadata = {} } = options;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let y = margin;

    // Add title
    if (title) {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(title, pageWidth - 2 * margin);
      titleLines.forEach((line: string) => {
        pdf.text(line, pageWidth / 2, y, { align: 'center' });
        y += lineHeight + 3;
      });
      y += 10;
    }

    // Add content
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach(paragraph => {
      const lines = pdf.splitTextToSize(paragraph.trim(), pageWidth - 2 * margin);
      
      lines.forEach((line: string) => {
        // Check if we need a new page
        if (y + lineHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        
        pdf.text(line, margin, y);
        y += lineHeight;
      });
      
      y += lineHeight; // Extra space between paragraphs
    });

    // Add metadata footer
    if (metadata.createdAt) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(
        `Generated on ${metadata.createdAt.toLocaleDateString()}`,
        margin,
        pageHeight - 10
      );
    }

    return Buffer.from(pdf.output('arraybuffer'));
  }

  static generateFilename(format: 'docx' | 'pdf', title?: string): string {
    const sanitizedTitle = title?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'obituary';
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedTitle}_${timestamp}.${format}`;
  }
}