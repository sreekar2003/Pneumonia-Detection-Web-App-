const e = require("express")

const report = document.querySelector('form')
const email = document.querySelector('input')
const print = document.querySelector('input')

report.addEventListener('submit', (e) => {
    const Email = email.value
    const pdfName = print.value
    console.log(Email, '\n' , pdfName)

})

$('#email_report').on('change' , function(){
    if( $(this).val() == "yes") {
        $('#email').show()
        }
        else{
            $('#email').hide()
        }
    });