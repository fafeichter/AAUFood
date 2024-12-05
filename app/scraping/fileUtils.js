"use strict";

const fs = require('fs');
const pdf2pic = require('pdf2pic');

async function pdf2Base64Image(pdfUrl, restaurantId) {
    let downloadDirectory = `/tmp`;

    let pdfFilePath = `${downloadDirectory}/${restaurantId}.pdf`;
    let jpegFilePath = `${downloadDirectory}/${restaurantId}.1.jpeg`;

    let deleteExistingFileOptions = {
        force: true,
    };

    fs.rmSync(pdfFilePath, deleteExistingFileOptions);
    fs.rmSync(jpegFilePath, deleteExistingFileOptions);

    const pdfBuffer = await fetch(pdfUrl)
        .then(pdfResponse => pdfResponse.arrayBuffer());

    fs.writeFileSync(pdfFilePath, Buffer.from(pdfBuffer), 'binary');

    const pdf2JpegOptions = {
        density: 600,
        saveFilename: restaurantId,
        savePath: downloadDirectory,
        format: "jpeg",
        preserveAspectRatio: true,
        height: 2500,
        compression: 'jpeg'
    };
    await pdf2pic.fromPath(pdfFilePath, pdf2JpegOptions)(1, {responseType: "image"})

    return fs.readFileSync(jpegFilePath, 'base64');
}

module.exports = {
    pdf2Base64Image,
};