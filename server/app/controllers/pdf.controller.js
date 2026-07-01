const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const QRCode = require('qrcode')
const db = require('../models')
const Sequelize = require('sequelize')
const { GRIEVANCE_UPLOAD_DIR, ensureDir } = require('../config/paths.config');

ensureDir(GRIEVANCE_UPLOAD_DIR);


exports.generatePDF = async (req, res) => {
  try {
    // Get the form data from the request body
    const formData = req.body;
    
    Object.keys(formData).forEach(key => {
      if (typeof formData[key] === 'boolean') {
        formData[key] = formData[key] ? 'Yes' : 'No';
      }
    });


    const formPath = path.join(__dirname, '/../../../public', 'forms', `${formData.type}.pdf`);
 
   // Generate QR code as a data URI
   const serverUrl = `${req.protocol}://${req.get('host')}`;
   const url = serverUrl +'/#/status/'+req.body.grievance_id
   console.log(url)

    const qrCodeDataUri = await QRCode.toDataURL(JSON.stringify((url)) );

     

    const formBytes = fs.readFileSync(formPath);

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(formBytes);

    // Get the form embedded in the PDF
    const form = pdfDoc.getForm();

    // Iterate through the formData keys and fill the corresponding PDF fields
    for (const key in formData) {
      try {
        // Attempt to get the text field from the PDF form
        const field = form.getTextField(key);
        field.setText(formData[key] || ''); // Set text or default to empty
      } catch (error) {
        console.warn(`Field "${key}" not found in the PDF form. Skipping. Error: ${error.message}`);
      }
    }

    // Flatten the form to prevent further editing
    form.flatten(); 
          // Generate QR code as a data URI
 
          // Embed the QR code into the PDF
          const qrImage = await pdfDoc.embedPng(qrCodeDataUri);

          // Define dimensions for QR code (width, height) and position (x, y)
          const qrWidth = 70;  // Adjust as necessary
          const qrHeight = 70; // Adjust as necessary
          const qrX = 475;      // Adjust as necessary (right side of the page)
          const qrY = 55;      // Adjust as necessary (bottom of the page)

          // Get the first page of the PDF
          const page = pdfDoc.getPages()[0];

          // Draw the QR code on the page
          page.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrWidth,
            height: qrHeight,
          });



    // Save the modified PDF to bytes
    const pdfBytes = await pdfDoc.save();

    
    // Generate filename from grievance code and document type
    // Format: GRM-2024-0001-Acknowledgement.pdf
    const grievanceCode = formData.code || 'UNKNOWN';
    const docType = formData.type || 'document';
    // Capitalize first letter of document type
    const capitalizedType = docType.charAt(0).toUpperCase() + docType.slice(1);
    // Sanitize filename: remove special characters, replace spaces with hyphens
    const sanitizedCode = grievanceCode.replace(/[^a-zA-Z0-9-]/g, '');
    let baseFilename = `${sanitizedCode}-${capitalizedType}.pdf`;
    
    // Handle duplicate filenames by appending a number if file already exists
    let uniqueFilename = baseFilename;
    let counter = 1;
    const uploadDir = GRIEVANCE_UPLOAD_DIR;
    while (fs.existsSync(path.join(uploadDir, uniqueFilename))) {
      const nameWithoutExt = baseFilename.replace('.pdf', '');
      uniqueFilename = `${nameWithoutExt}-${counter}.pdf`;
      counter++;
    }

    // Define the upload path
    const uploadPath = path.join(uploadDir, uniqueFilename);

    // Check if client wants blob response (for download before saving)
    const returnBlob = formData.returnBlob === true || formData.returnBlob === 'true';
    
    if (returnBlob) {
      // Return PDF blob directly for download
      const sanitizedFilename = uniqueFilename.replace(/[^a-zA-Z0-9-.]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
      res.setHeader('Content-Length', pdfBytes.length);
      res.status(200).send(Buffer.from(pdfBytes));
      return;
    }

    // Save the PDF to the /data/uploads directory (only if not returning blob)
    fs.writeFileSync(uploadPath, pdfBytes);

    console.log(`PDF saved successfully at ${uploadPath}`);

      // Get the file size
      const stats = fs.statSync(uploadPath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2); // Rounded to 2 decimal places


      console.log(formData)
 
    const obj = {}

                obj.grievance_id =formData.grievance_id || formData.id
                obj.action_id = formData.action_id ?formData.action_id  :null
                obj.format =  'pdf'
                obj.size = fileSizeInMB 
                obj.protected_file = false 
                obj.name = uniqueFilename
                obj.location = uploadPath
                obj.code =uniqueFilename
                obj.type = formData.type
 
    await db.models.grievance_document.create(obj); 




    // Send a response with the file path or any other info you want to return
    res.status(200).send({
      code: '0000',
      message: 'File generated and saved successfully',
      filePath: uploadPath, // You can return the file path or a download link
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send({ message: 'Unable to generate document' });
  }
};

 
 

exports.xgenerateTimelinePDF = async (req, res) => {
  try {
    // Get the form data and events array from the request body
    const { events = [], grievance_id, type, details = '', status = '' } = req.body;

    console.log(req.body);

    // Validate input
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).send({ message: 'Events array is required and cannot be empty' });
    }
    if (!grievance_id || !type) {
      return res.status(400).send({ message: 'grievance_id and type are required' });
    }

    // Sort events by date in descending order (latest first)
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Latest date first
    });

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 size in points (portrait)
    const { width, height } = page.getSize();

    // Load standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Define styling constants
    const fontSize = 12;
    const titleFontSize = 16;
    const sectionTitleFontSize = 13;
    const headerFontSize = 12;
    const margin = 50;
    const lineHeight = 20;
    const timelineX = margin + 100; // X position for timeline vertical line
    let currentY = height - margin;
    let timelineStartY = 0; // To track the start of the timeline content
    let timelineEndY = 0; // To track the end of the timeline content

    // Draw header with logo
    const headerLines = [
      'MINISTRY OF LANDS, PUBLIC WORKS, HOUSING AND URBAN DEVELOPMENT',
      'State Department for Housing and Urban Development',
      'Second Kenya Informal Settlements Improvement Project (KISIP 2)',
    ];
    const headerWidth = width - 2 * margin;

    // Attempt to load and embed the logo
    let logoImage;
    try {
      const logoPath = './public/gok.png';
      const logoBytes = await import('fs').then(fs => fs.readFileSync(logoPath));
      logoImage = await pdfDoc.embedPng(logoBytes);
      const logoWidth = 100;
      const logoHeight = 100;
      page.drawImage(logoImage, {
        x: (width - logoWidth) / 2, // Center the logo
        y: currentY - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      currentY -= 110; // Adjust for logo height and spacing
    } catch (e) {
      console.warn('Failed to load logo:', e.message);
    }

    // Draw header text (centered)
    headerLines.forEach((line, index) => {
      const words = line.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, headerFontSize);
        if (testWidth <= headerWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.forEach((wrappedLine, wrappedIndex) => {
        const textWidth = boldFont.widthOfTextAtSize(wrappedLine, headerFontSize);
        page.drawText(wrappedLine, {
          x: (width - textWidth) / 2, // Center the text
          y: currentY - (index * lineHeight + wrappedIndex * lineHeight),
          size: headerFontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });
    });

    // Adjust currentY for header
    const headerLineCount = headerLines.reduce((count, line) => {
      const words = line.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, headerFontSize);
        if (testWidth <= headerWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return count + lines.length;
    }, 0);
    currentY -= headerLineCount * lineHeight + 40; // Add spacing after header

    // Draw title
    const titleText = `Grievance: ${grievance_id}`;
    const titleWidth = width - 2 * margin;
    const words = titleText.split(' ');
    let lines = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = boldFont.widthOfTextAtSize(testLine, titleFontSize);
      if (testWidth <= titleWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    lines.forEach((line, index) => {
      page.drawText(line, {
        x: margin,
        y: currentY - index * lineHeight,
        size: titleFontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    });

    currentY -= lines.length * lineHeight + 20; // Adjust for wrapped lines and spacing

    // Draw description section (if provided)
    if (details) {
      page.drawText('Description', {
        x: margin,
        y: currentY,
        size: sectionTitleFontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;

      // Calculate the height of the details text
      const detailsWidth = width - 2 * margin;
      const words = details.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= detailsWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Draw the details text
      lines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: currentY - index * lineHeight,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      });

      // Adjust currentY based on the number of lines
      currentY -= lines.length * lineHeight + 15; // Add extra spacing after description
    }

    // Draw status section (if provided)
    if (status) {
      const statusText = `Status: ${status}`;
      const statusWidth = width - 2 * margin;
      const words = statusText.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= statusWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Determine color based on status (case-insensitive)
      const statusLower = status.toLowerCase();
      let statusColor;
      if (statusLower === 'resolved') {
        statusColor = rgb(0, 0.5, 0); // Green
      } else if (statusLower === 'pending') {
        statusColor = rgb(1, 0, 0); // Red
      } else if (statusLower === 'escalated') {
        statusColor = rgb(1, 0.5, 0); // Orange
      } else {
        statusColor = rgb(0.4, 0.4, 0.4); // Gray
      }

      lines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: currentY - index * lineHeight,
          size: fontSize,
          font: boldFont,
          color: statusColor,
        });
      });

      currentY -= lines.length * lineHeight + 30; // Add extra spacing after status
    }

    // Initialize timeline start
    timelineStartY = currentY;

    // Format and draw each event
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      console.log(event);

      // Format date
      let formattedDate = 'Invalid Date';
      try {
        formattedDate = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(event.date));
      } catch (e) {
        console.warn(`Invalid date format for event: ${event.date}`);
      }

      // Draw date (left of timeline) with word wrapping
      const dateWidth = timelineX - margin; // Space between margin and timeline
      const dateWords = formattedDate.split(' ');
      let dateLines = [];
      let currentDateLine = '';
      for (const word of dateWords) {
        const testLine = currentDateLine ? `${currentDateLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= dateWidth) {
          currentDateLine = testLine;
        } else {
          dateLines.push(currentDateLine);
          currentDateLine = word;
        }
      }
      if (currentDateLine) dateLines.push(currentDateLine);

      // Draw the date lines
      dateLines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: currentY - index * lineHeight,
          size: fontSize,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      });

      // Draw event marker (circle on timeline), aligned with the first date line
      page.drawCircle({
        x: timelineX+20,
        y: currentY + 5,
        size: 5,
        color: rgb(0, 0.2, 0.8),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Draw connector line from marker to event text, aligned with the first date line
      page.drawLine({
        start: { x: timelineX + 30, y: currentY + 5 },
        end: { x: timelineX + 50, y: currentY + 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Draw event title with word wrapping
      const eventWidth = width - timelineX - 60;
      const titleWords = event.event.split(' ');
      let titleLines = [];
      let currentTitleLine = '';
      for (const word of titleWords) {
        const testLine = currentTitleLine ? `${currentTitleLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= eventWidth) {
          currentTitleLine = testLine;
        } else {
          titleLines.push(currentTitleLine);
          currentTitleLine = word;
        }
      }
      if (currentTitleLine) titleLines.push(currentTitleLine);

      // Draw the event title
      titleLines.forEach((line, index) => {
        page.drawText(line, {
          x: timelineX + 60,
          y: currentY + 10 - index * lineHeight,
          size: fontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });

      // Adjust currentY for the title and date (use the maximum number of lines)
      const maxLines = Math.max(dateLines.length, titleLines.length);
      currentY -= (maxLines - 1) * lineHeight;

      // Draw event description with word wrapping (if provided)
      if (event.description) {
        // First split by newlines to handle explicit line breaks
        const descriptionParagraphs = event.description.split('\n');
        let descriptionLines = [];
        
        // Process each paragraph separately
        descriptionParagraphs.forEach((paragraph) => {
          if (paragraph.trim() === '') {
            // Add empty line for blank paragraphs
            descriptionLines.push('');
            return;
          }
          
          const descriptionWords = paragraph.split(' ');
          let currentDescriptionLine = '';
        
          for (const word of descriptionWords) {
          // Check if the word alone exceeds eventWidth
          const wordWidth = font.widthOfTextAtSize(word, fontSize - 2);
          if (wordWidth > eventWidth) {
            // Split long word into chunks that fit within eventWidth
            let remainingWord = word;
            while (remainingWord.length > 0) {
              let chunk = '';
              let chunkWidth = 0;
              // Build chunk character by character until it fits
              for (let i = 0; i < remainingWord.length; i++) {
                const testChunk = chunk + remainingWord[i];
                const testChunkWidth = font.widthOfTextAtSize(testChunk, fontSize - 2);
                if (testChunkWidth <= eventWidth) {
                  chunk = testChunk;
                  chunkWidth = testChunkWidth;
                } else {
                  break;
                }
              }
              // If chunk is empty (e.g., single character too wide), force at least one
              if (chunk === '' && remainingWord.length > 0) {
                chunk = remainingWord[0];
                remainingWord = remainingWord.slice(1);
              } else {
                remainingWord = remainingWord.slice(chunk.length);
              }
              // Add chunk to current line or as a new line
              const testLine = currentDescriptionLine ? `${currentDescriptionLine} ${chunk}` : chunk;
              const testWidth = font.widthOfTextAtSize(testLine, fontSize - 2);
              if (testWidth <= eventWidth && currentDescriptionLine !== '') {
                currentDescriptionLine = testLine;
              } else {
                if (currentDescriptionLine) descriptionLines.push(currentDescriptionLine);
                currentDescriptionLine = chunk;
              }
            }
          } else {
            // Normal word fits within eventWidth
            const testLine = currentDescriptionLine ? `${currentDescriptionLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize - 2);
            if (testWidth <= eventWidth) {
              currentDescriptionLine = testLine;
            } else {
              descriptionLines.push(currentDescriptionLine);
              currentDescriptionLine = word;
            }
          }
          }
          if (currentDescriptionLine) descriptionLines.push(currentDescriptionLine);
        });
      
        // Draw the event description
        const descriptionY = currentY - 5;
        descriptionLines.forEach((line, index) => {
          page.drawText(line, {
            x: timelineX + 50,
            y: descriptionY - index * lineHeight,
            size: fontSize - 2,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        });
      
        // Adjust currentY for the description
        currentY = descriptionY - descriptionLines.length * lineHeight;
      }

      // Add spacing after the event
      currentY -= 30;

      // Update timeline end Y-coordinate
      timelineEndY = currentY;

      // Check for page overflow (add new page if needed)
      if (currentY < margin + 100 && i < sortedEvents.length - 1) {
        // Draw timeline line for the current page
        page.drawLine({
          start: { x: timelineX+20, y: timelineStartY },
          end: { x: timelineX+20, y: margin },
          thickness: 2,
          color: rgb(0, 0.2, 0.8),
        });

        // Add new page
        page = pdfDoc.addPage([595, 842]);
        currentY = height - margin;
        timelineStartY = currentY; // Reset start for new page
      }
    }

    // Draw timeline line for the final page (fit to content)
    page.drawLine({
      start: { x: timelineX+20, y: timelineStartY },
      end: { x: timelineX+20, y: timelineEndY + 5 }, // Fit to last event
      thickness: 2,
      color: rgb(0, 0.2, 0.8),
    });

    // Generate QR code as a data URI
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${serverUrl}/#/status/${grievance_id}`;
    const qrCodeDataUri = await QRCode.toDataURL(url);

    // Embed QR code in the PDF (bottom-right corner of first page)
    const qrImage = await pdfDoc.embedPng(qrCodeDataUri);
    const firstPage = pdfDoc.getPages()[0];
    firstPage.drawImage(qrImage, {
      x: width - 120,
      y: margin,
      width: 70,
      height: 70,
    });

    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // Set headers for browser download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="grievance-timeline-${grievance_id}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);

    // Send the PDF bytes to the browser
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error generating timeline PDF:', error);
    res.status(500).send({ message: 'Unable to generate timeline PDF' });
  }
};


exports.generateTimelinePDF = async (req, res) => {
  try {
    // Get the form data and events array from the request body
    const { events = [], grievance_id, grievance_code, type, details = '', status = '', settlement = '' } = req.body;

    console.log(req.body);

    // Validate input
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).send({ message: 'Events array is required and cannot be empty' });
    }
    if (!grievance_code || !type) {
      return res.status(400).send({ message: 'grievance_code and type are required' });
    }

    // Sort events by date in descending order (latest first)
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Latest date first
    });

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 size in points (portrait)
    const { width, height } = page.getSize();

    // Load standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Define styling constants
    const fontSize = 12;
    const titleFontSize = 16;
    const sectionTitleFontSize = 13;
    const headerFontSize = 12;
    const margin = 50;
    const lineHeight = 20;
    const timelineX = margin + 100; // X position for timeline vertical line
    let currentY = height - margin;
    let timelineStartY = 0; // To track the start of the timeline content
    let timelineEndY = 0; // To track the end of the timeline content

    // Draw header with logo
    const headerLines = [
      'MINISTRY OF LANDS, PUBLIC WORKS, HOUSING AND URBAN DEVELOPMENT',
      'State Department for Housing and Urban Development',
      'Second Kenya Informal Settlements Improvement Project (KISIP 2)',
    ];
    const headerWidth = width - 2 * margin;

    // Attempt to load and embed the logo
    let logoImage;
    try {
      const logoPath = './public/gok.png';
      const logoBytes = await import('fs').then(fs => fs.readFileSync(logoPath));
      logoImage = await pdfDoc.embedPng(logoBytes);
      const logoWidth = 100;
      const logoHeight = 100;
      page.drawImage(logoImage, {
        x: (width - logoWidth) / 2, // Center the logo
        y: currentY - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      currentY -= 110; // Adjust for logo height and spacing
    } catch (e) {
      console.warn('Failed to load logo:', e.message);
    }

    // Draw header text (centered)
    headerLines.forEach((line, index) => {
      const words = line.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, headerFontSize);
        if (testWidth <= headerWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.forEach((wrappedLine, wrappedIndex) => {
        const textWidth = boldFont.widthOfTextAtSize(wrappedLine, headerFontSize);
        page.drawText(wrappedLine, {
          x: (width - textWidth) / 2, // Center the text
          y: currentY - (index * lineHeight + wrappedIndex * lineHeight),
          size: headerFontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });
    });

    // Adjust currentY for header
    const headerLineCount = headerLines.reduce((count, line) => {
      const words = line.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, headerFontSize);
        if (testWidth <= headerWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return count + lines.length;
    }, 0);
    currentY -= headerLineCount * lineHeight + 40; // Add spacing after header

    // Draw title
    const titleText = `Grievance: ${grievance_code}`;
    const titleWidth = width - 2 * margin;
    let lines = [];
    let currentLine = '';
    for (const word of titleText.split(' ')) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = boldFont.widthOfTextAtSize(testLine, titleFontSize);
      if (testWidth <= titleWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    lines.forEach((line, index) => {
      page.drawText(line, {
        x: margin,
        y: currentY - index * lineHeight,
        size: titleFontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    });

    currentY -= lines.length * lineHeight + 10; // Adjust for wrapped lines and spacing

    // Draw settlement section (if provided)
    if (settlement) {
      const settlementText = `Settlement: ${settlement}`;
      lines = [];
      currentLine = '';
      for (const word of settlementText.split(' ')) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, titleFontSize);
        if (testWidth <= titleWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: currentY - index * lineHeight,
          size: titleFontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });

      currentY -= lines.length * lineHeight + 20; // Adjust for wrapped lines and spacing
    }

    // Draw description section (if provided)
    if (details) {
      page.drawText('Description', {
        x: margin,
        y: currentY,
        size: sectionTitleFontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;

      // Calculate the height of the details text
      const detailsWidth = width - 2 * margin;
      const words = details.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= detailsWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Draw the details text
      lines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: currentY - index * lineHeight,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      });

      // Adjust currentY based on the number of lines
      currentY -= lines.length * lineHeight + 15; // Add extra spacing after description
    }

    // Draw status section (if provided)
    if (status) {
      const statusText = `Status: ${status}`;
      const statusWidth = width - 2 * margin;
      const words = statusText.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= statusWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Determine color based on status (case-insensitive)
      const statusLower = status.toLowerCase();
      let statusColor;
      if (statusLower === 'resolved') {
        statusColor = rgb(0, 0.5, 0); // Green
      } else if (statusLower === 'pending') {
        statusColor = rgb(1, 0, 0); // Red
      } else if (statusLower === 'escalated') {
        statusColor = rgb(1, 0.5, 0); // Orange
      } else {
        statusColor = rgb(0.4, 0.4, 0.4); // Gray
      }

      lines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: currentY - index * lineHeight,
          size: fontSize,
          font: boldFont,
          color: statusColor,
        });
      });

      currentY -= lines.length * lineHeight + 30; // Add extra spacing after status
    }

    // Initialize timeline start
    timelineStartY = currentY;

    // Format and draw each event
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      console.log(event);

      // Format date
      let formattedDate = 'Invalid Date';
      try {
        formattedDate = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(event.date));
      } catch (e) {
        console.warn(`Invalid date format for event: ${event.date}`);
      }

      // Draw date (left of timeline) with word wrapping
      const dateWidth = timelineX - margin; // Space between margin and timeline
      const dateWords = formattedDate.split(' ');
      let dateLines = [];
      let currentDateLine = '';
      for (const word of dateWords) {
        const testLine = currentDateLine ? `${currentDateLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= dateWidth) {
          currentDateLine = testLine;
        } else {
          dateLines.push(currentDateLine);
          currentDateLine = word;
        }
      }
      if (currentDateLine) dateLines.push(currentDateLine);

      // Draw the date lines
      dateLines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: currentY - index * lineHeight,
          size: fontSize,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      });

      // Draw event marker (circle on timeline), aligned with the first date line
      page.drawCircle({
        x: timelineX + 20,
        y: currentY + 5,
        size: 5,
        color: rgb(0, 0.2, 0.8),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Draw connector line from marker to event text, aligned with the first date line
      page.drawLine({
        start: { x: timelineX + 30, y: currentY + 5 },
        end: { x: timelineX + 50, y: currentY + 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Draw event title with word wrapping
      const eventWidth = width - timelineX - 60;
      const titleWords = event.event.split(' ');
      let titleLines = [];
      let currentTitleLine = '';
      for (const word of titleWords) {
        const testLine = currentTitleLine ? `${currentTitleLine} ${word}` : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= eventWidth) {
          currentTitleLine = testLine;
        } else {
          titleLines.push(currentTitleLine);
          currentTitleLine = word;
        }
      }
      if (currentTitleLine) titleLines.push(currentTitleLine);

      // Draw the event title
      titleLines.forEach((line, index) => {
        page.drawText(line, {
          x: timelineX + 60,
          y: currentY + 10 - index * lineHeight,
          size: fontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });

      // Adjust currentY for the title and date (use the maximum number of lines)
      const maxLines = Math.max(dateLines.length, titleLines.length);
      currentY -= (maxLines - 1) * lineHeight;

      // Draw event description with word wrapping (if provided)
      if (event.description) {
        // First split by newlines to handle explicit line breaks
        const descriptionParagraphs = event.description.split('\n');
        let descriptionLines = [];
        
        // Process each paragraph separately
        descriptionParagraphs.forEach((paragraph) => {
          if (paragraph.trim() === '') {
            // Add empty line for blank paragraphs
            descriptionLines.push('');
            return;
          }
          
          const descriptionWords = paragraph.split(' ');
          let currentDescriptionLine = '';
        
          for (const word of descriptionWords) {
          // Check if the word alone exceeds eventWidth
          const wordWidth = font.widthOfTextAtSize(word, fontSize - 2);
          if (wordWidth > eventWidth) {
            // Split long word into chunks that fit within eventWidth
            let remainingWord = word;
            while (remainingWord.length > 0) {
              let chunk = '';
              let chunkWidth = 0;
              // Build chunk character by character until it fits
              for (let i = 0; i < remainingWord.length; i++) {
                const testChunk = chunk + remainingWord[i];
                const testChunkWidth = font.widthOfTextAtSize(testChunk, fontSize - 2);
                if (testChunkWidth <= eventWidth) {
                  chunk = testChunk;
                  chunkWidth = testChunkWidth;
                } else {
                  break;
                }
              }
              // If chunk is empty (e.g., single character too wide), force at least one
              if (chunk === '' && remainingWord.length > 0) {
                chunk = remainingWord[0];
                remainingWord = remainingWord.slice(1);
              } else {
                remainingWord = remainingWord.slice(chunk.length);
              }
              // Add chunk to current line or as a new line
              const testLine = currentDescriptionLine ? `${currentDescriptionLine} ${chunk}` : chunk;
              const testWidth = font.widthOfTextAtSize(testLine, fontSize - 2);
              if (testWidth <= eventWidth && currentDescriptionLine !== '') {
                currentDescriptionLine = testLine;
              } else {
                if (currentDescriptionLine) descriptionLines.push(currentDescriptionLine);
                currentDescriptionLine = chunk;
              }
            }
          } else {
            // Normal word fits within eventWidth
            const testLine = currentDescriptionLine ? `${currentDescriptionLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize - 2);
            if (testWidth <= eventWidth) {
              currentDescriptionLine = testLine;
            } else {
              descriptionLines.push(currentDescriptionLine);
              currentDescriptionLine = word;
            }
          }
          }
          if (currentDescriptionLine) descriptionLines.push(currentDescriptionLine);
        });
      
        // Draw the event description
        const descriptionY = currentY - 5;
        descriptionLines.forEach((line, index) => {
          page.drawText(line, {
            x: timelineX + 50,
            y: descriptionY - index * lineHeight,
            size: fontSize - 2,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        });
      
        // Adjust currentY for the description
        currentY = descriptionY - descriptionLines.length * lineHeight;
      }

      // Add spacing after the event
      currentY -= 30;

      // Update timeline end Y-coordinate
      timelineEndY = currentY;

      // Check for page overflow (add new page if needed)
      if (currentY < margin + 100 && i < sortedEvents.length - 1) {
        // Draw timeline line for the current page
        page.drawLine({
          start: { x: timelineX + 20, y: timelineStartY },
          end: { x: timelineX + 20, y: margin },
          thickness: 2,
          color: rgb(0, 0.2, 0.8),
        });

        // Add new page
        page = pdfDoc.addPage([595, 842]);
        currentY = height - margin;
        timelineStartY = currentY; // Reset start for new page
      }
    }

    // Draw timeline line for the final page (fit to content)
    page.drawLine({
      start: { x: timelineX + 20, y: timelineStartY },
      end: { x: timelineX + 20, y: timelineEndY + 5 }, // Fit to last event
      thickness: 2,
      color: rgb(0, 0.2, 0.8),
    });

    // Generate QR code as a data URI
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${serverUrl}/#/status/${grievance_id}`;
    const qrCodeDataUri = await QRCode.toDataURL(url);

    // Embed QR code in the PDF (bottom-right corner of first page)
    const qrImage = await pdfDoc.embedPng(qrCodeDataUri);
    const firstPage = pdfDoc.getPages()[0];
    firstPage.drawImage(qrImage, {
      x: width - 120,
      y: margin,
      width: 70,
      height: 70,
    });

    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // Set headers for browser download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="grievance-timeline-${grievance_code}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);

    // Send the PDF bytes to the browser
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error generating timeline PDF:', error);
    res.status(500).send({ message: 'Unable to generate timeline PDF' });
  }
};
// const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
// const QRCode = require('qrcode');

exports.xgenerateTimelinePDF = async (req, res) => {
  try {
    // Get the form data and events array from the request body
    const { events = [], grievance_id, grievance_code, type, details = '', status = '', settlement = '' } = req.body;

    console.log('Enhanced PDF Request:', req.body);

    // Validate input
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).send({ message: 'Events array is required and cannot be empty' });
    }
    if (!grievance_code || !type) {
      return res.status(400).send({ message: 'grievance_code and type are required' });
    }

    // Sort events by date in descending order (latest first)
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Latest date first
    });

    // Calculate timeline statistics
    const timelineStats = calculateTimelineStats(sortedEvents);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 size in points (portrait)
    const { width, height } = page.getSize();

    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Enhanced styling constants
    const styles = {
      fontSize: {
        title: 18,
        header: 14,
        section: 13,
        body: 11,
        small: 9,
        caption: 8
      },
      colors: {
        primary: rgb(0, 0.2, 0.8),      // Government blue
        secondary: rgb(0.2, 0.6, 0.2),  // Success green
        warning: rgb(0.9, 0.6, 0),      // Warning orange
        danger: rgb(0.8, 0.2, 0.2),     // Danger red
        gray: rgb(0.4, 0.4, 0.4),       // Gray text
        lightGray: rgb(0.9, 0.9, 0.9),  // Light background
        black: rgb(0, 0, 0),
        white: rgb(1, 1, 1)
      },
      spacing: {
        margin: 40,
        padding: 15,
        lineHeight: 18,
        sectionGap: 25
      }
    };

    // Status color mapping
    const statusColors = {
      'Resolved': styles.colors.secondary,
      'Closed': styles.colors.gray,
      'Escalated': styles.colors.warning,
      'Referred': styles.colors.primary,
      'Under Review': styles.colors.primary,
      'In Court': styles.colors.danger,
      'Rejected': styles.colors.danger,
      'Reported': styles.colors.primary,
      'Open': styles.colors.primary
    };

    let currentY = height - styles.spacing.margin;

    // 1. ENHANCED HEADER WITH GOVERNMENT BRANDING
    currentY = await drawEnhancedHeader(page, pdfDoc, styles, currentY, width, boldFont, font);

    // 2. TITLE SECTION WITH GRIEVANCE INFO
    currentY = drawTitleSection(page, styles, currentY, width, grievance_code, status, boldFont, font);

    // 3. SUMMARY DASHBOARD
    currentY = drawSummaryDashboard(page, styles, currentY, width, timelineStats, boldFont, font);

    // 4. GRIEVANCE DETAILS SECTION
    if (details) {
      currentY = drawDetailsSection(page, styles, currentY, width, details, boldFont, font);
    }

    // 5. ENHANCED TIMELINE SECTION
    currentY = await drawEnhancedTimeline(page, pdfDoc, styles, currentY, width, height, sortedEvents, statusColors, boldFont, font, italicFont);

    // 6. FOOTER WITH MULTIPLE QR CODES
    await drawEnhancedFooter(page, pdfDoc, styles, width, height, grievance_id, grievance_code, req);

    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // Set headers for browser download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="enhanced-grievance-timeline-${grievance_code}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);

    // Send the PDF bytes to the browser
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error generating enhanced timeline PDF:', error);
    res.status(500).send({ message: 'Unable to generate enhanced timeline PDF' });
  }
};

// Helper function to calculate timeline statistics
function calculateTimelineStats(events) {
  const stats = {
    totalEvents: events.length,
    totalDuration: 0,
    averageStepTime: 0,
    officers: new Set(),
    statusChanges: {},
    slaCompliance: 'N/A'
  };

  if (events.length > 1) {
    const firstEvent = new Date(events[events.length - 1].date);
    const lastEvent = new Date(events[0].date);
    stats.totalDuration = Math.ceil((lastEvent - firstEvent) / (1000 * 60 * 60 * 24)); // Days
    stats.averageStepTime = Math.ceil(stats.totalDuration / (events.length - 1));
  }

  events.forEach(event => {
    if (event.description && event.description.includes('By: ')) {
      const officer = event.description.split('By: ')[1];
      if (officer) stats.officers.add(officer.trim());
    }
    
    if (event.event) {
      stats.statusChanges[event.event] = (stats.statusChanges[event.event] || 0) + 1;
    }
  });

  // Simple SLA compliance (assume 30 days is target)
  if (stats.totalDuration > 0) {
    stats.slaCompliance = stats.totalDuration <= 30 ? 'Compliant' : 'Exceeded';
  }

  return stats;
}

// Enhanced header with government branding
async function drawEnhancedHeader(page, pdfDoc, styles, currentY, width, boldFont, font) {
  // Remove header background for cleaner look

  // Try to load government logo - centered at top
  try {
    const logoPath = './public/gok.png';
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoWidth = 80;
    const logoHeight = 80;
    page.drawImage(logoImage, {
      x: (width - logoWidth) / 2, // Center horizontally
      y: currentY - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    currentY -= logoHeight + 20; // Adjust for logo height and spacing
  } catch (e) {
    console.warn('Failed to load logo:', e.message);
  }

  // Header text
  const headerLines = [
    'REPUBLIC OF KENYA',
    'MINISTRY OF LANDS, PUBLIC WORKS, HOUSING AND URBAN DEVELOPMENT',
    'GRIEVANCE REDRESS MECHANISM - TIMELINE REPORT'
  ];

  let headerY = currentY;
  headerLines.forEach((line, index) => {
    const fontSize = index === 0 ? styles.fontSize.header : (index === 1 ? styles.fontSize.body : styles.fontSize.section);
    const textWidth = boldFont.widthOfTextAtSize(line, fontSize);
    page.drawText(line, {
      x: (width - textWidth) / 2,
      y: headerY,
      size: fontSize,
      font: boldFont,
      color: styles.colors.black,
    });
    headerY -= styles.spacing.lineHeight;
  });

  return headerY - 20;
}

// Title section with grievance information
function drawTitleSection(page, styles, currentY, width, grievance_code, status, boldFont, font) {
  // Remove title background for cleaner look

  // Grievance code
  page.drawText(`Grievance Code: ${grievance_code}`, {
    x: styles.spacing.margin + styles.spacing.padding,
    y: currentY - 25,
    size: styles.fontSize.title,
    font: boldFont,
    color: styles.colors.black,
  });

  // Current status
  const statusText = `Current Status: ${status}`;
  const statusWidth = font.widthOfTextAtSize(statusText, styles.fontSize.body);
  page.drawText(statusText, {
    x: width - styles.spacing.margin - statusWidth - styles.spacing.padding,
    y: currentY - 25,
    size: styles.fontSize.body,
    font: font,
    color: styles.colors.gray,
  });

  // Report generation date
  const dateText = `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  page.drawText(dateText, {
    x: styles.spacing.margin + styles.spacing.padding,
    y: currentY - 40,
    size: styles.fontSize.small,
    font: font,
    color: styles.colors.gray,
  });

  return currentY - 70;
}

// Summary dashboard with key metrics
function drawSummaryDashboard(page, styles, currentY, width, stats, boldFont, font) {
  // Dashboard title
  page.drawText('Timeline Summary', {
    x: styles.spacing.margin,
    y: currentY,
    size: styles.fontSize.section,
    font: boldFont,
    color: styles.colors.black,
  });

  currentY -= 30;

  // Metrics in a grid layout
  const metrics = [
    { label: 'Total Events', value: stats.totalEvents },
    { label: 'Duration (Days)', value: stats.totalDuration || 'N/A' },
    { label: 'Officers Involved', value: stats.officers.size },
    { label: 'SLA Status', value: stats.slaCompliance }
  ];

  const boxWidth = (width - 2 * styles.spacing.margin - 30) / 2;
  const boxHeight = 35;

  metrics.forEach((metric, index) => {
    const x = styles.spacing.margin + (index % 2) * (boxWidth + 15);
    const y = currentY - Math.floor(index / 2) * (boxHeight + 10);

    // Remove metric box background for cleaner look

    // Metric label
    page.drawText(metric.label, {
      x: x + styles.spacing.padding,
      y: y - 15,
      size: styles.fontSize.small,
      font: font,
      color: styles.colors.gray,
    });

    // Metric value
    page.drawText(String(metric.value), {
      x: x + styles.spacing.padding,
      y: y - 30,
      size: styles.fontSize.header,
      font: boldFont,
      color: styles.colors.primary,
    });
  });

  return currentY - 90;
}

// Details section
function drawDetailsSection(page, styles, currentY, width, details, boldFont, font) {
  page.drawText('Grievance Description', {
    x: styles.spacing.margin,
    y: currentY,
    size: styles.fontSize.section,
    font: boldFont,
    color: styles.colors.black,
  });

  currentY -= 25;

  // Word wrap for description
  const maxWidth = width - 2 * styles.spacing.margin;
  const words = details.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, styles.fontSize.body);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);

  lines.forEach(line => {
    page.drawText(line, {
      x: styles.spacing.margin,
      y: currentY,
      size: styles.fontSize.body,
      font: font,
      color: styles.colors.black,
    });
    currentY -= styles.spacing.lineHeight;
  });

  return currentY - styles.spacing.sectionGap;
}

// Enhanced timeline with improved visuals
async function drawEnhancedTimeline(page, pdfDoc, styles, currentY, width, height, events, statusColors, boldFont, font, italicFont) {
  // Timeline title
  page.drawText('Timeline of Events', {
    x: styles.spacing.margin,
    y: currentY,
    size: styles.fontSize.section,
    font: boldFont,
    color: styles.colors.black,
  });

  currentY -= 35;
  const timelineX = styles.spacing.margin + 80;
  let timelineStartY = currentY;

  events.forEach((event, index) => {
    const isLast = index === events.length - 1;
    
    // Check if we need a new page
    if (currentY < 150 && !isLast) {
      // Draw timeline line to bottom of page
      page.drawLine({
        start: { x: timelineX, y: timelineStartY },
        end: { x: timelineX, y: 50 },
        thickness: 3,
        color: styles.colors.primary,
      });

      // Add new page
      page = pdfDoc.addPage([595, 842]);
      currentY = height - styles.spacing.margin;
      timelineStartY = currentY;
    }

    // Format date - compact format (date only, no time)
    const dateObj = new Date(event.date);
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Date text - single line format
    page.drawText(formattedDate, {
      x: styles.spacing.margin,
      y: currentY - 10,
      size: styles.fontSize.small,
      font: font,
      color: styles.colors.black,
    });

    // Status indicator (colored circle)
    const statusColor = statusColors[event.event] || styles.colors.gray;
    page.drawCircle({
      x: timelineX,
      y: currentY - 5,
      size: 8,
      color: statusColor,
      borderColor: styles.colors.black,
      borderWidth: 1,
    });

    // Connector line
    page.drawLine({
      start: { x: timelineX + 12, y: currentY - 5 },
      end: { x: timelineX + 25, y: currentY - 5 },
      thickness: 2,
      color: styles.colors.gray,
    });

    // Event title with colored text (no background)
    page.drawText(event.event, {
      x: timelineX + 30,
      y: currentY - 8,
      size: styles.fontSize.body,
      font: boldFont,
      color: statusColor,
    });

    // Process description with newlines
    if (event.description) {
      const descriptionY = currentY - 25;
      const maxDescWidth = width - timelineX - 50;
      
      // Split by newlines first
      const paragraphs = event.description.split('\n');
      let descCurrentY = descriptionY;
      
      paragraphs.forEach((paragraph) => {
        if (paragraph.trim() === '') {
          descCurrentY -= styles.spacing.lineHeight;
          return;
        }
        
        // Word wrap within paragraph
        const words = paragraph.split(' ');
        let lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, styles.fontSize.small);
          if (testWidth <= maxDescWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) lines.push(currentLine);
        
        // Draw the lines
        lines.forEach(line => {
          const fontToUse = line.startsWith('By:') ? italicFont : font;
          const colorToUse = line.startsWith('By:') ? styles.colors.primary : styles.colors.black;
          
          page.drawText(line, {
            x: timelineX + 30,
            y: descCurrentY,
            size: styles.fontSize.small,
            font: fontToUse,
            color: colorToUse,
          });
          descCurrentY -= styles.spacing.lineHeight;
        });
        
        descCurrentY -= 5; // Extra space between paragraphs
      });
      
      currentY = Math.min(currentY - 60, descCurrentY - 10);
    } else {
      currentY -= 40;
    }

    // Duration since last event (if not first)
    if (index > 0) {
      const prevDate = new Date(events[index - 1].date);
      const currentDate = new Date(event.date);
      const daysDiff = Math.abs(Math.ceil((prevDate - currentDate) / (1000 * 60 * 60 * 24)));
      
      if (daysDiff > 0) {
        page.drawText(`${daysDiff} day${daysDiff !== 1 ? 's' : ''} later`, {
          x: timelineX - 30,
          y: currentY + 20,
          size: styles.fontSize.caption,
          font: italicFont,
          color: styles.colors.gray,
        });
      }
    }

    currentY -= styles.spacing.sectionGap;
  });

  // Draw final timeline line
  page.drawLine({
    start: { x: timelineX, y: timelineStartY },
    end: { x: timelineX, y: currentY + styles.spacing.sectionGap },
    thickness: 3,
    color: styles.colors.primary,
  });

  return currentY;
}

// Enhanced footer with multiple QR codes
async function drawEnhancedFooter(page, pdfDoc, styles, width, height, grievance_id, grievance_code, req) {
  const footerY = 80;
  
  // Load font for text in footer (needed throughout the function)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Remove footer background for cleaner look

  try {
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    
    // Single QR Code for status check
    const statusUrl = `${serverUrl}/#/status/${grievance_code}`;
    const statusQR = await QRCode.toDataURL(statusUrl);
    const statusQRImage = await pdfDoc.embedPng(statusQR);
    
    page.drawImage(statusQRImage, {
      x: width - 70, // Position on the right side
      y: 20,
      width: 50,
      height: 50,
    });
    
    page.drawText('Check Status', {
      x: width - 70,
      y: 15,
      size: styles.fontSize.caption,
      font: font,
      color: styles.colors.black,
    });

  } catch (error) {
    console.warn('Failed to generate QR code:', error.message);
  }

  // Legal disclaimer
  const disclaimer = 'This is an official document generated by the Ministry of Lands, Public Works, Housing and Urban Development. ' +
                    'For inquiries, contact the grievance redress unit.';
  
  const disclaimerX = styles.spacing.margin;
  const maxDisclaimerWidth = width - disclaimerX - 100; // Leave space for QR code
  
  // Word wrap disclaimer
  const words = disclaimer.split(' ');
  let lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, styles.fontSize.caption);
    if (testWidth <= maxDisclaimerWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: disclaimerX,
      y: 55 - (index * 10),
      size: styles.fontSize.caption,
      font: font,
      color: styles.colors.gray,
    });
  });
  
  // Document reference
  page.drawText(`Document Ref: GRM-${grievance_code}-${new Date().getFullYear()}`, {
    x: width - 150,
    y: 25,
    size: styles.fontSize.caption,
    font: font,
    color: styles.colors.gray,
  });
}
