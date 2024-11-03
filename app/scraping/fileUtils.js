"use strict";

const fs = require('fs');
const os = require('os');
const pdf2pic = require('pdf2pic');
const Promise = require('bluebird');
const exec = Promise.promisify(require("child_process").exec);
const {restaurants} = require("../config");

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

    // Mensa's PDF has a newline character at the start, which results in a corrupted JPEG → remove it
    if (restaurantId === restaurants.mensa.id) {
        // Determine the appropriate sed command based on the operating system
        let command;
        if (os.platform() === 'darwin') {
            // macOS uses an empty string for in-place editing
            command = `sed -i '' '1d' ${pdfFilePath}`;
        } else {
            // Unix/Linux uses sed with -i without an empty string
            command = `sed -i '1d' ${pdfFilePath}`;
        }

        // Execute the command to remove the first line from the PDF
        await exec(command);
    }

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