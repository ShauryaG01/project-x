/**
 * Error types for the application
 */

/**
 * Base error type for adapter errors
 */
export class MetabaseAdapterError extends Error {
  code: string;
  cause?: unknown;

  constructor(message: string, code: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'MetabaseAdapterError';
    this.code = code;
    this.cause = options?.cause;
  }
}

/**
 * Error codes for adapter errors
 */
export enum AdapterErrorCode {
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  SCHEMA_EXTRACTION_FAILED = 'SCHEMA_EXTRACTION_FAILED',
  QUERY_EXECUTION_FAILED = 'QUERY_EXECUTION_FAILED',
  RESULT_EXTRACTION_FAILED = 'RESULT_EXTRACTION_FAILED',
  INVALID_SELECTOR = 'INVALID_SELECTOR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
} 