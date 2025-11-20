module.exports = {
  // Check if investigation complies with regulations
  checkCompliance: (investigationType, jurisdiction, dataTypes) => {
    const compliance = {
      gdpr: jurisdiction.includes('EU') && investigationType !== 'law_enforcement',
      ccpa: jurisdiction.includes('California'),
      pdpa: jurisdiction.includes('India'),
      compliant: true,
      requirements: [],
      warnings: []
    };

    // GDPR compliance checks
    if (compliance.gdpr) {
      if (dataTypes.includes('biometric')) {
        compliance.compliant = false;
        compliance.warnings.push('GDPR prohibits processing of biometric data without explicit consent');
      }
      
      if (investigationType === 'commercial') {
        compliance.requirements.push('Need lawful basis for processing under Article 6');
        compliance.requirements.push('Data subject rights must be respected');
      }
    }

    // CCPA compliance checks
    if (compliance.ccpa) {
      compliance.requirements.push('Right to know about personal information collected');
      compliance.requirements.push('Right to delete personal information');
      compliance.requirements.push('Right to opt-out of sale of personal information');
    }

    // PDPA compliance checks (India)
    if (compliance.pdpa) {
      compliance.requirements.push('Need explicit consent for sensitive personal data');
      compliance.requirements.push('Data principal rights must be respected');
      compliance.requirements.push('Data localization requirements may apply');
    }

    // General ethical considerations
    if (dataTypes.includes('health') || dataTypes.includes('financial')) {
      compliance.warnings.push('Sensitive data types require additional safeguards');
    }

    if (investigationType === 'commercial' && !compliance.gdpr && !compliance.ccpa && !compliance.pdpa) {
      compliance.requirements.push('Follow general privacy principles and local regulations');
    }

    return compliance;
  },

  // Generate compliance report
  generateComplianceReport: (investigationDetails) => {
    const compliance = module.exports.checkCompliance(
      investigationDetails.type,
      investigationDetails.jurisdiction,
      investigationDetails.dataTypes
    );

    return {
      investigation_id: investigationDetails.id,
      timestamp: new Date().toISOString(),
      compliant: compliance.compliant,
      regulations_applicable: {
        gdpr: compliance.gdpr,
        ccpa: compliance.ccpa,
        pdpa: compliance.pdpa
      },
      requirements: compliance.requirements,
      warnings: compliance.warnings,
      recommendations: compliance.compliant ? 
        ['Proceed with investigation while maintaining compliance'] : 
        ['Review and address compliance issues before proceeding']
    };
  },

  // Data minimization check
  checkDataMinimization: (collectedData, purpose) => {
    const necessaryData = {
      background_check: ['name', 'address', 'employment_history', 'education'],
      due_diligence: ['name', 'business_affiliations', 'financial_history'],
      fraud_investigation: ['name', 'financial_records', 'communication_patterns']
    };

    const requiredFields = necessaryData[purpose] || [];
    const collectedFields = Object.keys(collectedData);

    // Check if collected data exceeds what's necessary
    const excessiveData = collectedFields.filter(field => !requiredFields.includes(field));
    
    return {
      minimized: excessiveData.length === 0,
      excessive_fields: excessiveData,
      recommendation: excessiveData.length > 0 ? 
        'Consider removing unnecessary data fields' : 
        'Data collection is appropriately minimized'
    };
  },

  // Retention policy check
  checkRetentionPolicy: (dataType, jurisdiction) => {
    const retentionPeriods = {
      gdpr: {
        personal_data: '6 months to 2 years',
        sensitive_data: '1 year maximum',
        health_data: '1 year maximum'
      },
      ccpa: {
        personal_data: '12 months',
        sensitive_data: '6 months'
      },
      pdpa: {
        personal_data: 'Not specified',
        sensitive_data: 'Not specified'
      }
    };

    const regulation = jurisdiction.includes('EU') ? 'gdpr' : 
                      jurisdiction.includes('California') ? 'ccpa' : 'pdpa';

    return retentionPeriods[regulation][dataType] || 'Follow organizational policy';
  }
};