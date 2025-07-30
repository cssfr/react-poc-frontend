import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui';
import { Alert, AlertDescription } from '../ui';
import { Badge } from '../ui';
import { cn } from '../../lib/utils';
import { parseTradesCSV, validateCSVFile, readFileAsText } from '../../lib/trading/csvParser';
import type { ProcessedTrade, TradeUploadResult } from '../../types/trading';

interface TradeUploadProps {
  onTradesUploaded: (trades: ProcessedTrade[]) => void;
  loading?: boolean;
  className?: string;
}

export default function TradeUpload({ onTradesUploaded, loading = false, className }: TradeUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<TradeUploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileValidation = useCallback((file: File) => {
    const validationError = validateCSVFile(file);
    if (validationError) {
      setUploadResult({
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', value: file.name, message: validationError }],
        totalRows: 0,
        validRows: 0
      });
      return false;
    }
    return true;
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!handleFileValidation(file)) return;

    setUploading(true);
    setSelectedFile(file);
    setUploadResult(null);

    try {
      const csvContent = await readFileAsText(file);
      const result = await parseTradesCSV(csvContent);
      
      setUploadResult(result);
      
      if (result.success && result.data.length > 0) {
        onTradesUploaded(result.data);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        data: [],
        errors: [{ 
          row: 0, 
          field: 'processing', 
          value: file.name, 
          message: error instanceof Error ? error.message : 'Unknown error occurred' 
        }],
        totalRows: 0,
        validRows: 0
      });
    } finally {
      setUploading(false);
    }
  }, [handleFileValidation, onTradesUploaded]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const clearResults = useCallback(() => {
    setUploadResult(null);
    setSelectedFile(null);
  }, []);

  const isProcessing = uploading || loading;

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Area */}
      {!uploadResult && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-primary/50',
            isProcessing && 'opacity-50 pointer-events-none'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium">
                {isProcessing ? 'Processing CSV...' : 'Upload Trading Results'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isProcessing 
                  ? 'Parsing trades and validating data...'
                  : 'Drag and drop your CSV file here, or click to select'
                }
              </p>
            </div>
            
            {!isProcessing && (
              <Button variant="outline" size="sm">
                <File className="h-4 w-4 mr-2" />
                Choose CSV File
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div className="space-y-4">
          {/* Success/Error Summary */}
          <Alert variant={uploadResult.success ? 'default' : 'destructive'}>
            {uploadResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {uploadResult.success ? (
                <div className="flex items-center justify-between">
                  <span>
                    Successfully imported <strong>{uploadResult.validRows}</strong> trades
                    {uploadResult.errors.length > 0 && (
                      <span className="text-muted-foreground">
                        {' '}with {uploadResult.errors.length} warnings
                      </span>
                    )}
                  </span>
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    <X className="h-4 w-4 mr-2" />
                    Upload New File
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span>
                    Failed to import trades. {uploadResult.errors.length} errors found.
                  </span>
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    <X className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* File Info */}
          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </Badge>
            </div>
          )}

          {/* Statistics */}
          {uploadResult.success && uploadResult.data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">{uploadResult.data.length}</div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.data.filter(t => t.pnlValue > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Winning</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.data.filter(t => t.pnlValue < 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Losing</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {new Set(uploadResult.data.map(t => t.symbol)).size}
                </div>
                <div className="text-sm text-muted-foreground">Symbols</div>
              </div>
            </div>
          )}

          {/* Errors List */}
          {uploadResult.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {uploadResult.success ? 'Warnings:' : 'Errors:'}
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {uploadResult.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded border-l-2 border-destructive">
                    <span className="font-medium">Row {error.row}:</span> {error.message}
                    {error.field !== 'general' && (
                      <span className="text-muted-foreground"> (field: {error.field})</span>
                    )}
                  </div>
                ))}
                {uploadResult.errors.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center p-2">
                    ... and {uploadResult.errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 