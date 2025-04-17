/**
 * API client utilities for the BU API using openapi-fetch with generated types
 */
import createClient from 'openapi-fetch';
import type { paths } from '../types/bu-scheme.js';

// Get environment variables with fallbacks for development
const BU_SERVER_URL = process.env.BU_SERVER_URL ?? 'http://localhost:8080';
const BU_SERVER_API_KEY = process.env.BU_SERVER_API_KEY ?? '';

/**
 * Creates a new API client for the Business Unit API
 * We create a new client per request to avoid issues with shared state
 */
export const createApiClient = () => {
  return createClient<paths>({
    baseUrl: BU_SERVER_URL,
  });
};

/**
 * Creates default headers for API requests including authorization if available
 */
export const getDefaultHeaders = (businessUnitId?: string) => {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: BU_SERVER_API_KEY ? `Bearer ${BU_SERVER_API_KEY}` : '',
  };

  // Add business unit ID header if provided
  if (businessUnitId) {
    headers['X-Business-Unit-ID'] = businessUnitId;
  }

  return headers;
};

/**
 * Helper to extract error messages from API responses
 */
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
