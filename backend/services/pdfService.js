const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class PDFService {
  constructor() {
    this.pageMargin = 50;
    this.colors = {
      primary: '#667eea',
      secondary: '#764ba2',
      text: '#333333',
      lightText: '#666666',
      accent: '#48bb78',
      danger: '#f56565'
    };
  }

  // Generate Transaction Summary Report
  async generateTransactionReport(transactions, options = {}) {
    const {
      companyName = 'Company',
      startDate,
      endDate,
      title = 'Transaction Summary Report',
      includeMatched = true,
      includeUnmatched = true
    } = options;

    const doc = new PDFDocument({ margin: this.pageMargin });
    let yPosition = this.pageMargin;

    // Header
    yPosition = this.addHeader(doc, title, companyName, yPosition);
    
    // Date Range
    if (startDate || endDate) {
      yPosition = this.addDateRange(doc, startDate, endDate, yPosition);
    }

    // Statistics Summary
    const stats = this.calculateTransactionStats(transactions);
    yPosition = this.addStatsSummary(doc, stats, yPosition);

    // Transactions Table
    yPosition = this.addTransactionsTable(doc, transactions, yPosition, {
      includeMatched,
      includeUnmatched
    });

    // Footer
    this.addFooter(doc);

    return doc;
  }

  // Generate Receipt Gallery Report
  async generateReceiptGalleryReport(receipts, options = {}) {
    const {
      companyName = 'Company',
      title = 'Receipt Gallery Report',
      groupBy = 'date' // 'date', 'merchant', 'amount'
    } = options;

    const doc = new PDFDocument({ margin: this.pageMargin });
    let yPosition = this.pageMargin;

    // Header
    yPosition = this.addHeader(doc, title, companyName, yPosition);

    // Group receipts
    const groupedReceipts = this.groupReceipts(receipts, groupBy);

    if (Object.keys(groupedReceipts).length === 0) {
      doc.fontSize(12)
         .fillColor(this.colors.text)
         .text('No receipts found for the selected criteria.', this.pageMargin, yPosition);
    } else {
      // Add grouped receipt sections
      for (const [groupKey, groupReceipts] of Object.entries(groupedReceipts)) {
        yPosition = this.addReceiptGroup(doc, groupKey, groupReceipts, yPosition);
      }
    }

    // Footer
    this.addFooter(doc);

    return doc;
  }

  // Generate Company Analytics Report
  async generateAnalyticsReport(analytics, options = {}) {
    const {
      companyName = 'Company',
      title = 'Expense Analytics Report',
      period = 'Monthly'
    } = options;

    const doc = new PDFDocument({ margin: this.pageMargin });
    let yPosition = this.pageMargin;

    // Header
    yPosition = this.addHeader(doc, title, companyName, yPosition);

    // Key Metrics
    yPosition = this.addKeyMetrics(doc, analytics, yPosition);

    // Category Breakdown
    yPosition = this.addCategoryBreakdown(doc, analytics.categories, yPosition);

    // Trends Chart (text-based)
    yPosition = this.addTrendsChart(doc, analytics.trends, yPosition);

    // Recommendations
    yPosition = this.addRecommendations(doc, analytics.recommendations, yPosition);

    // Footer
    this.addFooter(doc);

    return doc;
  }

  // Generate Reconciliation Report
  async generateReconciliationReport(data, options = {}) {
    const {
      companyName = 'Company',
      title = 'Reconciliation Report',
      period
    } = options;

    const doc = new PDFDocument({ margin: this.pageMargin });
    let yPosition = this.pageMargin;

    // Header
    yPosition = this.addHeader(doc, title, companyName, yPosition);

    // Reconciliation Summary
    yPosition = this.addReconciliationSummary(doc, data, yPosition);

    // Matched Items
    yPosition = this.addMatchedItems(doc, data.matched, yPosition);

    // Unmatched Transactions
    if (data.unmatchedTransactions?.length > 0) {
      yPosition = this.addUnmatchedSection(doc, 'Unmatched Transactions', data.unmatchedTransactions, yPosition);
    }

    // Unmatched Receipts
    if (data.unmatchedReceipts?.length > 0) {
      yPosition = this.addUnmatchedSection(doc, 'Unmatched Receipts', data.unmatchedReceipts, yPosition);
    }

    // Footer
    this.addFooter(doc);

    return doc;
  }

  // Helper Methods
  addHeader(doc, title, companyName, yPosition) {
    // Company Name
    doc.fontSize(12)
       .fillColor(this.colors.lightText)
       .text(companyName, this.pageMargin, yPosition);

    yPosition += 20;

    // Report Title
    doc.fontSize(24)
       .fillColor(this.colors.primary)
       .font('Helvetica-Bold')
       .text(title, this.pageMargin, yPosition);

    yPosition += 30;

    // Generated Date
    doc.fontSize(10)
       .fillColor(this.colors.lightText)
       .font('Helvetica')
       .text(`Generated on ${moment().format('MMMM DD, YYYY at h:mm A')}`, this.pageMargin, yPosition);

    yPosition += 40;

    // Separator Line
    doc.strokeColor(this.colors.primary)
       .lineWidth(2)
       .moveTo(this.pageMargin, yPosition)
       .lineTo(doc.page.width - this.pageMargin, yPosition)
       .stroke();

    return yPosition + 30;
  }

  addDateRange(doc, startDate, endDate, yPosition) {
    const start = startDate ? moment(startDate).format('MMMM DD, YYYY') : 'Beginning';
    const end = endDate ? moment(endDate).format('MMMM DD, YYYY') : 'Present';

    doc.fontSize(12)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold')
       .text(`Report Period: ${start} - ${end}`, this.pageMargin, yPosition);

    return yPosition + 30;
  }

  addStatsSummary(doc, stats, yPosition) {
    doc.fontSize(16)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold')
       .text('Summary', this.pageMargin, yPosition);

    yPosition += 25;

    const summaryData = [
      ['Total Transactions:', stats.totalTransactions.toLocaleString()],
      ['Total Amount:', `$${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Matched Transactions:', `${stats.matchedTransactions} (${stats.matchPercentage}%)`],
      ['Unmatched Transactions:', stats.unmatchedTransactions.toString()],
      ['Average Transaction:', `$${stats.averageTransaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
    ];

    summaryData.forEach(([label, value]) => {
      doc.fontSize(11)
         .fillColor(this.colors.text)
         .font('Helvetica')
         .text(label, this.pageMargin, yPosition)
         .font('Helvetica-Bold')
         .text(value, this.pageMargin + 150, yPosition);
      yPosition += 18;
    });

    return yPosition + 20;
  }

  addTransactionsTable(doc, transactions, yPosition, options) {
    doc.fontSize(16)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold')
       .text('Transactions', this.pageMargin, yPosition);

    yPosition += 25;

    // Table Headers
    const headers = ['Date', 'Description', 'Amount', 'Status'];
    const columnWidths = [80, 280, 80, 60];
    let xPosition = this.pageMargin;

    doc.fontSize(10)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold');

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition, { width: columnWidths[index] });
      xPosition += columnWidths[index] + 10;
    });

    yPosition += 20;

    // Header Line
    doc.strokeColor(this.colors.lightText)
       .lineWidth(1)
       .moveTo(this.pageMargin, yPosition)
       .lineTo(doc.page.width - this.pageMargin, yPosition)
       .stroke();

    yPosition += 10;

    // Table Rows
    doc.font('Helvetica')
       .fontSize(9);

    transactions.slice(0, 50).forEach(transaction => { // Limit to first 50
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = this.pageMargin;
      }

      xPosition = this.pageMargin;
      const rowData = [
        moment(transaction.transaction_date).format('MM/DD/YY'),
        transaction.description.substring(0, 35) + (transaction.description.length > 35 ? '...' : ''),
        `$${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        transaction.receipt_count > 0 ? 'Matched' : 'Unmatched'
      ];

      rowData.forEach((data, index) => {
        const color = index === 3 ? (data === 'Matched' ? this.colors.accent : this.colors.danger) : this.colors.text;
        doc.fillColor(color)
           .text(data, xPosition, yPosition, { width: columnWidths[index] });
        xPosition += columnWidths[index] + 10;
      });

      yPosition += 15;
    });

    if (transactions.length > 50) {
      yPosition += 10;
      doc.fillColor(this.colors.lightText)
         .fontSize(10)
         .text(`... and ${transactions.length - 50} more transactions`, this.pageMargin, yPosition);
      yPosition += 15;
    }

    return yPosition + 20;
  }

  addReceiptGroup(doc, groupKey, receipts, yPosition) {
    if (yPosition > doc.page.height - 150) {
      doc.addPage();
      yPosition = this.pageMargin;
    }

    doc.fontSize(14)
       .fillColor(this.colors.primary)
       .font('Helvetica-Bold')
       .text(groupKey, this.pageMargin, yPosition);

    yPosition += 25;

    receipts.forEach(receipt => {
      // Start new page if we don't have enough space for receipt + image
      if (yPosition > doc.page.height - 400) {
        doc.addPage();
        yPosition = this.pageMargin;
      }

      // Receipt header
      doc.fontSize(11)
         .fillColor(this.colors.text)
         .font('Helvetica-Bold')
         .text(receipt.original_filename, this.pageMargin + 20, yPosition);

      yPosition += 15;

      // Receipt details
      // Format date safely
      const dateFormats = ['MM/DD/YYYY', 'MM/DD/YY', 'M/D/YYYY', 'M/D/YY', 'YYYY-MM-DD'];
      const receiptDate = moment(receipt.extracted_date, dateFormats);
      const formattedDate = receiptDate.isValid() ? receiptDate.format('MM/DD/YYYY') : receipt.extracted_date || 'Unknown';

      const details = [
        `Date: ${formattedDate}`,
        `Amount: $${parseFloat(receipt.extracted_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `Merchant: ${receipt.extracted_merchant || 'Unknown'}`,
        `Status: ${receipt.match_status || 'Unmatched'}`
      ];

      doc.fontSize(9)
         .fillColor(this.colors.lightText)
         .font('Helvetica');

      details.forEach(detail => {
        doc.text(detail, this.pageMargin + 30, yPosition);
        yPosition += 12;
      });

      yPosition += 10;

      // Add receipt image
      yPosition = this.addReceiptImage(doc, receipt, yPosition);
    });

    return yPosition + 15;
  }

  addReceiptImage(doc, receipt, yPosition) {
    try {
      const filePath = receipt.file_path;
      
      // Check if file exists
      if (!filePath || !fs.existsSync(filePath)) {
        // File not found - show placeholder
        doc.fontSize(9)
           .fillColor('#e53e3e')
           .text('Receipt file not found', this.pageMargin + 30, yPosition);
        return yPosition + 20;
      }

      // Get file extension to determine type
      const fileExt = path.extname(receipt.original_filename).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
      
      if (imageExtensions.includes(fileExt)) {
        // Handle image files
        try {
          const maxWidth = 300;
          const maxHeight = 200;
          
          // Add the image to the PDF
          doc.image(filePath, this.pageMargin + 30, yPosition, {
            fit: [maxWidth, maxHeight],
            align: 'left'
          });
          
          // Calculate image height to adjust position
          const img = doc.openImage(filePath);
          const aspectRatio = img.height / img.width;
          const displayWidth = Math.min(maxWidth, img.width);
          const displayHeight = Math.min(maxHeight, displayWidth * aspectRatio);
          
          return yPosition + displayHeight + 20;
          
        } catch (imageError) {
          console.error('Error adding image to PDF:', imageError);
          doc.fontSize(9)
             .fillColor('#e53e3e')
             .text('Error loading receipt image', this.pageMargin + 30, yPosition);
          return yPosition + 20;
        }
        
      } else if (fileExt === '.pdf') {
        // Handle PDF files - show placeholder with note
        doc.fontSize(10)
           .fillColor(this.colors.text)
           .font('Helvetica-Bold')
           .text('PDF Receipt Document', this.pageMargin + 30, yPosition);
        
        doc.fontSize(9)
           .fillColor('#718096')
           .font('Helvetica')
           .text(`File: ${receipt.original_filename}`, this.pageMargin + 30, yPosition + 15);
        
        // Add a border to indicate this is a placeholder
        doc.rect(this.pageMargin + 30, yPosition + 35, 300, 80)
           .stroke('#e2e8f0');
           
        doc.fontSize(9)
           .fillColor('#4a5568')
           .text('PDF Receipt Preview Not Available', this.pageMargin + 40, yPosition + 50)
           .text('View original file for complete content', this.pageMargin + 40, yPosition + 65)
           .text('OCR extracted data shown above', this.pageMargin + 40, yPosition + 80);
        
        return yPosition + 130;
        
      } else {
        // Unknown file type
        doc.fontSize(9)
           .fillColor('#e53e3e')
           .text(`Unsupported file type: ${fileExt}`, this.pageMargin + 30, yPosition);
        return yPosition + 20;
      }
      
    } catch (error) {
      console.error('Error processing receipt file:', error);
      doc.fontSize(9)
         .fillColor('#e53e3e')
         .text('Error processing receipt file', this.pageMargin + 30, yPosition);
      return yPosition + 20;
    }
  }

  addKeyMetrics(doc, analytics, yPosition) {
    doc.fontSize(16)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold')
       .text('Key Metrics', this.pageMargin, yPosition);

    yPosition += 25;

    const metrics = [
      ['Total Expenses:', `$${analytics.totalExpenses?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`],
      ['Number of Transactions:', (analytics.transactionCount || 0).toLocaleString()],
      ['Number of Receipts:', (analytics.receiptCount || 0).toLocaleString()],
      ['Match Rate:', `${analytics.matchRate || 0}%`],
      ['Average Transaction:', `$${analytics.averageTransaction?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`],
      ['Most Expensive:', `$${analytics.highestTransaction?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`]
    ];

    const colWidth = (doc.page.width - 2 * this.pageMargin) / 2;
    let col = 0;

    metrics.forEach(([label, value], index) => {
      const xPos = this.pageMargin + (col * colWidth);
      
      doc.fontSize(11)
         .fillColor(this.colors.text)
         .font('Helvetica')
         .text(label, xPos, yPosition)
         .font('Helvetica-Bold')
         .text(value, xPos + 130, yPosition);

      if (index % 2 === 1) {
        yPosition += 18;
        col = 0;
      } else {
        col = 1;
      }
    });

    return yPosition + 30;
  }

  addFooter(doc) {
    const footerY = doc.page.height - 50;
    doc.fontSize(8)
       .fillColor(this.colors.lightText)
       .text(`Generated by Expense Receipt Matcher • Page ${doc.bufferedPageRange().count}`, 
             this.pageMargin, footerY, { align: 'center' });
  }

  calculateTransactionStats(transactions) {
    const total = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const matched = transactions.filter(t => t.receipt_count > 0).length;
    
    return {
      totalTransactions: total,
      totalAmount,
      matchedTransactions: matched,
      unmatchedTransactions: total - matched,
      matchPercentage: total > 0 ? Math.round((matched / total) * 100) : 0,
      averageTransaction: total > 0 ? totalAmount / total : 0
    };
  }

  groupReceipts(receipts, groupBy) {
    const groups = {};
    
    receipts.forEach(receipt => {
      let key;
      switch (groupBy) {
        case 'date':
          // Parse date with proper format (MM/DD/YYYY)
          const dateFormats = ['MM/DD/YYYY', 'MM/DD/YY', 'M/D/YYYY', 'M/D/YY', 'YYYY-MM-DD'];
          const receiptDate = moment(receipt.extracted_date, dateFormats);
          key = receiptDate.isValid() ? receiptDate.format('MMMM YYYY') : 'Unknown Date';
          break;
        case 'merchant':
          key = receipt.extracted_merchant || 'Unknown Merchant';
          break;
        case 'amount':
          const amount = parseFloat(receipt.extracted_amount || 0);
          if (amount < 25) key = 'Under $25';
          else if (amount < 100) key = '$25 - $100';
          else if (amount < 500) key = '$100 - $500';
          else key = 'Over $500';
          break;
        default:
          key = 'All Receipts';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(receipt);
    });

    return groups;
  }

  addCategoryBreakdown(doc, categories, yPosition) {
    if (!categories || categories.length === 0) return yPosition;

    doc.fontSize(16)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold')
       .text('Category Breakdown', this.pageMargin, yPosition);

    yPosition += 25;

    categories.forEach(category => {
      doc.fontSize(11)
         .fillColor(this.colors.text)
         .font('Helvetica')
         .text(category.name, this.pageMargin, yPosition)
         .text(`$${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, this.pageMargin + 200, yPosition)
         .text(`${category.percentage}%`, this.pageMargin + 300, yPosition);
      yPosition += 15;
    });

    return yPosition + 20;
  }

  addTrendsChart(doc, trends, yPosition) {
    if (!trends || trends.length === 0) return yPosition;

    doc.fontSize(16)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold')
       .text('Monthly Trends', this.pageMargin, yPosition);

    yPosition += 25;

    trends.forEach(trend => {
      doc.fontSize(10)
         .fillColor(this.colors.text)
         .font('Helvetica')
         .text(`${trend.month}: $${trend.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
               this.pageMargin, yPosition);
      yPosition += 12;
    });

    return yPosition + 20;
  }

  addRecommendations(doc, recommendations, yPosition) {
    if (!recommendations || recommendations.length === 0) return yPosition;

    doc.fontSize(16)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold')
       .text('Recommendations', this.pageMargin, yPosition);

    yPosition += 25;

    recommendations.forEach((rec, index) => {
      doc.fontSize(10)
         .fillColor(this.colors.text)
         .font('Helvetica')
         .text(`${index + 1}. ${rec}`, this.pageMargin, yPosition, { 
           width: doc.page.width - 2 * this.pageMargin 
         });
      yPosition += 25;
    });

    return yPosition + 20;
  }

  addReconciliationSummary(doc, data, yPosition) {
    doc.fontSize(16)
       .fillColor(this.colors.text)
       .font('Helvetica-Bold')
       .text('Reconciliation Summary', this.pageMargin, yPosition);

    yPosition += 25;

    const summary = [
      ['Total Matches:', data.matched?.length || 0],
      ['Unmatched Transactions:', data.unmatchedTransactions?.length || 0],
      ['Unmatched Receipts:', data.unmatchedReceipts?.length || 0],
      ['Match Rate:', `${data.matchRate || 0}%`]
    ];

    summary.forEach(([label, value]) => {
      doc.fontSize(11)
         .fillColor(this.colors.text)
         .font('Helvetica')
         .text(label, this.pageMargin, yPosition)
         .font('Helvetica-Bold')
         .text(value.toString(), this.pageMargin + 150, yPosition);
      yPosition += 18;
    });

    return yPosition + 20;
  }

  addMatchedItems(doc, matches, yPosition) {
    if (!matches || matches.length === 0) return yPosition;

    doc.fontSize(14)
       .fillColor(this.colors.accent)
       .font('Helvetica-Bold')
       .text('Matched Items', this.pageMargin, yPosition);

    yPosition += 20;

    matches.slice(0, 20).forEach(match => {
      if (yPosition > doc.page.height - 80) {
        doc.addPage();
        yPosition = this.pageMargin;
      }

      doc.fontSize(10)
         .fillColor(this.colors.text)
         .font('Helvetica-Bold')
         .text(`${match.transaction_description} - $${parseFloat(match.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
               this.pageMargin, yPosition);
      
      yPosition += 12;
      
      doc.fontSize(9)
         .fillColor(this.colors.lightText)
         .font('Helvetica')
         .text(`Receipt: ${match.receipt_filename} (${match.match_confidence}% confidence)`, 
               this.pageMargin + 10, yPosition);
      
      yPosition += 20;
    });

    return yPosition + 10;
  }

  addUnmatchedSection(doc, title, items, yPosition) {
    if (!items || items.length === 0) return yPosition;

    doc.fontSize(14)
       .fillColor(this.colors.danger)
       .font('Helvetica-Bold')
       .text(title, this.pageMargin, yPosition);

    yPosition += 20;

    items.slice(0, 15).forEach(item => {
      if (yPosition > doc.page.height - 60) {
        doc.addPage();
        yPosition = this.pageMargin;
      }

      const description = item.description || item.original_filename || 'Unknown';
      const amount = parseFloat(item.amount || item.extracted_amount || 0);
      
      doc.fontSize(10)
         .fillColor(this.colors.text)
         .font('Helvetica')
         .text(`${description} - $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
               this.pageMargin, yPosition);
      
      yPosition += 15;
    });

    return yPosition + 20;
  }
}

module.exports = new PDFService(); 