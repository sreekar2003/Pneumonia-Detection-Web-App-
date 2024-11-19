const PDFDocument = require('pdfkit');
const fs = require('fs');
const dateTime = require('node-datetime');
const path = require('path');

function generateReport({ first_name, last_name, gender, age } = {}, prediction, stage = null) {
    var dateAndTime = dateTime.create();
    var date = dateAndTime.format('d-m-Y');
    var time = dateAndTime.format('H:M:S');
    const pdfName = `${first_name}_${last_name}_X-Ray.pdf`;
    const pdfPath = path.join(__dirname, '../public/Reports', pdfName);
    
    const doc = new PDFDocument({ autoFirstPage: false });

    // Set up a new page
    doc.addPage({ margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));

    // Header
    doc.fontSize(35).text('Gujju Diagnostic Centre', 100, 80, { align: 'center' });
    doc.fontSize(13).text('Digital X-Ray', { align: 'center' });
    doc.fontSize(10).text('------------------------------------------------------------------------------------------------------------------------------------');
    doc.moveDown(2);

    // Patient Information
    doc.fontSize(18).text('Patient Information', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(13).list([`Patient Name : ${first_name} ${last_name}`, `Age : ${age}`, `Gender : ${gender}`, `Study Date : ${date}`, `Study Time : ${time}`], {
        align: 'left',
        bulletRadius: 2
    });
    doc.moveDown(1);
    doc.fontSize(10).text('------------------------------------------------------------------------------------------------------------------------------------');
    doc.moveDown(2);

    // Diagnosis Information
    doc.fontSize(18).text('Diagnosis Of Pneumonia', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(13).text('Technique Used : Detection using Deep Learning on chest X-Ray.');
    doc.moveDown(1);
    
    // Diagnosis Result
    if (prediction && prediction.trim() !== '') {
        doc.fontSize(13).text(`Diagnosis Result : ${prediction}`);
        
        // Include Pneumonia Stage if detected
        if (stage && prediction === 'PNEUMONIA IS DETECTED.') {
            doc.moveDown(1);
            doc.fontSize(13).text(`Pneumonia Stage : ${stage}`);
            
            // Stage-based treatment recommendations
            if (stage === "Stage 1 (Mild)") {
                doc.moveDown(1);
                doc.fontSize(13).text('Mild Pneumonia Recommendations:');
                doc.fontSize(11).list([
                    'Hydration: Drink fluids, mainly water, to thin mucus and clear it from the lungs.',
                    'Resting: Get plenty of rest.',
                    'Antibiotics or antiviral medication as instructed by the doctor.',
                    'Avoid smoking to prevent lung irritation.',
                    'Use a humidifier to reduce throat irritation.',
                    'Avoid crowded places.',
                    'Boost your immune system with healthy food intake.'
                ]);
            } else if (stage === "Stage 2 (Moderate)") {
                doc.moveDown(1);
                doc.fontSize(13).text('Moderate Pneumonia Recommendations:');
                doc.fontSize(11).list([
                    'Frequent checkups.',
                    'Take prescribed antibiotics regularly.',
                    'Oxygen therapy to monitor oxygen levels.',
                    'Avoid physical activities.',
                    'Sleep with an elevated head.',
                    'Maintain good hygiene.',
                    'Monitor for breathing difficulties and chest pain.'
                ]);
            } else if (stage === "Stage 3 (Severe)") {
                doc.moveDown(1);
                doc.fontSize(13).text('Severe Pneumonia Recommendations:');
                doc.fontSize(11).list([
                    'Seek immediate medical attention for close monitoring.',
                    'May require ventilator support or oxygen therapy.',
                    'Continuous monitoring of heart rate, oxygen levels, and respiratory functions.',
                    'Proper fluid management to avoid overhydration or dehydration.',
                    'Stay in an isolated place to avoid spreading the infection.',
                    'Consume a protein-rich diet to aid recovery.'
                ]);
            }
        }
    } else {
        doc.fontSize(13).text('Diagnosis Result : Prediction not available.');
    }
    
    doc.moveDown(1);

    // Signature section (positioned above the footer)
    const signPath = path.join(__dirname, '../public/img/sign.jpeg');
    if (fs.existsSync(signPath)) {
        doc.image(signPath, 440, 600, { fit: [100, 100], align: "center" });
    } else {
        console.log('Signature image not found. Skipping.');
    }

    doc.moveDown(0.3);
    doc.fontSize(13).text('Dr. Doctors Name', 435, 680);
    
    // Footer (Address and Contact Info) positioned near the bottom
    doc.moveDown(2);
    doc.fontSize(10).text('------------------------------------------------------------------------------------------------------------------------------------', 100);
    doc.moveDown(1);
    doc.fontSize(13).text('Our Address : Kalasalingam Academy of Research and Education - 626162', { align: 'center' });
    doc.fontSize(13).text('Call us : 9999999999 , 8888888888', { align: 'center' });

    doc.end();
}

module.exports = { generateReport };