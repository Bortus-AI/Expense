import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { exportAPI } from '../services/api';

const Exports = () => {
  const [reportType, setReportType] = useState('transactions');
  const [format, setFormat] = useState('pdf');
  const [options, setOptions] = useState({
    startDate: '',
    endDate: '',
    includeMatched: true,
    includeUnmatched: true,
    title: '',
    groupBy: 'date'
  });
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState(null);

  // Load export options on component mount
  useEffect(() => {
    fetchExportOptions();
  }, []);

  const fetchExportOptions = async () => {
    try {
      console.log('Fetching export options...');
      const response = await exportAPI.getOptions();
      console.log('Export options response:', response.data);
      setExportOptions(response.data);
    } catch (error) {
      console.error('Error fetching export options:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error('Failed to load export options');
      }
    }
  };

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateReport = async () => {
    if (!reportType || !format) {
      toast.error('Please select report type and format');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...options };

      // Make request with appropriate API function
      const response = format === 'pdf' 
        ? await exportAPI.generatePDF(reportType, payload)
        : await exportAPI.generateExcel(reportType, payload);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or create default
      const disposition = response.headers['content-disposition'];
      let filename = `report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      
      if (disposition) {
        const matches = disposition.match(/filename="([^"]+)"/);
        if (matches) {
          filename = matches[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} report generated successfully!`);

    } catch (error) {
      console.error('Export error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to export reports.');
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Export timeout. Please try with a smaller date range.');
      } else {
        toast.error('Failed to generate report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentReportOptions = () => {
    if (!exportOptions) return null;
    return exportOptions.reportTypes.find(type => type.id === reportType);
  };

  const resetOptions = () => {
    setOptions({
      startDate: '',
      endDate: '',
      includeMatched: true,
      includeUnmatched: true,
      title: '',
      groupBy: 'date'
    });
  };

  const currentOptions = getCurrentReportOptions();

  return (
    <div className="exports-page">
      <div className="page-header">
        <h1>📊 Export Reports</h1>
        <p>Generate PDF and Excel reports for your expense data</p>
      </div>

      <div className="export-builder">
        <div className="card">
          <div className="card-header">
            <h2>Report Builder</h2>
            <p>Configure your export settings</p>
          </div>

          <div className="export-form">
            {/* Report Type Selection */}
            <div className="form-section">
              <h3>📋 Report Type</h3>
              <div className="report-type-grid">
                {exportOptions?.reportTypes.map(type => (
                  <label key={type.id} className={`report-type-card ${reportType === type.id ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="reportType"
                      value={type.id}
                      checked={reportType === type.id}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <div className="report-type-content">
                      <h4>{type.name}</h4>
                      <p>{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="form-section">
              <h3>📄 Export Format</h3>
              <div className="format-selection">
                <label className={`format-card ${format === 'pdf' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <div className="format-content">
                    <span className="format-icon">📄</span>
                    <span>PDF Report</span>
                    <small>Professional formatted document</small>
                  </div>
                </label>

                <label className={`format-card ${format === 'excel' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={format === 'excel'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  <div className="format-content">
                    <span className="format-icon">📊</span>
                    <span>Excel Spreadsheet</span>
                    <small>Data analysis and filtering</small>
                  </div>
                </label>
              </div>
            </div>

            {/* Options */}
            <div className="form-section">
              <h3>⚙️ Report Options</h3>
              
              {/* Date Range */}
              {currentOptions?.options.dateRange && (
                <div className="option-group">
                  <label>Date Range</label>
                  <div className="date-range">
                    <div className="form-group">
                      <label htmlFor="startDate">Start Date</label>
                      <input
                        type="date"
                        id="startDate"
                        value={options.startDate}
                        onChange={(e) => handleOptionChange('startDate', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="endDate">End Date</label>
                      <input
                        type="date"
                        id="endDate"
                        value={options.endDate}
                        onChange={(e) => handleOptionChange('endDate', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Title */}
              <div className="option-group">
                <label htmlFor="title">Custom Report Title (Optional)</label>
                <input
                  type="text"
                  id="title"
                  value={options.title}
                  onChange={(e) => handleOptionChange('title', e.target.value)}
                  placeholder={`${currentOptions?.name || 'Report'}`}
                  className="form-input"
                />
              </div>

              {/* Transaction-specific options */}
              {reportType === 'transactions' && (
                <div className="option-group">
                  <label>Include Transactions</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={options.includeMatched}
                        onChange={(e) => handleOptionChange('includeMatched', e.target.checked)}
                      />
                      Matched Transactions
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={options.includeUnmatched}
                        onChange={(e) => handleOptionChange('includeUnmatched', e.target.checked)}
                      />
                      Unmatched Transactions
                    </label>
                  </div>
                </div>
              )}

              {/* Receipt-specific options */}
              {reportType === 'receipts' && (
                <div className="option-group">
                  <label htmlFor="groupBy">Group Receipts By</label>
                  <select
                    id="groupBy"
                    value={options.groupBy}
                    onChange={(e) => handleOptionChange('groupBy', e.target.value)}
                    className="form-select"
                  >
                    <option value="date">Date</option>
                    <option value="merchant">Merchant</option>
                    <option value="amount">Amount Range</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                onClick={resetOptions}
                className="btn btn-secondary"
                disabled={loading}
              >
                Reset Options
              </button>
              <button
                type="button"
                onClick={generateReport}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    📥 Generate {format.toUpperCase()} Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Export Tips */}
        <div className="card export-tips">
          <div className="card-header">
            <h3>💡 Export Tips</h3>
          </div>
          <div className="tips-content">
            <div className="tip">
              <strong>PDF Reports:</strong> Best for sharing with stakeholders, presentations, and archival purposes.
            </div>
            <div className="tip">
              <strong>Excel Reports:</strong> Ideal for data analysis, filtering, and further processing.
            </div>
            <div className="tip">
              <strong>Date Ranges:</strong> Smaller date ranges generate faster. For large datasets, consider monthly exports.
            </div>
            <div className="tip">
              <strong>File Sizes:</strong> Reports with many receipts or transactions may take longer to generate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exports; 