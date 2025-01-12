"use strict";

const fs = require('fs');
const path = require('path');
const pdf2pic = require('pdf2pic');
const sharp = require("sharp");
const PdfCounter = require("page-count").PdfCounter;

async function pdf2Base64Image(pdfUrl, restaurantId) {
    const downloadDirectory = '/tmp';
    const pdfFilePath = `${downloadDirectory}/${restaurantId}.pdf`;

    // Fetch PDF from URL and save it locally
    await fetch(pdfUrl)
        .then(res => res.arrayBuffer())
        .then(pdfFile => {
            const pdfBuffer = Buffer.from(pdfFile);

            // Check if the file is a valid PDF
            if (pdfBuffer.indexOf("%PDF") !== 0) {
                throw new Error(`Restaurant with id "${restaurantId}" has no valid PDF`);
            }

            fs.writeFileSync(pdfFilePath, pdfBuffer, 'binary')
        });

    // Convert PDF to JPEG images
    const pdfBuffer = fs.readFileSync(pdfFilePath);
    const totalPages = await PdfCounter.count(pdfBuffer);
    const pageImages = await convertPdfToImages(pdfFilePath, restaurantId, totalPages);

    // Combine images if more than one page
    if (totalPages > 1) {
        const combinedImageBuffer = await combineImages(pageImages);
        let jpegFileCombined = `${downloadDirectory}/${restaurantId}.jpeg`;
        await sharp(combinedImageBuffer).toFile(jpegFileCombined);
        pageImages.push(jpegFileCombined);
    }

    // Encode JPEG to base64
    const imagePath = totalPages === 1 ? pageImages[0] : pageImages[pageImages.length - 1];
    const base64Image = await fs.promises.readFile(imagePath, 'base64');

    // Clean up temporary files
    await deleteFiles([pdfFilePath, ...pageImages]);

    return base64Image;
}

// Helper function to convert PDF to images
async function convertPdfToImages(pdfFilePath, restaurantId, totalPages) {
    const pdf2JpegOptions = {
        density: 600,
        saveFilename: restaurantId,
        savePath: path.dirname(pdfFilePath),
        format: "jpeg",
        preserveAspectRatio: true,
        height: 2500,
        compression: 'jpeg'
    };

    const converted = await pdf2pic.fromPath(pdfFilePath, pdf2JpegOptions);
    const pageImages = [];

    for (let i = 1; i <= totalPages; i++) {
        const page = await converted(i, {responseType: "image"});
        pageImages.push(page.path);
    }

    return pageImages;
}

// Function to delete files
async function deleteFiles(filesToDelete) {
    for (const fileToDelete of filesToDelete) {
        await fs.promises.unlink(fileToDelete);
    }
}

// Combine multiple images into one vertical stack
async function combineImages(imagePaths) {
    const imageBuffers = await Promise.all(imagePaths.map(path => sharp(path).toBuffer()));
    const metadataArray = await Promise.all(imageBuffers.map(buffer => sharp(buffer).metadata()));

    const width = Math.max(...metadataArray.map(metadata => metadata.width));
    const totalHeight = metadataArray.reduce((sum, metadata) => sum + metadata.height, 0);

    return await sharp({
        create: {
            width,
            height: totalHeight,
            channels: 3,
            background: {r: 255, g: 255, b: 255} // White background
        }
    })
        .composite(
            imageBuffers.map((buffer, index) => ({
                input: buffer,
                top: metadataArray.slice(0, index).reduce((height, metadata) => height + metadata.height, 0),
                left: 0
            }))
        )
        .jpeg()
        .toBuffer();
}

module.exports = {
    pdf2Base64Image,
};