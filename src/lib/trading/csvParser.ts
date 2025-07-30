/**
 * CSV parsing utilities for trading data
 * Supports multiple broker formats with extensible architecture
 */

import Papa from 'papaparse';
import type { CSVTradeRow, ProcessedTrade, TradeUploadError, TradeUploadResult } from '../../types/trading';

/**
 * Parse timestamp string to Unix timestamp (milliseconds)
 */
function parseTimestamp(timestampStr: string): number {
  // Handle format: "07/22/2025 15:46:34"
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp format: ${timestampStr}`);
  }
  return date.getTime();
}

/**
 * Parse PnL string and extract numeric value
 */
function parsePnL(pnlStr: string): number {
  // Handle formats: "$50.00", "$(25.00)", "-$25.00"
  const cleaned = pnlStr.replace(/[\$\,\(\)]/g, '');
  const value = parseFloat(cleaned);
  if (isNaN(value)) {
    throw new Error(`Invalid PnL format: ${pnlStr}`);
  }
  // If original had parentheses, it's negative
  return pnlStr.includes('(') ? -Math.abs(value) : value;
}

/**
 * Calculate duration in minutes for sorting
 */
function parseDurationToMinutes(durationStr: string): number {
  // Handle formats: "1min 25sec", "1h 2min 32sec", "2h 18min 48sec"
  let totalMinutes = 0;
  
  const hourMatch = durationStr.match(/(\d+)h/);
  const minMatch = durationStr.match(/(\d+)min/);
  const secMatch = durationStr.match(/(\d+)sec/);
  
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1]);
  if (secMatch) totalMinutes += parseInt(secMatch[1]) / 60;
  
  return totalMinutes;
}

/**
 * Process a single CSV row into a ProcessedTrade
 */
function processTradeRow(row: CSVTradeRow, rowIndex: number): ProcessedTrade {
  try {
    const buyPrice = parseFloat(row.buyPrice);
    const sellPrice = parseFloat(row.sellPrice);
    const quantity = parseFloat(row.qty);
    const pnlValue = parsePnL(row.pnl);
    const entryTime = parseTimestamp(row.boughtTimestamp);
    const exitTime = parseTimestamp(row.soldTimestamp);
    
    // Determine trade direction
    // Long trade: buy low, sell high (buyPrice is entry, sellPrice is exit)
    // Short trade: sell high, buy low to cover (sellPrice is entry, buyPrice is exit)
    const direction: 'long' | 'short' = buyPrice < sellPrice ? 'long' : 'short';
    const entryPrice = direction === 'long' ? buyPrice : sellPrice;
    const exitPrice = direction === 'long' ? sellPrice : buyPrice;
    
    return {
      symbol: row.symbol,
      buyPrice,
      sellPrice,
      quantity,
      pnl: row.pnl,
      pnlValue,
      boughtTimestamp: row.boughtTimestamp,
      soldTimestamp: row.soldTimestamp,
      duration: row.duration,
      direction,
      entryTime,
      exitTime,
      entryPrice,
      exitPrice,
      buyFillId: row.buyFillId,
      sellFillId: row.sellFillId,
      priceFormat: parseFloat(row._priceFormat),
      priceFormatType: parseFloat(row._priceFormatType),
      tickSize: parseFloat(row._tickSize),
    };
  } catch (error) {
    throw new Error(`Row ${rowIndex + 1}: ${error.message}`);
  }
}

/**
 * Parse CSV file and convert to ProcessedTrade array
 */
export function parseTradesCSV(csvContent: string): Promise<TradeUploadResult> {
  return new Promise((resolve) => {
    const errors: TradeUploadError[] = [];
    const trades: ProcessedTrade[] = [];
    
    Papa.parse<CSVTradeRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        // Clean up any extra whitespace
        return typeof value === 'string' ? value.trim() : value;
      },
      complete: (results) => {
        const totalRows = results.data.length;
        
        // Process each row
        results.data.forEach((row, index) => {
          try {
            // Validate required fields
            const requiredFields = ['symbol', 'buyPrice', 'sellPrice', 'qty', 'pnl', 'boughtTimestamp', 'soldTimestamp'];
            for (const field of requiredFields) {
              if (!row[field as keyof CSVTradeRow] || row[field as keyof CSVTradeRow] === '') {
                errors.push({
                  row: index + 1,
                  field,
                  value: row[field as keyof CSVTradeRow] || '',
                  message: `Missing required field: ${field}`
                });
                return; // Skip this row
              }
            }
            
            const processedTrade = processTradeRow(row, index);
            trades.push(processedTrade);
          } catch (error) {
            errors.push({
              row: index + 1,
              field: 'general',
              value: JSON.stringify(row),
              message: error instanceof Error ? error.message : 'Unknown error processing row'
            });
          }
        });
        
        // Sort trades by entry time (newest first)
        trades.sort((a, b) => b.entryTime - a.entryTime);
        
        resolve({
          success: errors.length === 0,
          data: trades,
          errors,
          totalRows,
          validRows: trades.length
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [{
            row: 0,
            field: 'file',
            value: '',
            message: `CSV parsing error: ${error.message}`
          }],
          totalRows: 0,
          validRows: 0
        });
      }
    });
  });
}

/**
 * Validate file before processing
 */
export function validateCSVFile(file: File): string | null {
  if (!file) return 'No file selected';
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return 'Please select a CSV file';
  }
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return 'File size must be less than 10MB';
  }
  return null;
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
} 