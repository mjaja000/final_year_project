let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.warn('⚠️ nodemailer not installed - NTSA email forwarding disabled');
  nodemailer = null;
}

/**
 * NTSA Service - Handles classification and forwarding of complaints to NTSA
 * Email: mjajaaa00@gmail.com (development phase)
 */
class NTSAService {
  constructor() {
    this.emailTransporter = this.initializeEmailTransporter();
    this.ntsaEmail = process.env.NTSA_EMAIL || 'complaints@ntsa.go.ke';
    this.devEmail = process.env.DEV_EMAIL || 'mjajaaa00@gmail.com'; // Development phase
    this.appEmail = process.env.APP_EMAIL || 'noreply@matatuconnect.com';
    this.overrideReasons = {
      'Vehicle Safety Violations':
        'Violation of NTSA safety mandate under the NTSA Act. These issues can lead to fatal accidents.',
      'Sexual Harassment & Assault':
        'NTSA can revoke PSV licenses. Escalation required for passenger safety.',
      'Dangerous Driving & Operations':
        'NTSA can suspend licenses of repeat offenders and enforce safety compliance.',
      'Commercial Exploitation':
        'Handle locally first; escalate if a pattern emerges across trips or vehicles.',
      'Verbal Abuse & Harassment':
        'Document under consumer rights protections; escalate after multiple reports.',
      'Service Quality Issues':
        'Track trends locally; use for monitoring and improvement actions.',
    };
  }

  initializeEmailTransporter() {
    if (!nodemailer) {
      console.warn('⚠️ Email transporter not available - install nodemailer to enable NTSA forwarding');
      return null;
    }
    
    // Using Gmail for development
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'mjajaaa00@gmail.com',
        pass: process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD, // Use app password
      },
    });
  }

  /**
   * Classify complaint severity based on content
   * Returns: { priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', shouldForwardToNTSA: boolean }
   */
  classifyComplaint(complaintData) {
    const {
      complaintType,
      comment,
      vehicleNumber,
      routeName,
      ntsaPriority,
      ntsaCategory,
    } = complaintData;
    const commentLower = (comment || '').toLowerCase();

    if (ntsaPriority && ntsaCategory) {
      return {
        priority: ntsaPriority,
        category: ntsaCategory,
        shouldForwardToNTSA: ['CRITICAL', 'HIGH'].includes(ntsaPriority),
        reason: this.overrideReasons[ntsaCategory] || 'User-selected NTSA category',
      };
    }

    // Critical Safety Violations
    if (this.checkSafetyViolations(commentLower)) {
      return {
        priority: 'CRITICAL',
        category: 'Vehicle Safety Violations',
        shouldForwardToNTSA: true,
        reason: 'Direct safety hazard - vehicle inspection required',
      };
    }

    // Critical Sexual Harassment/Assault
    if (this.checkSexualViolations(commentLower)) {
      return {
        priority: 'CRITICAL',
        category: 'Sexual Harassment & Assault',
        shouldForwardToNTSA: true,
        reason: 'Sexual harassment incident - NTSA can revoke licenses',
      };
    }

    // High - Dangerous Driving
    if (this.checkDangerousDriving(commentLower)) {
      return {
        priority: 'HIGH',
        category: 'Dangerous Driving & Operations',
        shouldForwardToNTSA: true,
        reason: 'NTSA can suspend licenses of repeat offenders',
      };
    }

    // Medium - Commercial Exploitation
    if (this.checkCommercialViolations(commentLower)) {
      return {
        priority: 'MEDIUM',
        category: 'Commercial Exploitation',
        shouldForwardToNTSA: false,
        reason: 'Handle locally first, escalate if pattern emerges',
      };
    }

    // Medium - Verbal Abuse
    if (this.checkVerbalAbuse(commentLower)) {
      return {
        priority: 'MEDIUM',
        category: 'Verbal Abuse & Harassment',
        shouldForwardToNTSA: false,
        reason: 'Document and escalate after multiple reports',
      };
    }

    // Low - Service Quality
    return {
      priority: 'LOW',
      category: 'Service Quality Issues',
      shouldForwardToNTSA: false,
      reason: 'Track trends locally',
    };
  }

  checkSafetyViolations(comment) {
    const safetyKeywords = [
      'seatbelt',
      'seat belt',
      'no seatbelt',
      'missing seatbelt',
      'unroadworthy',
      'broken seat',
      'unsafe',
      'anti-roll bar',
      'conformity plate',
      'rsl direct',
      'dangerous road',
      'brake fail',
      'tire burst',
      'accident',
      'crash risk',
    ];
    return safetyKeywords.some((keyword) => comment.includes(keyword));
  }

  checkSexualViolations(comment) {
    const sexualKeywords = [
      'sexual',
      'assault',
      'harassment',
      'inappropriate touch',
      'groping',
      'stripping',
      'undressing',
      'inappropriate',
      'indecent',
      'rape',
      'molestation',
    ];
    return sexualKeywords.some((keyword) => comment.includes(keyword));
  }

  checkDangerousDriving(comment) {
    const drivingKeywords = [
      'speeding',
      'reckless',
      'overspeed',
      'overtaking',
      'overloading',
      'overload',
      'route deviation',
      'forced alight',
      'dangerous driving',
      'drunk driver',
      'fatigue',
      'no seatbelt',
    ];
    return drivingKeywords.some((keyword) => comment.includes(keyword));
  }

  checkCommercialViolations(comment) {
    const commercialKeywords = [
      'fare hike',
      'mid-journey fare',
      'overcharged',
      'no refund',
      'fare manipulation',
      'extra charge',
      'unfair price',
    ];
    return commercialKeywords.some((keyword) => comment.includes(keyword));
  }

  checkVerbalAbuse(comment) {
    const abuseKeywords = [
      'abusive',
      'insult',
      'rude',
      'obscene',
      'threatening',
      'intimidation',
      'harassment',
      'verbal',
    ];
    return abuseKeywords.some((keyword) => comment.includes(keyword));
  }

  /**
   * Format complaint for NTSA submission
   */
  formatComplaintForNTSA(complaintData, classification) {
    const {
      complaintType,
      comment,
      vehicleNumber,
      routeName,
      saccoName,
      crewDetails,
      incidentDate,
      incidentTime,
      evidence,
      passengerContact,
      ntsaCategory,
    } = complaintData;

    let evidenceText = 'No evidence provided';
    if (evidence) {
      try {
        const parsed = JSON.parse(evidence);
        const fileList = Array.isArray(parsed?.files) ? parsed.files : [];
        const notes = parsed?.notes ? `Notes: ${parsed.notes}` : '';
        const fileLines = fileList.length
          ? `Files: ${fileList.join(', ')}`
          : '';
        evidenceText = [fileLines, notes].filter(Boolean).join(' | ') || 'Evidence provided';
      } catch (err) {
        evidenceText = evidence;
      }
    }

    return `
NTSA COMPLAINT REPORT
======================
Priority: ${classification.priority}
Category: ${classification.category}
Date Submitted: ${new Date().toLocaleString('en-KE')}

INCIDENT DETAILS
================
Date: ${incidentDate || 'Not specified'}
Time: ${incidentTime || 'Not specified'}
Route: ${routeName || 'Not specified'}
Vehicle Plate: ${vehicleNumber || 'Not specified'}
SACCO: ${saccoName || 'Not specified'}

COMPLAINT DESCRIPTION
=====================
${comment}

CREW INFORMATION
================
${crewDetails || 'Not provided'}

PASSENGER DETAILS
=================
Contact: ${passengerContact || 'Not provided'}

EVIDENCE
========
${evidenceText}

CLASSIFICATION NOTES
====================
${classification.reason}

Forwarded via: MatatuConnect Platform
Email: noreply@matatuconnect.com
    `;
  }

  /**
   * Forward complaint to NTSA
   */
  async forwardToNTSA(complaintData, classification) {
    try {
      if (!classification.shouldForwardToNTSA) {
        console.log('⚠️ Complaint does not meet NTSA forwarding criteria');
        return {
          success: false,
          forwarded: false,
          message: 'Complaint will be handled locally',
        };
      }

      // If nodemailer is not available, mock the forwarding
      if (!this.emailTransporter) {
        console.log('📧 [MOCK] Complaint would be forwarded to NTSA:', {
          priority: classification.priority,
          category: classification.category,
          complaint: complaintData.comment?.substring(0, 50) + '...',
        });
        
        return {
          success: true,
          forwarded: true,
          messageId: 'MOCK_' + Date.now(),
          destination: this.devEmail,
          message: `[MOCK] Complaint classified for NTSA (${classification.priority}) - install nodemailer to enable real forwarding`,
        };
      }

      const emailBody = this.formatComplaintForNTSA(complaintData, classification);

      // In development, send to dev email; in production, send to NTSA
      const recipientEmail = process.env.NODE_ENV === 'production' ? this.ntsaEmail : this.devEmail;

      const mailOptions = {
        from: this.appEmail,
        to: recipientEmail,
        subject: `[${classification.priority}] NTSA Complaint Report - ${classification.category}`,
        html: this.htmlifyEmail(emailBody),
        text: emailBody,
        cclist:
          process.env.NODE_ENV === 'production'
            ? [this.devEmail] // CC dev email in production for monitoring
            : undefined,
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      console.log('✓ Complaint forwarded to NTSA:', {
        priority: classification.priority,
        category: classification.category,
        messageId: info.messageId,
        destination: recipientEmail,
      });

      return {
        success: true,
        forwarded: true,
        messageId: info.messageId,
        destination: recipientEmail,
        message: `Complaint forwarded to NTSA (${classification.priority})`,
      };
    } catch (error) {
      console.error('✗ Failed to forward complaint to NTSA:', error.message);
      return {
        success: false,
        forwarded: false,
        error: error.message,
        message: 'Failed to forward to NTSA - will retry',
      };
    }
  }

  htmlifyEmail(plainText) {
    return plainText
      .replace(/\n/g, '<br>')
      .replace(/([A-Z\s]+)\n=====/g, '<h3>$1</h3>')
      .replace(/Priority: (.*)<br>/g, '<p><strong>Priority:</strong> <span style="color: red;">$1</span></p><br>');
  }

  /**
   * Get classification summary for admin dashboard
   */
  getClassificationSummary(complaints = []) {
    const summary = {
      totalComplaints: complaints.length,
      byCriticality: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      },
      byCategory: {},
      forwardedToNTSA: 0,
      handleLocally: 0,
    };

    complaints.forEach((complaint) => {
      const classification = this.classifyComplaint(complaint);
      summary.byCriticality[classification.priority]++;
      summary.byCategory[classification.category] = (summary.byCategory[classification.category] || 0) + 1;

      if (classification.shouldForwardToNTSA) {
        summary.forwardedToNTSA++;
      } else {
        summary.handleLocally++;
      }
    });

    return summary;
  }
}

module.exports = new NTSAService();
