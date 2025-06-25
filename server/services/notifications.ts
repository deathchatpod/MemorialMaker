import { sendEmail, emailTemplates } from './email';
import { storage } from '../storage';

export class NotificationService {
  
  /**
   * Send collaboration invitation for obituary
   */
  static async sendObituaryCollaborationInvite(
    obituaryId: number,
    collaboratorEmail: string,
    collaboratorName: string,
    inviterName: string
  ): Promise<boolean> {
    try {
      const obituary = await storage.getObituary(obituaryId);
      if (!obituary) {
        console.error('Obituary not found for collaboration invite');
        return false;
      }

      const collaborationLink = `${process.env.BASE_URL || 'http://localhost:5000'}/collaborate/${obituaryId}`;
      const template = emailTemplates.collaborationInvite(
        collaboratorName,
        inviterName,
        obituary.fullName,
        collaborationLink
      );

      return await sendEmail({
        to: collaboratorEmail,
        subject: template.subject,
        html: template.html
      });
    } catch (error) {
      console.error('Failed to send obituary collaboration invite:', error);
      return false;
    }
  }

  /**
   * Send collaboration invitation for final space
   */
  static async sendFinalSpaceCollaborationInvite(
    finalSpaceId: number,
    collaboratorEmail: string,
    collaboratorName: string,
    inviterName: string
  ): Promise<boolean> {
    try {
      const finalSpace = await storage.getFinalSpace(finalSpaceId);
      if (!finalSpace) {
        console.error('Final space not found for collaboration invite');
        return false;
      }

      const collaborationLink = `${process.env.BASE_URL || 'http://localhost:5000'}/memorial/${finalSpace.slug}`;
      const template = emailTemplates.finalSpaceInvite(
        collaboratorName,
        inviterName,
        finalSpace.personName,
        collaborationLink
      );

      return await sendEmail({
        to: collaboratorEmail,
        subject: template.subject,
        html: template.html
      });
    } catch (error) {
      console.error('Failed to send final space collaboration invite:', error);
      return false;
    }
  }

  /**
   * Send pre-need evaluation reminder
   */
  static async sendEvaluationReminder(
    recipientEmail: string,
    recipientName: string
  ): Promise<boolean> {
    try {
      const evaluationLink = `${process.env.BASE_URL || 'http://localhost:5000'}/take-pre-need-evaluation`;
      const template = emailTemplates.evaluationReminder(recipientName, evaluationLink);

      return await sendEmail({
        to: recipientEmail,
        subject: template.subject,
        html: template.html
      });
    } catch (error) {
      console.error('Failed to send evaluation reminder:', error);
      return false;
    }
  }

  /**
   * Send notification when new comment is added to final space
   */
  static async notifyFinalSpaceNewComment(
    finalSpaceId: number,
    commenterName: string,
    commentText: string
  ): Promise<boolean> {
    try {
      const finalSpace = await storage.getFinalSpace(finalSpaceId);
      const collaborators = await storage.getFinalSpaceCollaborators(finalSpaceId);
      
      if (!finalSpace || !collaborators.length) {
        return false;
      }

      const memorialLink = `${process.env.BASE_URL || 'http://localhost:5000'}/memorial/${finalSpace.slug}`;
      const truncatedComment = commentText.length > 100 ? 
        commentText.substring(0, 100) + '...' : commentText;

      const promises = collaborators.map(collaborator => 
        sendEmail({
          to: collaborator.collaboratorEmail,
          subject: `New comment on ${finalSpace.personName}'s memorial`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Memorial Comment</h2>
              <p>Hello ${collaborator.collaboratorName || 'there'},</p>
              <p><strong>${commenterName}</strong> left a new comment on <strong>${finalSpace.personName}'s</strong> memorial:</p>
              <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">"${truncatedComment}"</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${memorialLink}" 
                   style="background-color: #28a745; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                  View Memorial
                </a>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This notification was sent from DeathMatters Memorial Platform
              </p>
            </div>
          `
        })
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      
      console.log(`Comment notification sent to ${successCount}/${collaborators.length} collaborators`);
      return successCount > 0;
      
    } catch (error) {
      console.error('Failed to send comment notifications:', error);
      return false;
    }
  }

  /**
   * Send weekly digest of activity to funeral home admins
   */
  static async sendWeeklyDigest(funeralHomeId: number): Promise<boolean> {
    try {
      const funeralHome = await storage.getFuneralHome(funeralHomeId);
      if (!funeralHome) return false;

      const obituaries = await storage.getObituariesByFuneralHome(funeralHomeId);
      const finalSpaces = await storage.getFinalSpacesByFuneralHome(funeralHomeId);
      const recentObituaries = obituaries.filter(obit => 
        new Date(obit.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      const recentMemorials = finalSpaces.filter(space => 
        new Date(space.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      return await sendEmail({
        to: funeralHome.email,
        subject: `Weekly Activity Digest - ${funeralHome.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Weekly Activity Digest</h2>
            <p>Hello ${funeralHome.name},</p>
            <p>Here's your weekly summary of platform activity:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #495057;">This Week's Activity</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>New Obituaries Created:</span>
                <strong>${recentObituaries.length}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>New Memorials Created:</span>
                <strong>${recentMemorials.length}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Total Active Obituaries:</span>
                <strong>${obituaries.length}</strong>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.BASE_URL || 'http://localhost:5000'}/dashboard" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                View Dashboard
              </a>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This weekly digest was sent from DeathMatters Platform
            </p>
          </div>
        `
      });
    } catch (error) {
      console.error('Failed to send weekly digest:', error);
      return false;
    }
  }
}