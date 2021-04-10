
import {configs as conf} from '../configs'
import * as fs         from 'fs'
import * as SendGrid   from '@sendgrid/mail'


SendGrid.setApiKey(conf.sendgrid.api_key);


// send validation code via email
export function sendValidationUrl(name : string, email : string, url :string) {
    // send the email with validation code


    const msgMail = fs.readFileSync('./messages/email_validation_code.txt', 'utf-8')
        .replace(/##real_name##/g,      name)
        .replace(/##validationUrl##/g,  url)
        .replace(/##botAdminName##/g,   conf.botAdmin.name)
        .replace(/##botAdminEmail##/g,  conf.botAdmin.email);

    console.log (`message sent : ${msgMail}`);

    const msg = {
        from:    `MensaBot <mensabot@wulfman.fr>`,
        to:      email,
        subject: 'Votre code de confirmation MensaBot Discord',
        text:    msgMail
    };
    SendGrid.send(msg)
        .then((res) => {
            console.log(`Email sent : ${res}`)
        })
}