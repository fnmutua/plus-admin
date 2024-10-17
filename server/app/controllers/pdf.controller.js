const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const QRCode = require('qrcode')
const db = require('../models')
const Sequelize = require('sequelize')


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

    
    // Generate a random UUID for the file name
    const uniqueFilename = `${shortid.generate()}.pdf`;

    // Define the upload path
    const uploadPath = path.join('/data/grievances', uniqueFilename);

  
    // Save the PDF to the /data/uploads directory
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
