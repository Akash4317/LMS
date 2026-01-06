import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';



class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async sendEmail(options) {
        try {
            const mailOptions = {
                from: `"LMS Platform" <${process.env.EMAIL_USER}>`,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments,
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error('Email sending failed:', error);
            return false;
        }
    }

    // Welcome email
    async sendWelcomeEmail(to, name, tempPassword) {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .credentials { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to LMS Platform! 🎓</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>Welcome to our Learning Management System! We're excited to have you on board.</p>
              
              ${tempPassword ? `
                <div class="credentials">
                  <h3>Your Login Credentials</h3>
                  <p><strong>Email:</strong> ${to}</p>
                  <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                  <p style="color: #e53e3e; font-size: 14px;">⚠️ Please change your password after first login.</p>
                </div>
              ` : ''}
              
              <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Best regards,<br>The LMS Team</p>
            </div>
            <div class="footer">
              <p>© 2025 LMS Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to,
            subject: 'Welcome to LMS Platform',
            html,
        });
    }

    // Assignment notification
    async sendAssignmentNotification(
        to,
        studentName,
        courseName,
        assignmentTitle,
        dueDate
    ) {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4299e1; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .assignment-box { background: white; padding: 20px; border-left: 4px solid #4299e1; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .due-date { color: #e53e3e; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 New Assignment Posted</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${studentName}</strong>,</p>
              <p>A new assignment has been posted in <strong>${courseName}</strong>.</p>
              
              <div class="assignment-box">
                <h3>${assignmentTitle}</h3>
                <p>Due Date: <span class="due-date">${dueDate.toLocaleDateString()}</span></p>
              </div>
              
              <a href="${process.env.FRONTEND_URL}/courses/assignments" class="button">View Assignment</a>
              
              <p>Don't forget to submit before the deadline!</p>
              
              <p>Good luck!<br>The LMS Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to,
            subject: `New Assignment: ${assignmentTitle}`,
            html,
        });
    }

    // Live class reminder
    async sendLiveClassReminder(
        to,
        userName,
        classTitle,
        scheduledAt,
        meetingLink
    ) {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #48bb78; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .class-info { background: white; padding: 20px; border-left: 4px solid #48bb78; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #48bb78; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .time { font-size: 24px; color: #48bb78; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎥 Live Class Reminder</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Your live class is starting soon!</p>
              
              <div class="class-info">
                <h3>${classTitle}</h3>
                <p class="time">${scheduledAt.toLocaleString()}</p>
              </div>
              
              <a href="${meetingLink}" class="button">Join Live Class</a>
              
              <p>Please join a few minutes early to test your audio and video.</p>
              
              <p>See you in class!<br>The LMS Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to,
            subject: `Reminder: ${classTitle} starts soon`,
            html,
        });
    }

    // Grade notification
    async sendGradeNotification(
        to,
        studentName,
        assignmentTitle,
        marks,
        maxMarks,
        feedback
    ) {
        const percentage = (marks / maxMarks) * 100;
        const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'D';

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #9f7aea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .grade-box { background: white; padding: 20px; border-left: 4px solid #9f7aea; margin: 20px 0; text-align: center; }
            .grade { font-size: 48px; color: #9f7aea; font-weight: bold; }
            .marks { font-size: 24px; margin: 10px 0; }
            .feedback { background: #faf5ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #9f7aea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Assignment Graded</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${studentName}</strong>,</p>
              <p>Your assignment <strong>"${assignmentTitle}"</strong> has been graded.</p>
              
              <div class="grade-box">
                <div class="grade">${grade}</div>
                <div class="marks">${marks} / ${maxMarks}</div>
                <p>${percentage.toFixed(1)}%</p>
              </div>
              
              ${feedback ? `
                <div class="feedback">
                  <h4>Teacher's Feedback:</h4>
                  <p>${feedback}</p>
                </div>
              ` : ''}
              
              <a href="${process.env.FRONTEND_URL}/assignments" class="button">View Details</a>
              
              <p>Keep up the great work!</p>
              
              <p>Best regards,<br>The LMS Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to,
            subject: `Assignment Graded: ${assignmentTitle}`,
            html,
        });
    }
}

export default new EmailService();