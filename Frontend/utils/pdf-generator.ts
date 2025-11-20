import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { getCurrentUser, createNotification } from './firebase-service';

interface SocialLink {
  platform: string;
  url: string;
  username: string;
}

interface CriminalRecord {
  case_number?: string;
  charges?: string;
  status?: string;
  court?: string;
  date?: string;
}

interface PublicRecords {
  business_records?: any;
  property_records?: any;
}

interface SearchResult {
  source: string;
  description: string;
  link?: string;
}

interface Summary {
  identity_verified?: boolean;
  digital_presence?: boolean;
  criminal_records?: number;
}

interface ReportData {
  personName: string;
  accuracy: string;
  location: string;
  profileImage?: string;
  scanDate: string;
  reportId?: string;
  generatedAt?: string;
  aadhar: any;
  pan: any;
  voter: any;
  criminalRecords: CriminalRecord[];
  socialLinks: SocialLink[];
  publicRecords?: PublicRecords;
  searchResults?: SearchResult[];
  summary?: Summary;
  databaseRecords?: any;
}

export const generateReportPDF = async (reportData: ReportData): Promise<void> => {
  try {
    // Generate HTML content for PDF
    const htmlContent = generateHTMLReport(reportData);
    
    // Create PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    // Share the PDF (this doesn't save to device, only shares)
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${reportData.personName}_Report.pdf`,
      UTI: 'com.adobe.pdf',
    });

    // Send local notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📄 PDF Report Shared',
          body: `Successfully shared report for ${reportData.personName}`,
          data: { reportId: reportData.reportId, name: reportData.personName },
          sound: true,
        },
        trigger: null, // Show immediately
      });
      console.log('✅ Local notification sent');
    } catch (notifError) {
      console.log('⚠️ Local notification error:', notifError);
    }

    // Create Firebase notification
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        await createNotification(currentUser.uid, {
          type: 'pdf_shared',
          title: 'PDF Report Shared',
          message: `Successfully shared report for ${reportData.personName}`,
          metadata: {
            reportId: reportData.reportId,
            reportName: reportData.personName,
          },
        });
        console.log('✅ PDF notification created');
      }
    } catch (fbError) {
      console.log('⚠️ Firebase notification error:', fbError);
    }

    // Clean up - delete temporary file after sharing
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (error) {
        console.log('Error deleting temp file:', error);
      }
    }, 5000);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const generateHTMLReport = (data: ReportData): string => {
  const date = new Date(data.scanDate).toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          color: #1a1a2e;
          padding: 40px;
          background: #ffffff;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #007AFF;
        }
        
        .header h1 {
          color: #007AFF;
          font-size: 32px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .header p {
          color: #666;
          font-size: 14px;
        }
        
        .profile-section {
          background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .profile-section h2 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        
        .profile-section .accuracy {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 18px;
          font-weight: 600;
          margin: 10px 0;
        }
        
        .profile-section .meta {
          margin-top: 15px;
          font-size: 14px;
          opacity: 0.9;
        }
        
        .section {
          margin-bottom: 30px;
          background: #f8f9fa;
          padding: 25px;
          border-radius: 12px;
          border-left: 4px solid #007AFF;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #007AFF;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .data-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .data-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        .data-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        .data-value {
          font-size: 16px;
          color: #1a1a2e;
          font-weight: 500;
          word-wrap: break-word;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .social-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 10px;
        }
        
        .social-link {
          background: white;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #007AFF;
        }
        
        .social-icon {
          width: 24px;
          height: 24px;
          margin-right: 10px;
          font-weight: bold;
        }
        
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 12px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 10px;
        }
        
        .status-match {
          background: #34C759;
          color: white;
        }
        
        .status-warning {
          background: #FF9500;
          color: white;
        }
        
        .location-info {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          border: 1px solid #e0e0e0;
        }
        
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔍 Meta Forensics Report</h1>
        <p>Face Recognition & Identity Verification System</p>
      </div>
      
      <div class="profile-section">
        <h2>${data.personName}</h2>
        <div class="accuracy">Match Accuracy: ${data.accuracy}%</div>
        <div class="meta">
          <p>📅 Generated on: ${date}</p>
          <p>📍 Location: ${data.location}</p>
        </div>
      </div>

      ${data.aadhar ? `
      <div class="section">
        <h3 class="section-title">🆔 Aadhar Details</h3>
        <div class="data-grid">
          ${data.aadhar.name ? `
          <div class="data-item">
            <div class="data-label">Full Name</div>
            <div class="data-value">${data.aadhar.name}</div>
          </div>
          ` : ''}
          ${data.aadhar.aadhar_number ? `
          <div class="data-item">
            <div class="data-label">Aadhar Number</div>
            <div class="data-value">${data.aadhar.aadhar_number}</div>
          </div>
          ` : ''}
          ${data.aadhar.dob ? `
          <div class="data-item">
            <div class="data-label">Date of Birth</div>
            <div class="data-value">${data.aadhar.dob}</div>
          </div>
          ` : ''}
          ${data.aadhar.gender ? `
          <div class="data-item">
            <div class="data-label">Gender</div>
            <div class="data-value">${data.aadhar.gender}</div>
          </div>
          ` : ''}
          ${data.aadhar.address ? `
          <div class="data-item full-width">
            <div class="data-label">Address</div>
            <div class="data-value">${data.aadhar.address}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${data.pan ? `
      <div class="section">
        <h3 class="section-title">💳 PAN Card Details</h3>
        <div class="data-grid">
          ${data.pan.name ? `
          <div class="data-item">
            <div class="data-label">Name</div>
            <div class="data-value">${data.pan.name}</div>
          </div>
          ` : ''}
          ${data.pan.pan_number ? `
          <div class="data-item">
            <div class="data-label">PAN Number</div>
            <div class="data-value">${data.pan.pan_number}</div>
          </div>
          ` : ''}
          ${data.pan.dob ? `
          <div class="data-item">
            <div class="data-label">Date of Birth</div>
            <div class="data-value">${data.pan.dob}</div>
          </div>
          ` : ''}
          ${data.pan.father_name ? `
          <div class="data-item">
            <div class="data-label">Father's Name</div>
            <div class="data-value">${data.pan.father_name}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${data.criminalRecords && data.criminalRecords.length > 0 ? `
      <div class="section">
        <h3 class="section-title">⚖️ Criminal Records</h3>
        <div class="status-badge status-warning">Criminal Record Found</div>
        ${data.criminalRecords.map((record: CriminalRecord) => `
        <div class="data-grid" style="margin-top: 20px; border-top: 2px solid #e0e0e0; padding-top: 20px;">
          ${record.case_number ? `
          <div class="data-item">
            <div class="data-label">Case Number</div>
            <div class="data-value">${record.case_number}</div>
          </div>
          ` : ''}
          ${record.status ? `
          <div class="data-item">
            <div class="data-label">Status</div>
            <div class="data-value">${record.status}</div>
          </div>
          ` : ''}
          ${record.court ? `
          <div class="data-item">
            <div class="data-label">Court</div>
            <div class="data-value">${record.court}</div>
          </div>
          ` : ''}
          ${record.charges ? `
          <div class="data-item full-width">
            <div class="data-label">Charges</div>
            <div class="data-value">${record.charges}</div>
          </div>
          ` : ''}
          ${record.date ? `
          <div class="data-item">
            <div class="data-label">Date</div>
            <div class="data-value">${record.date}</div>
          </div>
          ` : ''}
        </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.voter ? `
      <div class="section">
        <h3 class="section-title">🗳️ Voter ID Details</h3>
        <div class="data-grid">
          ${data.voter.name ? `
          <div class="data-item">
            <div class="data-label">Name</div>
            <div class="data-value">${data.voter.name}</div>
          </div>
          ` : ''}
          ${data.voter.voter_id ? `
          <div class="data-item">
            <div class="data-label">Voter ID</div>
            <div class="data-value">${data.voter.voter_id}</div>
          </div>
          ` : ''}
          ${data.voter.constituency ? `
          <div class="data-item">
            <div class="data-label">Constituency</div>
            <div class="data-value">${data.voter.constituency}</div>
          </div>
          ` : ''}
          ${data.voter.state ? `
          <div class="data-item">
            <div class="data-label">State</div>
            <div class="data-value">${data.voter.state}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${data.socialLinks && data.socialLinks.length > 0 ? `
      <div class="section">
        <h3 class="section-title">🔗 Social Media Profiles</h3>
        <div class="social-links">
          ${data.socialLinks.map((link: SocialLink) => `
            <div class="social-link">
              <div class="social-icon">${getSocialIcon(link.platform)}</div>
              <div>
                <div class="data-label">${link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}</div>
                <div class="data-value" style="font-size: 12px; color: #007AFF; word-break: break-all;">${link.url}</div>
                ${link.username ? `<div class="data-value" style="font-size: 11px; color: #666;">@${link.username}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${data.publicRecords && (data.publicRecords.business_records || data.publicRecords.property_records) ? `
      <div class="section">
        <h3 class="section-title">📋 Public Records</h3>
        ${data.publicRecords.business_records ? `
        <div class="data-grid" style="margin-bottom: 15px;">
          <div class="data-item full-width">
            <div class="data-label">🏢 Business Records</div>
            <div class="data-value">${data.publicRecords.business_records.description || 'Available'}</div>
          </div>
        </div>
        ` : ''}
        ${data.publicRecords.property_records ? `
        <div class="data-grid">
          <div class="data-item full-width">
            <div class="data-label">🏠 Property Records</div>
            <div class="data-value">${data.publicRecords.property_records.description || 'Available'}</div>
          </div>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${data.searchResults && data.searchResults.length > 0 ? `
      <div class="section">
        <h3 class="section-title">🔍 Search Results</h3>
        ${data.searchResults.map((result: SearchResult) => `
        <div class="data-grid" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
          <div class="data-item full-width">
            <div class="data-label">Source: ${result.source}</div>
            <div class="data-value">${result.description}</div>
            ${result.link && result.link !== '#' ? `<div class="data-value" style="font-size: 11px; color: #007AFF; margin-top: 5px;">${result.link}</div>` : ''}
          </div>
        </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.summary ? `
      <div class="section">
        <h3 class="section-title">ℹ️ Summary</h3>
        <div class="data-grid">
          ${data.summary.identity_verified !== undefined ? `
          <div class="data-item">
            <div class="data-label">Identity Verified</div>
            <div class="status-badge ${data.summary.identity_verified ? 'status-match' : 'status-warning'}">
              ${data.summary.identity_verified ? 'Yes' : 'No'}
            </div>
          </div>
          ` : ''}
          ${data.summary.digital_presence !== undefined ? `
          <div class="data-item">
            <div class="data-label">Digital Presence</div>
            <div class="data-value">${data.summary.digital_presence ? 'Yes' : 'No'}</div>
          </div>
          ` : ''}
          ${data.summary.criminal_records !== undefined ? `
          <div class="data-item">
            <div class="data-label">Criminal Records Count</div>
            <div class="data-value">${data.summary.criminal_records}</div>
          </div>
          ` : ''}
          ${data.reportId ? `
          <div class="data-item">
            <div class="data-label">Report ID</div>
            <div class="data-value">${data.reportId}</div>
          </div>
          ` : ''}
          ${data.generatedAt ? `
          <div class="data-item">
            <div class="data-label">Generated At</div>
            <div class="data-value">${new Date(data.generatedAt).toLocaleString('en-IN')}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Meta Forensics - Face Recognition System</strong></p>
        <p>This is a confidential report generated for law enforcement purposes.</p>
        <p>Generated at ${new Date().toLocaleString('en-IN')}</p>
      </div>
    </body>
    </html>
  `;
};

const getSocialIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    facebook: '👤',
    instagram: '📷',
    twitter: '🐦',
    linkedin: '💼',
    github: '💻',
    youtube: '📺',
  };
  return icons[platform.toLowerCase()] || '🔗';
};
