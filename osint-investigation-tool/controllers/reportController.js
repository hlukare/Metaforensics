const OSINTService = require('../services/osintService');
const Report = require('../models/Report');

const osintService = new OSINTService();

exports.getReport = async (req, res) => {
  try {
    const { main_id } = req.params;
    
    if (!main_id) {
      return res.status(400).json({ error: 'Main ID parameter is required' });
    }

    const report = await osintService.getReport(main_id);
    
    if (report.error) {
      return res.status(404).json(report);
    }

    res.json(report);
  } catch (error) {
    console.error('Get Report Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listReports = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    // Get total count
    const total = await Report.countDocuments();
    
    // Get paginated reports
    const reports = await Report.find()
      .sort({ created_at: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('main_id last_updated created_at reports');
    
    // Format the response
    const formattedReports = reports.map(report => {
      let reportCount = 0;
      if (report.reports instanceof Map) {
        reportCount = report.reports.size;
      } else if (typeof report.reports === 'object') {
        reportCount = Object.keys(report.reports).length;
      }
      
      return {
        main_id: report.main_id,
        created: report.created_at,
        last_updated: report.last_updated,
        report_count: reportCount
      };
    });

    res.json({
      total: total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      reports: formattedReports
    });
  } catch (error) {
    console.error('List Reports Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { main_id } = req.params;
    
    if (!main_id) {
      return res.status(400).json({ error: 'Main ID parameter is required' });
    }

    const deletedReport = await Report.findOneAndDelete({ main_id: main_id });
    
    if (deletedReport) {
      res.json({ message: 'Report deleted successfully' });
    } else {
      res.status(404).json({ error: 'Report not found' });
    }
  } catch (error) {
    console.error('Delete Report Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { main_id, format = 'json' } = req.params;
    
    if (!main_id) {
      return res.status(400).json({ error: 'Main ID parameter is required' });
    }

    const report = await osintService.getReport(main_id);
    
    if (report.error) {
      return res.status(404).json(report);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const { Parser } = require('json2csv');
      const fields = ['main_id', 'sub_id', 'personal_info', 'digital_footprint', 'database_records', 'summary', 'generated_at'];
      const parser = new Parser({ fields });
      const csv = parser.parse(report);
      
      res.header('Content-Type', 'text/csv');
      res.attachment(`report_${main_id}.csv`);
      res.send(csv);
    } else if (format === 'pdf') {
      // Generate PDF report
      res.status(501).json({ error: 'PDF export not yet implemented' });
    } else {
      // Default JSON format
      res.json(report);
    }
  } catch (error) {
    console.error('Export Report Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};