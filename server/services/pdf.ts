import { jsPDF } from 'jspdf';

export interface PDFGenerationOptions {
  obituaryText: string;
  fullName: string;
  imageUrl?: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
}

export async function generateObituaryPDF(options: PDFGenerationOptions): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const textWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('In Loving Memory', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Name
  doc.setFontSize(18);
  doc.text(options.fullName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  // Dates
  if (options.dateOfBirth || options.dateOfDeath) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    let dateText = '';
    if (options.dateOfBirth) dateText += options.dateOfBirth;
    if (options.dateOfBirth && options.dateOfDeath) dateText += ' - ';
    if (options.dateOfDeath) dateText += options.dateOfDeath;
    doc.text(dateText, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
  } else {
    yPosition += 10;
  }
  
  // Image (if provided)
  if (options.imageUrl) {
    try {
      // In a real implementation, you'd fetch and process the image
      // For now, we'll add a placeholder space
      yPosition += 60; // Space for image
    } catch (error) {
      console.error('Error adding image to PDF:', error);
    }
  }
  
  // Obituary text
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  const lines = doc.splitTextToSize(options.obituaryText, textWidth);
  
  for (let i = 0; i < lines.length; i++) {
    if (yPosition > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(lines[i], margin, yPosition);
    yPosition += 6;
  }
  
  // Generate buffer
  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
}
