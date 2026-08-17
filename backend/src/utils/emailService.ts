import nodemailer from 'nodemailer';

// Configure transport (Use Mailtrap, Ethereal, or real SMTP)
// For MVP, we will use Ethereal which generates mock emails,
// or simple console logs if no config is provided.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER || 'test@ethereal.email', // Replace with real auth if available
    pass: process.env.SMTP_PASS || 'password',
  },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"TTU Attachment Portal" <noreply@ttu-portal.edu>',
      to,
      subject,
      text,
      html,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    
    // If using Ethereal, log the preview URL
    if (process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
