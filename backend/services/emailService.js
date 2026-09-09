
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify SMTP configuration when the server starts
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP configuration error:');
        console.error(error);
    } else {
        console.log('✅ SMTP server is ready to send emails');
    }
});

const sendAlertEmail = async (userEmail, userName, alertDetails) => {

    const {
        currency,
        targetRate,
        currentRate,
        condition
    } = alertDetails;

    const mailOptions = {
        from: `"ExchangeRate Alerts" < ${process.env.EMAIL_USER}> `,
        to: userEmail,
        subject: `Currency Alert: ${currency} reached ${currentRate} `,

        html: `
    < div style = "
font - family: Arial, sans - serif;
line - height: 1.6;
color: #333;
max - width: 600px;
margin: auto;
">

    < h2 > Exchange Rate Alert Triggered!</h2 >

                <p>Hello ${userName},</p>

                <p>
                    An alert you set for
                    <strong>${currency}</strong>
                    has been triggered.
                </p>

                <div style="
                    background: #f4f4f4;
                    padding: 15px;
                    border-radius: 8px;
                ">

                    <p>
                        <strong>Target Condition:</strong>
                        ${condition} ${targetRate}
                    </p>

                    <p>
                        <strong>Current Rate:</strong>
                        ${currentRate}
                    </p>

                </div>

                <p>
                    Check the latest rates and manage your alerts
                    on our platform.
                </p>

                <br>

                <footer style="
                    font-size: 0.8em;
                    color: #777;
                ">
                    This is an automated message.
                    Please do not reply to this email.
                </footer>

            </div>
`
    };

    console.log(`📧 Attempting to send mail to: ${userEmail} `);

    try {

        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email accepted by SMTP server');
        console.log('Message ID:', info.messageId);
        console.log('Accepted:', info.accepted);
        console.log('Rejected:', info.rejected);
        console.log('SMTP Response:', info.response);

        // Make sure the recipient was actually accepted
        if (
            !info.accepted ||
            !info.accepted.includes(userEmail)
        ) {
            throw new Error(
                `Email was not accepted for recipient: ${userEmail} `
            );
        }

        console.log(`✅ Alert email successfully sent to ${userEmail} `);

        return {
            success: true,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        };

    } catch (error) {

        console.error('❌ ERROR SENDING ALERT EMAIL');
        console.error('Recipient:', userEmail);
        console.error('Error:', error.message);

        // IMPORTANT:
        // Pass the error back to alertWorker.js
        // so it does NOT deactivate the alert.
        throw error;
    }
};

module.exports = {
    sendAlertEmail
};

