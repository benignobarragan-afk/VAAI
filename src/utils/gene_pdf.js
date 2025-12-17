const PDFDocument = require("pdfkit-table")
const fs = require('fs');

const gene_pdf = (async (ruta) => {

    // Create a document
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(ruta));

    return doc

});


module.exports = {
    gene_pdf
}


