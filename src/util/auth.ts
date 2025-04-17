/**
 * Authentication utilities for the BU API
 */
import createClient from 'openapi-fetch';
import type { paths } from '../types/bu-scheme.js';

// Get environment variables with defaults for local development
const BU_SERVER_URL = process.env.BU_SERVER_URL || 'http://localhost:8080';
const BU_SERVER_API_KEY = process.env.BU_SERVER_API_KEY || '';

/**
 * Fetches an active authentication ID for a business unit
 */
export const fetchAuthenticationId = async (businessUnitId: string): Promise<string> => {
  // Create client for this specific request
  const client = createClient<paths>({
    baseUrl: BU_SERVER_URL,
  });

  // Make the request to the business unit endpoint
  console.error('Fetching authentication ID for business unit:', businessUnitId);
  const { data, error } = await client.GET('/business_unit/{id}', {
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: BU_SERVER_API_KEY ? `Bearer ${BU_SERVER_API_KEY}` : undefined,
    },
    params: { path: { id: businessUnitId } },
  });

  // Handle errors
  if (error) {
    console.error('Error fetching authentication ID:', error);
    throw new Error(
      `Failed to fetch authentication ID: ${typeof error === 'object' ? JSON.stringify(error) : String(error)}`,
    );
  }

  if (!data) {
    throw new Error('No data returned from business unit endpoint');
  }

  // Find first authentication which status is active
  const activeAuthentication = data.authentications?.find((auth) => auth.status === 'active');

  if (!activeAuthentication) {
    throw new Error(`No active authentication found for business unit: ${businessUnitId}`);
  }

  return activeAuthentication.id ?? '';
};

/**
 * Validates whether an authentication is active
 * Note: This function checks if there is an active authentication for the given business unit
 */
export const isAuthenticationActive = async (businessUnitId: string, authenticationId: string): Promise<boolean> => {
  try {
    const client = createClient<paths>({
      baseUrl: BU_SERVER_URL,
    });

    // Get all authentications for the business unit
    const { data, error } = await client.GET('/business_unit/{id}', {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: BU_SERVER_API_KEY ? `Bearer ${BU_SERVER_API_KEY}` : undefined,
      },
      params: { path: { id: businessUnitId } },
    });

    if (error || !data || !data.authentications) {
      console.error('Failed to validate authentication:', error);
      return false;
    }

    // Find the specified authentication and check if it's active
    const authRecord = data.authentications.find((auth) => auth.id === authenticationId);
    return authRecord?.status === 'active';
  } catch (error) {
    console.error('Error validating authentication:', error);
    return false;
  }
};
