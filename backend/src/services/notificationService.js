/**
 * NotificationService - Handles urgent alerts for high-priority incidents.
 * Placeholder implementation - can be extended with SMS, WhatsApp, Email, etc.
 */
class NotificationService {
  /**
   * Send an urgent alert notification.
   * Called when incident priority score > 4.
   *
   * @param {Object} incidentData - Incident information
   * @param {string} incidentData.reportId - UUID of the report
   * @param {string} incidentData.matatuId - UUID of the matatu
   * @param {string} incidentData.category - Incident category
   * @param {number} incidentData.priorityScore - Priority score (0-10)
   * @param {string} incidentData.comment - Incident comment
   * @returns {Promise<Object>} Notification result
   */
  static async sendUrgentAlert(incidentData) {
    const {
      reportId,
      matatuId,
      category,
      priorityScore,
      comment,
    } = incidentData;

    const alertMessage = `
🚨 URGENT INCIDENT ALERT 🚨
Report ID: ${reportId}
Matatu ID: ${matatuId}
Category: ${category}
Priority Score: ${priorityScore}/10
Details: ${comment || 'No details provided'}
Timestamp: ${new Date().toISOString()}
    `.trim();

    console.log('📢 URGENT ALERT:', alertMessage);

    // TODO: Implement actual notification channels:
    // 1. SMS to SACCO fleet manager
    // 2. WhatsApp to emergency contact
    // 3. Email to operations team
    // 4. In-app push notification

    try {
      // Placeholder: Log to console
      const result = {
        success: true,
        message: 'Urgent alert sent successfully',
        channels: {
          sms: { sent: false, reason: 'Placeholder - not yet implemented' },
          whatsapp: { sent: false, reason: 'Placeholder - not yet implemented' },
          email: { sent: false, reason: 'Placeholder - not yet implemented' },
        },
      };

      // In production, actually send notifications here
      // await this.sendSmsAlert(saccoManager, alertMessage);
      // await this.sendWhatsappAlert(emergencyContact, alertMessage);
      return result;
    } catch (error) {
      console.error('Failed to send urgent alert:', error.message);
      throw new Error(`Notification failed: ${error.message}`);
    }
  }

  /**
   * Send a regular notification for low-priority incidents.
   */
  static async sendRegularNotification(incidentData) {
    console.log('ℹ Notification (Low Priority):', incidentData);
    return {
      success: true,
      message: 'Notification queued',
    };
  }

  /**
   * Calculate priority score for an incident.
   * Higher score = higher priority.
   *
   * @param {string} category - Incident category
   * @param {number} existingIncidentCount - Number of existing incidents for this matatu
   * @returns {number} Priority score 0-10
   */
  static calculatePriorityScore(category, existingIncidentCount = 0) {
    const categoryScores = {
      'Speeding': 8,
      'Reckless': 9,
      'Overcharging': 4,
      'Harassment': 7,
      'Loud Music': 2,
      'Poor Condition': 3,
      'Unsafe Driving': 10,
      'Other': 3,
    };

    let baseScore = categoryScores[category] || 3;

    // Increase priority if multiple incidents
    if (existingIncidentCount > 5) {
      baseScore = Math.min(10, baseScore + 2);
    }

    return baseScore;
  }

  /**
   * Archive processed alert (placeholder for future logging).
   */
  static async archiveAlert(reportId) {
    console.log(`✓ Alert for report ${reportId} archived.`);
    return true;
  }
}

module.exports = NotificationService;
