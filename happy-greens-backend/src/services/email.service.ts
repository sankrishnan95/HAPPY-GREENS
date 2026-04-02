import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, message: string) => {
    // If SMTP credentials are provided, use them. Otherwise, mock the email payload to the console.
    const hasCredentials = process.env.SMTP_HOST && process.env.SMTP_USER;
    const fromAddress = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER;

    if (hasCredentials) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: `"Happy Greens" <${fromAddress}>`,
                to,
                subject,
                text: message,
            });
            console.log(`[Email Service] Sent genuine email to ${to}`);
            return true;
        } catch (error) {
            console.error('[Email Service] Error sending email:', error);
            throw new Error('Failed to send email');
        }
    } else {
        // MOCKED EMAIL FOR DEVELOPMENT
        console.log('\n======================================================');
        console.log(`[Email Service - MOCKED] Sending an email to: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`MESSAGE:\n${message}`);
        console.log('======================================================\n');
        return true;
    }
};
