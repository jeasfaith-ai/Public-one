import jsPDF from 'jspdf';

export const generateDefensePDF = (
  topic: string,
  studentName: string,
  script: string
): jsPDF => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25.4; // 1 inch
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper to add text and manage page breaks
  const addText = (
    text: string,
    fontSize: number = 12,
    isBold: boolean = false,
    align: 'left' | 'center' | 'right' | 'justify' = 'left',
    lineSpacingFactor: number = 1.5
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('times', isBold ? 'bold' : 'normal');

    // Clean text (remove markdown bolding for now, or handle it)
    // Simple cleaning: remove **
    const cleanText = text.replace(/\*\*/g, '');
    
    const lines = doc.splitTextToSize(cleanText, contentWidth);
    const lineHeight = fontSize * 0.3527 * lineSpacingFactor;

    lines.forEach((line: string) => {
      if (yPos + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      let xPos = margin;
      if (align === 'center') xPos = pageWidth / 2;
      if (align === 'right') xPos = pageWidth - margin;

      doc.text(line, xPos, yPos, {
        align: align === 'justify' ? 'left' : align,
        maxWidth: contentWidth
      });

      yPos += lineHeight;
    });
    
    yPos += lineHeight * 0.5; // Paragraph spacing
  };

  // Title Page
  addText("PROJECT DEFENSE SCRIPT", 16, true, 'center');
  yPos += 10;
  addText(topic.toUpperCase(), 14, true, 'center');
  yPos += 10;
  addText(`Presented by: ${studentName}`, 12, false, 'center');
  yPos += 20;

  // Process script content
  // Split by newlines to handle paragraphs
  const paragraphs = script.split('\n');
  
  paragraphs.forEach(para => {
    const trimmed = para.trim();
    if (!trimmed) return;

    // Check for headers (### or ## or #)
    if (trimmed.startsWith('#')) {
      const headerText = trimmed.replace(/^#+\s*/, '');
      yPos += 5; // Extra space before header
      addText(headerText, 14, true, 'left');
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
       // Bold line
       const text = trimmed.replace(/\*\*/g, '');
       addText(text, 12, true, 'left');
    } else {
       // Normal text
       // Check if it contains bold parts (simple check)
       // For now, just render as normal text to keep it simple and robust
       addText(trimmed, 12, false, 'justify');
    }
  });

  return doc;
};
