const express = require('express');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path  = require('path');

function sendEmail(pdfName , email) {
    const pathToAttachment = path.join(__dirname , '../public/Reports' , pdfName);
    const API_KEY = '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';
    sgMail.setApiKey(API_KEY)

    fs.readFile((pathToAttachment), (err, data) => {
        if (err) {
          console.log('we have error...\n\n');
          console.log(err)
        }
        if (data) {
          const msg = {
            to: `${email}`,
            from: 'kanjal.ysk123@gmail.com',
            subject: 'Pneumonia Report.',
            html: '<p>Your Pneumonia Report.</p>',
            attachments: [
              {
                content: data.toString('base64'),
                filename: 'Pneumonia_Report.pdf',
                type: 'application/pdf',
                disposition: 'attachment',
                content_id: 'mytext',
              },
            ],
          };
          sgMail.send(msg);
        }
      });
}

module.exports = { sendEmail };