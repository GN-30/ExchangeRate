const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendAlertEmail = async (userEmail, userName, alertDetails) => {
    const { currency, targetRate, currentRate, condition } = alertDetails;
    
    const mailOptions = {
        from: '"ExchangeRate Alerts" <' + process.env.EMAIL_USER + '>',
        to: userEmail,
        subject: `Currency Alert: ${currency} reached ${currentRate}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Exchange Rate Alert Triggered!</h2>
                <p>Hello ${userName},</p>
                <p>An alert you set for <strong>${currency}</strong> has been triggered.</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
                    <p><strong>Target Condition:</strong> ${condition} ${targetRate}</p>
                    <p><strong>Current Rate:</strong> ${currentRate}</p>
                </div>
                <p>Check the latest rates and manage your alerts on our platform.</p>
                <br>
                <footer style="font-size: 0.8em; color: #777;">
                    This is an automated message. Please do not reply to this email.
                </footer>
            </div>
        `
    };

    console.log(`Attempting to send mail to: ${userEmail}`);
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Alert email sent to ${userEmail}`);
    } catch (error) {
        console.error('Error sending alert email:', error.message);
    }
};

module.exports = { sendAlertEmail };
