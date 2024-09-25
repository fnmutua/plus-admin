const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');

exports.generatePDF = async (req, res) => {
  try {
    // Get the form data from the request body
    const formData = req.body;

    // Read the PDF form template from the /data/forms directory
    const formPath = path.join('/data/forms', `${formData.type}.pdf`);
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

    // Save the modified PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // Generate a random UUID for the file name
    const uniqueFilename = `${shortid.generate()}.pdf`;

    // Define the upload path
    const uploadPath = path.join('/data/uploads', uniqueFilename);

    // Save the PDF to the /data/uploads directory
    fs.writeFileSync(uploadPath, pdfBytes);

    console.log(`PDF saved successfully at ${uploadPath}`);

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
