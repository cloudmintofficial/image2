const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('/Users/surya/image2/Order Maintenance.pdf');
pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('pdf_text.txt', data.text);
    console.log('Extracted text size:', data.text.length);
}).catch(e => console.error(e));
