import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Fallback to nodemailer for development
const createNodemailerTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const fromEmail = options.from || process.env.FROM_EMAIL || 'noreply@deathmatters.com';
  
  try {
    // Try SendGrid first if available
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: options.to,
        from: fromEmail,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      });
      console.log(`Email sent successfully to ${options.to} via SendGrid`);
      return true;
    }
    
    // Fallback to nodemailer
    const transporter = createNodemailerTransporter();
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
    console.log(`Email sent successfully to ${options.to} via Nodemailer`);
    return true;
    
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  collaborationInvite: (collaboratorName: string, inviterName: string, obituaryTitle: string, collaborationLink: string) => ({
    subject: `You've been invited to collaborate on ${obituaryTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Collaboration Invitation</h2>
        <p>Hello ${collaboratorName},</p>
        <p>${inviterName} has invited you to collaborate on an obituary for <strong>${obituaryTitle}</strong>.</p>
        <p>You can provide feedback and suggestions by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${collaborationLink}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            View & Collaborate
          </a>
        </div>
        <p>This link will allow you to:</p>
        <ul>
          <li>Read the obituary drafts</li>
          <li>Highlight text you like or want changed</li>
          <li>Provide feedback for revisions</li>
        </ul>
        <p>Thank you for helping create a meaningful tribute.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This invitation was sent from DeathMatters - AI-Powered Obituary Platform
        </p>
      </div>
    `
  }),

  finalSpaceInvite: (collaboratorName: string, inviterName: string, memorialTitle: string, collaborationLink: string) => ({
    subject: `You've been invited to collaborate on ${memorialTitle} Memorial`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Memorial Collaboration Invitation</h2>
        <p>Hello ${collaboratorName},</p>
        <p>${inviterName} has invited you to collaborate on a memorial space for <strong>${memorialTitle}</strong>.</p>
        <p>You can contribute memories, photos, and messages by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${collaborationLink}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Visit Memorial & Collaborate
          </a>
        </div>
        <p>This memorial space allows you to:</p>
        <ul>
          <li>Share memories and condolences</li>
          <li>Upload photos and audio tributes</li>
          <li>View and contribute to the memorial content</li>
        </ul>
        <p>Thank you for helping honor their memory.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This invitation was sent from DeathMatters - AI-Powered Memorial Platform
        </p>
      </div>
    `
  }),

  evaluationReminder: (recipientName: string, evaluationLink: string) => ({
    subject: 'Complete Your Pre-Need Evaluation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Pre-Need Evaluation Reminder</h2>
        <p>Hello ${recipientName},</p>
        <p>This is a friendly reminder to complete your Pre-Need Evaluation.</p>
        <p>Taking a few minutes to complete this assessment will help ensure your wishes are known and respected.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${evaluationLink}" 
             style="background-color: #6c757d; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Complete Evaluation
          </a>
        </div>
        <p>The evaluation covers important topics such as:</p>
        <ul>
          <li>Personal and family information</li>
          <li>Service preferences</li>
          <li>Special requests and considerations</li>
        </ul>
        <p>Thank you for taking the time to plan ahead.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This reminder was sent from DeathMatters - Pre-Need Planning Platform
        </p>
      </div>
    `
  })
};