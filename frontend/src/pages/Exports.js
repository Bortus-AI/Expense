import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { exportAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Exports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('transactions');
  const [format, setFormat] = useState('pdf');
  const [options, setOptions] = useState({
    startDate: '',
    endDate: '',
    includeMatched: true,
    includeUnmatched: true,
    includeOCRData: true,
    maxPagesPerReceipt: '',
    title: '',
    groupBy: 'date',
    includeAnalytics: false,
    includeCharts: false,
    includeSummary: true,
    includeDetails: true
  });
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Load export options on component mount
  useEffect(() => {
    fetchExportOptions();
    if (user?.currentRole === 'admin') {
      fetchAnalyticsData();
    }
  }, [user?.currentRole]);

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

  const fetchAnalyticsData = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generatePreview = async () => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }

    try {
      // Generate a small preview of the data
      const previewOptions = {
        ...options,
        limit: 10,
        preview: true
      };

      const response = await exportAPI.generatePreview(reportType, previewOptions);
      setPreviewData(response.data);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const generateReport = async () => {
    if (!reportType || !format) {
      toast.error('Please select report type and format');
      return;
    }

    // Validate match status options for transactions and receipts
    if ((reportType === 'transactions' || reportType === 'receipts') && 
        !options.includeMatched && !options.includeUnmatched) {
      toast.error('Please select at least one option: Matched or Unmatched');
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
      includeOCRData: true,
      maxPagesPerReceipt: '',
      title: '',
      groupBy: 'date',
      includeAnalytics: false,
      includeCharts: false,
      includeSummary: true,
      includeDetails: true
    });
  };

  const currentOptions = getCurrentReportOptions();

  return (
    <div className="exports-page">
      <div className="page-header">
        <h1>📊 Export Reports</h1>
        <p>Generate comprehensive PDF and Excel reports for your expense data</p>
        {user?.currentRole === 'admin' && (
          <div className="text-sm text-gray">
            Admin access: Full analytics and advanced reporting options available
          </div>
        )}
      </div>

      <div className="export-builder">
        <div className="card">
          <div className="card-header">
            <h2>Report Builder</h2>
            <p>Configure your export settings and preview data</p>
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
                    <small>Professional formatted document with charts</small>
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
                    <small>Data analysis and filtering capabilities</small>
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

              {/* Admin-specific options */}
              {user?.currentRole === 'admin' && (
                <>
                  <div className="option-group">
                    <label>Report Content</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeAnalytics}
                          onChange={(e) => handleOptionChange('includeAnalytics', e.target.checked)}
                        />
                        Include Analytics Dashboard
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeCharts}
                          onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                        />
                        Include Charts & Graphs
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeSummary}
                          onChange={(e) => handleOptionChange('includeSummary', e.target.checked)}
                        />
                        Include Executive Summary
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeDetails}
                          onChange={(e) => handleOptionChange('includeDetails', e.target.checked)}
                        />
                        Include Detailed Data
                      </label>
                    </div>
                  </div>
                </>
              )}

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
                <>
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
                      <option value="status">Processing Status</option>
                    </select>
                  </div>

                  <div className="option-group">
                    <label>Include Receipts</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeMatched}
                          onChange={(e) => handleOptionChange('includeMatched', e.target.checked)}
                        />
                        Matched Receipts
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeUnmatched}
                          onChange={(e) => handleOptionChange('includeUnmatched', e.target.checked)}
                        />
                        Unmatched Receipts
                      </label>
                    </div>
                  </div>

                  {format === 'pdf' && (
                    <div className="option-group">
                      <label htmlFor="maxPagesPerReceipt">PDF Pages Per Receipt</label>
                      <select
                        id="maxPagesPerReceipt"
                        value={options.maxPagesPerReceipt}
                        onChange={(e) => handleOptionChange('maxPagesPerReceipt', e.target.value === '' ? null : parseInt(e.target.value))}
                        className="form-select"
                      >
                        <option value="">All pages (may create large reports)</option>
                        <option value="1">First page only</option>
                        <option value="2">First 2 pages</option>
                        <option value="3">First 3 pages</option>
                        <option value="5">First 5 pages</option>
                      </select>
                      <small className="text-gray">
                        Limit pages from each PDF receipt to reduce report size.
                      </small>
                    </div>
                  )}

                  {format === 'excel' && (
                    <div className="option-group">
                      <div className="checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={options.includeOCRData}
                            onChange={(e) => handleOptionChange('includeOCRData', e.target.checked)}
                          />
                          Include OCR Extracted Data
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Analytics Report specific options */}
              {reportType === 'analytics' && user?.currentRole === 'admin' && (
                <>
                  <div className="option-group">
                    <label>Analytics Sections</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeSummary}
                          onChange={(e) => handleOptionChange('includeSummary', e.target.checked)}
                        />
                        Financial Summary
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeCharts}
                          onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                        />
                        Trend Analysis
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeDetails}
                          onChange={(e) => handleOptionChange('includeDetails', e.target.checked)}
                        />
                        User Activity
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={options.includeAnalytics}
                          onChange={(e) => handleOptionChange('includeAnalytics', e.target.checked)}
                        />
                        System Performance
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Preview Section */}
            {user?.currentRole === 'admin' && (
              <div className="form-section">
                <h3>👁️ Data Preview</h3>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={generatePreview}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    🔍 Generate Preview
                  </button>
                </div>
                
                {previewData && (
                  <div className="preview-container">
                    <h4>Preview Data</h4>
                    <div className="preview-stats">
                      <div className="preview-stat">
                        <span>Total Records:</span>
                        <span className="font-bold">{previewData.totalRecords || 0}</span>
                      </div>
                      <div className="preview-stat">
                        <span>Date Range:</span>
                        <span className="font-bold">{previewData.dateRange || 'N/A'}</span>
                      </div>
                      <div className="preview-stat">
                        <span>Estimated Size:</span>
                        <span className="font-bold">{previewData.estimatedSize || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

        {/* Analytics Summary for Admin */}
        {user?.currentRole === 'admin' && analyticsData && (
          <div className="card">
            <div className="card-header">
              <h3>📈 Quick Analytics Summary</h3>
            </div>
            <div className="grid grid-4">
              <div className="text-center">
                <div className="text-lg font-bold text-danger">
                  ${analyticsData.financial?.totalExpenses?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray">Total Expenses</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-success">
                  {analyticsData.processing?.processingRate || 0}%
                </div>
                <div className="text-sm text-gray">Processing Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-info">
                  {analyticsData.processing?.matchRate || 0}%
                </div>
                <div className="text-sm text-gray">Match Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {analyticsData.processing?.totalReceipts || 0}
                </div>
                <div className="text-sm text-gray">Total Receipts</div>
              </div>
            </div>
          </div>
        )}

        {/* Export Tips */}
        <div className="card export-tips">
          <div className="card-header">
            <h3>💡 Export Tips</h3>
          </div>
          <div className="tips-content">
            <div className="tip">
              <strong>PDF Reports:</strong> Best for sharing with stakeholders, presentations, and archival purposes. Includes charts and professional formatting.
            </div>
            <div className="tip">
              <strong>Excel Reports:</strong> Ideal for data analysis, filtering, and further processing. Includes multiple sheets and pivot tables.
            </div>
            <div className="tip">
              <strong>Analytics Reports:</strong> Comprehensive dashboards with financial summaries, trend analysis, and performance metrics.
            </div>
            <div className="tip">
              <strong>Match Status Filtering:</strong> Choose to include matched items, unmatched items, or both in your reports.
            </div>
            <div className="tip">
              <strong>PDF Page Limiting:</strong> Limit pages per PDF receipt to reduce report size. Multi-page invoices can make reports very long.
            </div>
            <div className="tip">
              <strong>Date Ranges:</strong> Smaller date ranges generate faster. For large datasets, consider monthly exports.
            </div>
            <div className="tip">
              <strong>Admin Features:</strong> Admin users can access advanced analytics, system performance metrics, and comprehensive reporting options.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exports; 