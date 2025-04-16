/**
 * API client using openapi-fetch with generated types from OpenAPI spec
 */
import createClient from 'openapi-fetch';
import type { paths } from '../types/bu-scheme.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

// Create API client with typed operations from the OpenAPI schema
export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
});

// Helper to extract the error message from API responses
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    
    // Try to find common error message patterns in responses
    if ('message' in errObj && typeof errObj.message === 'string') {
      return errObj.message;
    }
    
    if ('error' in errObj && typeof errObj.error === 'string') {
      return errObj.error;
    }
  }
  
  return String(error);
};
