
import {configs as conf} from '../configs'
import * as fs         from 'fs'
import * as nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: conf.smtp.host,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: conf.smtp.user,
        pass: conf.smtp.password
    }
});

// send validation code via email
export function sendValidationUrl(name : string, email : string, url :string) {
    // send the email with validation code

    const msgMail = fs.readFileSync('./messages/email_validation_code.txt', 'utf-8')
        .replace(/##real_name##/g,      name)
        .replace(/##validationUrl##/g,  url)
        .replace(/##botAdminName##/g,   conf.botAdmin.name)
        .replace(/##botAdminEmail##/g,  conf.botAdmin.email);

    const mailOptions = {
        from:    'MensaBot <' + conf.botAdmin.email + '>',
        to:      email,
        subject: 'Votre code de confirmation MensaBot Discord',
        text:    msgMail
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            throw Error ();
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}