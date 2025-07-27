const ExcelJS = require('exceljs');
const moment = require('moment');

class ExcelService {
  constructor() {
    this.colors = {
      header: 'FF4472C4',
      accent: 'FF70AD47',
      warning: 'FFFFC000',
      danger: 'FFE74C3C',
      light: 'FFF2F2F2'
    };
  }

  // Generate Transactions Export
  async generateTransactionsExport(transactions, options = {}) {
    const {
      companyName = 'Company',
      includeMatched = true,
      includeUnmatched = true,
      startDate,
      endDate
    } = options;

    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Expense Receipt Matcher';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    this.setupSummarySheet(summarySheet, transactions, companyName, startDate, endDate);

    // Transactions Sheet
    const transactionsSheet = workbook.addWorksheet('Transactions');
    this.setupTransactionsSheet(transactionsSheet, transactions, { includeMatched, includeUnmatched });

    // Matched Transactions Sheet
    const matchedTransactions = transactions.filter(t => t.receipt_count > 0);
    if (matchedTransactions.length > 0) {
      const matchedSheet = workbook.addWorksheet('Matched');
      this.setupTransactionsSheet(matchedSheet, matchedTransactions, { title: 'Matched Transactions' });
    }

    // Unmatched Transactions Sheet
    const unmatchedTransactions = transactions.filter(t => t.receipt_count === 0);
    if (unmatchedTransactions.length > 0) {
      const unmatchedSheet = workbook.addWorksheet('Unmatched');
      this.setupTransactionsSheet(unmatchedSheet, unmatchedTransactions, { title: 'Unmatched Transactions' });
    }

    return workbook;
  }

  // Generate Receipts Export
  async generateReceiptsExport(receipts, options = {}) {
    const {
      companyName = 'Company',
      includeOCRData = true
    } = options;

    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Expense Receipt Matcher';
    workbook.created = new Date();

    // Receipts Summary
    const summarySheet = workbook.addWorksheet('Summary');
    this.setupReceiptsSummarySheet(summarySheet, receipts, companyName);

    // Receipts Detail
    const detailSheet = workbook.addWorksheet('Receipts');
    this.setupReceiptsSheet(detailSheet, receipts, { includeOCRData });

    // Receipts by Merchant
    const merchantSheet = workbook.addWorksheet('By Merchant');
    this.setupReceiptsByMerchantSheet(merchantSheet, receipts);

    // Receipts by Month
    const monthlySheet = workbook.addWorksheet('By Month');
    this.setupReceiptsByMonthSheet(monthlySheet, receipts);

    return workbook;
  }

  // Generate Tax Report Export
  async generateTaxReportExport(data, options = {}) {
    const {
      companyName = 'Company',
      taxYear = new Date().getFullYear(),
      quarters = true
    } = options;

    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Expense Receipt Matcher';
    workbook.created = new Date();

    // Tax Summary Sheet
    const summarySheet = workbook.addWorksheet('Tax Summary');
    this.setupTaxSummarySheet(summarySheet, data, companyName, taxYear);

    // Quarterly Breakdown (if requested)
    if (quarters && data.quarters) {
      data.quarters.forEach((quarter, index) => {
        const quarterSheet = workbook.addWorksheet(`Q${index + 1} ${taxYear}`);
        this.setupQuarterlyTaxSheet(quarterSheet, quarter, index + 1, taxYear);
      });
    }

    // Category Breakdown
    const categorySheet = workbook.addWorksheet('Categories');
    this.setupTaxCategorySheet(categorySheet, data.categories);

    // Deductible Expenses
    const deductibleSheet = workbook.addWorksheet('Deductible');
    this.setupDeductibleExpensesSheet(deductibleSheet, data.deductibleExpenses);

    return workbook;
  }

  // Generate Reconciliation Export
  async generateReconciliationExport(data, options = {}) {
    const {
      companyName = 'Company',
      period = 'Current Period'
    } = options;

    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Expense Receipt Matcher';
    workbook.created = new Date();

    // Reconciliation Summary
    const summarySheet = workbook.addWorksheet('Summary');
    this.setupReconciliationSummarySheet(summarySheet, data, companyName, period);

    // Matched Items
    if (data.matched && data.matched.length > 0) {
      const matchedSheet = workbook.addWorksheet('Matched Items');
      this.setupMatchedItemsSheet(matchedSheet, data.matched);
    }

    // Unmatched Transactions
    if (data.unmatchedTransactions && data.unmatchedTransactions.length > 0) {
      const unmatchedTxnSheet = workbook.addWorksheet('Unmatched Transactions');
      this.setupUnmatchedTransactionsSheet(unmatchedTxnSheet, data.unmatchedTransactions);
    }

    // Unmatched Receipts
    if (data.unmatchedReceipts && data.unmatchedReceipts.length > 0) {
      const unmatchedReceiptsSheet = workbook.addWorksheet('Unmatched Receipts');
      this.setupUnmatchedReceiptsSheet(unmatchedReceiptsSheet, data.unmatchedReceipts);
    }

    return workbook;
  }

  // Setup Methods for Different Sheets
  setupSummarySheet(sheet, transactions, companyName, startDate, endDate) {
    // Header
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = `${companyName} - Transaction Summary`;
    sheet.getCell('A1').style = this.getHeaderStyle();

    // Period
    if (startDate || endDate) {
      const start = startDate ? moment(startDate).format('MM/DD/YYYY') : 'Beginning';
      const end = endDate ? moment(endDate).format('MM/DD/YYYY') : 'Present';
      sheet.mergeCells('A2:E2');
      sheet.getCell('A2').value = `Period: ${start} - ${end}`;
      sheet.getCell('A2').style = this.getSubHeaderStyle();
    }

    // Calculate statistics
    const stats = this.calculateStats(transactions);
    
    // Summary data
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Transactions', stats.total.toLocaleString()],
      ['Total Amount', `$${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Matched Transactions', `${stats.matched} (${stats.matchPercentage}%)`],
      ['Unmatched Transactions', stats.unmatched.toString()],
      ['Average Transaction', `$${stats.averageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Highest Transaction', `$${stats.highestAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Lowest Transaction', `$${stats.lowestAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
    ];

    // Add summary data starting from row 4
    this.addDataTable(sheet, summaryData, 4, 1, true);

    // Auto-fit columns
    sheet.columns = [
      { width: 25 },
      { width: 20 }
    ];
  }

  setupTransactionsSheet(sheet, transactions, options = {}) {
    const { title = 'Transactions', includeMatched = true, includeUnmatched = true } = options;

    // Header
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').style = this.getHeaderStyle();

    // Column headers
    const headers = [
      'Date',
      'Description', 
      'Amount',
      'Category',
      'Transaction ID',
      'Sales Tax',
      'Status',
      'Receipt Count'
    ];

    // Add headers
    headers.forEach((header, index) => {
      const cell = sheet.getCell(3, index + 1);
      cell.value = header;
      cell.style = this.getColumnHeaderStyle();
    });

    // Filter transactions based on options
    let filteredTransactions = transactions;
    if (!includeMatched) {
      filteredTransactions = transactions.filter(t => t.receipt_count === 0);
    }
    if (!includeUnmatched) {
      filteredTransactions = transactions.filter(t => t.receipt_count > 0);
    }

    // Add transaction data
    filteredTransactions.forEach((transaction, index) => {
      const rowIndex = index + 4;
      
      sheet.getCell(rowIndex, 1).value = new Date(transaction.transaction_date);
      sheet.getCell(rowIndex, 1).numFmt = 'mm/dd/yyyy';
      
      sheet.getCell(rowIndex, 2).value = transaction.description;
      sheet.getCell(rowIndex, 3).value = parseFloat(transaction.amount || 0);
      sheet.getCell(rowIndex, 3).numFmt = '"$"#,##0.00';
      
      sheet.getCell(rowIndex, 4).value = transaction.category || '';
      sheet.getCell(rowIndex, 5).value = transaction.external_transaction_id || '';
      
      sheet.getCell(rowIndex, 6).value = parseFloat(transaction.sales_tax || 0);
      sheet.getCell(rowIndex, 6).numFmt = '"$"#,##0.00';
      
      const status = transaction.receipt_count > 0 ? 'Matched' : 'Unmatched';
      sheet.getCell(rowIndex, 7).value = status;
      
      // Style status cell
      const statusCell = sheet.getCell(rowIndex, 7);
      if (status === 'Matched') {
        statusCell.style = this.getStatusStyle('matched');
      } else {
        statusCell.style = this.getStatusStyle('unmatched');
      }
      
      sheet.getCell(rowIndex, 8).value = transaction.receipt_count || 0;
    });

    // Auto-fit columns
    sheet.columns = [
      { width: 12 }, // Date
      { width: 40 }, // Description
      { width: 15 }, // Amount
      { width: 20 }, // Category
      { width: 20 }, // Transaction ID
      { width: 12 }, // Sales Tax
      { width: 12 }, // Status
      { width: 12 }  // Receipt Count
    ];

    // Add totals row
    const totalRow = filteredTransactions.length + 4;
    sheet.getCell(totalRow, 1).value = 'TOTAL:';
    sheet.getCell(totalRow, 1).style = this.getTotalStyle();
    
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    sheet.getCell(totalRow, 3).value = totalAmount;
    sheet.getCell(totalRow, 3).numFmt = '"$"#,##0.00';
    sheet.getCell(totalRow, 3).style = this.getTotalStyle();

    const totalTax = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.sales_tax || 0), 0);
    sheet.getCell(totalRow, 6).value = totalTax;
    sheet.getCell(totalRow, 6).numFmt = '"$"#,##0.00';
    sheet.getCell(totalRow, 6).style = this.getTotalStyle();
  }

  setupReceiptsSheet(sheet, receipts, options = {}) {
    const { includeOCRData = true } = options;

    // Header
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = 'Receipt Details';
    sheet.getCell('A1').style = this.getHeaderStyle();

    // Column headers
    const headers = [
      'Filename',
      'Upload Date',
      'File Size (KB)',
      'Extracted Amount',
      'Extracted Date',
      'Extracted Merchant',
      'Processing Status',
      'Match Status',
      'OCR Confidence'
    ];

    // Add headers
    headers.forEach((header, index) => {
      const cell = sheet.getCell(3, index + 1);
      cell.value = header;
      cell.style = this.getColumnHeaderStyle();
    });

    // Add receipt data
    receipts.forEach((receipt, index) => {
      const rowIndex = index + 4;
      
      sheet.getCell(rowIndex, 1).value = receipt.original_filename;
      sheet.getCell(rowIndex, 2).value = new Date(receipt.upload_date);
      sheet.getCell(rowIndex, 2).numFmt = 'mm/dd/yyyy hh:mm';
      
      sheet.getCell(rowIndex, 3).value = Math.round((receipt.file_size || 0) / 1024);
      
      sheet.getCell(rowIndex, 4).value = parseFloat(receipt.extracted_amount || 0);
      sheet.getCell(rowIndex, 4).numFmt = '"$"#,##0.00';
      
      if (receipt.extracted_date) {
        sheet.getCell(rowIndex, 5).value = new Date(receipt.extracted_date);
        sheet.getCell(rowIndex, 5).numFmt = 'mm/dd/yyyy';
      }
      
      sheet.getCell(rowIndex, 6).value = receipt.extracted_merchant || '';
      sheet.getCell(rowIndex, 7).value = receipt.processing_status || 'pending';
      sheet.getCell(rowIndex, 8).value = receipt.match_status || 'unmatched';
      sheet.getCell(rowIndex, 9).value = receipt.ocr_confidence || '';
    });

    // Auto-fit columns
    sheet.columns = [
      { width: 30 }, // Filename
      { width: 18 }, // Upload Date
      { width: 12 }, // File Size
      { width: 15 }, // Amount
      { width: 12 }, // Date
      { width: 25 }, // Merchant
      { width: 15 }, // Processing Status
      { width: 12 }, // Match Status
      { width: 12 }  // OCR Confidence
    ];
  }

  // Helper Methods for Styling
  getHeaderStyle() {
    return {
      font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.header } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: this.getAllBorders()
    };
  }

  getSubHeaderStyle() {
    return {
      font: { bold: true, size: 12 },
      alignment: { horizontal: 'center' },
      border: this.getAllBorders()
    };
  }

  getColumnHeaderStyle() {
    return {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.header } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: this.getAllBorders()
    };
  }

  getStatusStyle(status) {
    const baseStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center' },
      border: this.getAllBorders()
    };

    if (status === 'matched') {
      baseStyle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.accent } };
    } else {
      baseStyle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.warning } };
    }

    return baseStyle;
  }

  getTotalStyle() {
    return {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.light } },
      border: this.getAllBorders()
    };
  }

  getAllBorders() {
    return {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  // Helper Methods
  calculateStats(transactions) {
    const amounts = transactions.map(t => parseFloat(t.amount || 0));
    const total = transactions.length;
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const matched = transactions.filter(t => t.receipt_count > 0).length;

    return {
      total,
      totalAmount,
      matched,
      unmatched: total - matched,
      matchPercentage: total > 0 ? Math.round((matched / total) * 100) : 0,
      averageAmount: total > 0 ? totalAmount / total : 0,
      highestAmount: amounts.length > 0 ? Math.max(...amounts) : 0,
      lowestAmount: amounts.length > 0 ? Math.min(...amounts) : 0
    };
  }

  addDataTable(sheet, data, startRow, startCol, hasHeaders = false) {
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellRef = sheet.getCell(startRow + rowIndex, startCol + colIndex);
        cellRef.value = cell;
        
        if (hasHeaders && rowIndex === 0) {
          cellRef.style = this.getColumnHeaderStyle();
        } else {
          cellRef.style = { border: this.getAllBorders() };
        }
      });
    });
  }

  setupReceiptsSummarySheet(sheet, receipts, companyName) {
    // Header
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = `${companyName} - Receipt Summary`;
    sheet.getCell('A1').style = this.getHeaderStyle();

    // Calculate receipt statistics
    const totalReceipts = receipts.length;
    const totalAmount = receipts.reduce((sum, r) => sum + parseFloat(r.extracted_amount || 0), 0);
    const processedReceipts = receipts.filter(r => r.processing_status === 'completed').length;
    const matchedReceipts = receipts.filter(r => r.match_status === 'matched').length;

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Receipts', totalReceipts.toLocaleString()],
      ['Total Amount', `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Processed Receipts', `${processedReceipts} (${Math.round((processedReceipts / totalReceipts) * 100)}%)`],
      ['Matched Receipts', `${matchedReceipts} (${Math.round((matchedReceipts / totalReceipts) * 100)}%)`],
      ['Average Amount', `$${totalReceipts > 0 ? (totalAmount / totalReceipts).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}`]
    ];

    this.addDataTable(sheet, summaryData, 3, 1, true);

    // Auto-fit columns
    sheet.columns = [
      { width: 25 },
      { width: 20 }
    ];
  }

  setupReceiptsByMerchantSheet(sheet, receipts) {
    // Header
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'Receipts by Merchant';
    sheet.getCell('A1').style = this.getHeaderStyle();

    // Group by merchant
    const merchantGroups = {};
    receipts.forEach(receipt => {
      const merchant = receipt.extracted_merchant || 'Unknown';
      if (!merchantGroups[merchant]) {
        merchantGroups[merchant] = { count: 0, totalAmount: 0 };
      }
      merchantGroups[merchant].count++;
      merchantGroups[merchant].totalAmount += parseFloat(receipt.extracted_amount || 0);
    });

    // Convert to array and sort by total amount
    const merchantData = Object.entries(merchantGroups)
      .map(([merchant, data]) => [
        merchant,
        data.count,
        `$${data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${(data.totalAmount / data.count).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ])
      .sort((a, b) => parseFloat(b[2].replace(/[$,]/g, '')) - parseFloat(a[2].replace(/[$,]/g, '')));

    // Add headers
    const headers = ['Merchant', 'Receipt Count', 'Total Amount', 'Average Amount'];
    merchantData.unshift(headers);

    this.addDataTable(sheet, merchantData, 3, 1, true);

    // Auto-fit columns
    sheet.columns = [
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];
  }

  setupReceiptsByMonthSheet(sheet, receipts) {
    // Header
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'Receipts by Month';
    sheet.getCell('A1').style = this.getHeaderStyle();

    // Group by month
    const monthGroups = {};
    receipts.forEach(receipt => {
      // Parse date with proper format (MM/DD/YYYY)
      const dateFormats = ['MM/DD/YYYY', 'MM/DD/YY', 'M/D/YYYY', 'M/D/YY', 'YYYY-MM-DD'];
      const receiptDate = moment(receipt.extracted_date, dateFormats);
      
      if (receiptDate.isValid()) {
        const month = receiptDate.format('YYYY-MM');
        if (!monthGroups[month]) {
          monthGroups[month] = { count: 0, totalAmount: 0 };
        }
        monthGroups[month].count++;
        monthGroups[month].totalAmount += parseFloat(receipt.extracted_amount || 0);
      }
    });

    // Convert to array and sort by month
    const monthData = Object.entries(monthGroups)
      .map(([month, data]) => [
        moment(month).format('MMMM YYYY'),
        data.count,
        `$${data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${(data.totalAmount / data.count).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ])
      .sort((a, b) => moment(a[0], 'MMMM YYYY').valueOf() - moment(b[0], 'MMMM YYYY').valueOf());

    // Add headers
    const headers = ['Month', 'Receipt Count', 'Total Amount', 'Average Amount'];
    monthData.unshift(headers);

    this.addDataTable(sheet, monthData, 3, 1, true);

    // Auto-fit columns
    sheet.columns = [
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];
  }
}

module.exports = new ExcelService(); 