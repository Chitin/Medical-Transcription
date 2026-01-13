import type { APIRoute } from 'astro';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { report } = await request.json();

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    
    // Embed fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const monoFont = await pdfDoc.embedFont(StandardFonts.Courier);
    
    let yPosition = 792; // Start from top
    const leftMargin = 50;
    const pageWidth = 495; // 595 - 100 (margins)
    
    // Helper function to add text
    const addText = (text: string, options: any = {}) => {
      const fontSize = options.size || 10;
      const font = options.font || regularFont;
      const color = options.color || rgb(0, 0, 0);
      
      page.drawText(text, {
        x: leftMargin,
        y: yPosition,
        size: fontSize,
        font: font,
        color: color,
        maxWidth: pageWidth
      });
      
      yPosition -= (options.lineHeight || fontSize + 4);
    };
    
    // Parse and format the report
    const lines = report.split('\n');
    
    for (const line of lines) {
      if (yPosition < 50) break; // Stop if we run out of space
      
      const trimmedLine = line.trim();
      
      // Header (first line)
      if (trimmedLine.includes('DEPARTMENT OF RADIOLOGY')) {
        addText(trimmedLine, { font: boldFont, size: 12, lineHeight: 16 });
      }
      // Section headers (all caps lines)
      else if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 0 && !trimmedLine.includes(':')) {
        yPosition -= 5; // Extra space before headers
        addText(trimmedLine, { font: boldFont, size: 10, lineHeight: 14 });
      }
      // Empty lines
      else if (trimmedLine === '') {
        yPosition -= 8;
      }
      // Regular content
      else {
        addText(trimmedLine, { font: monoFont, size: 9, lineHeight: 12 });
      }
    }
    
    // Add footer with date/time
    page.drawText(`Generated: ${new Date().toLocaleString('en-GB')}`, {
      x: leftMargin,
      y: 30,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="medical-report-${Date.now()}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF creation error:', error);
    return new Response(JSON.stringify({ error: 'PDF creation failed' }), {
      status: 500
    });
  }
};