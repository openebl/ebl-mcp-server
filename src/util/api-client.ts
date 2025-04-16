/**
 * HTTP client utilities for communicating with the backend BU API
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
};

/**
 * Makes an HTTP request to the backend BU API
 */
export const makeApiRequest = async <T>(
  endpoint: string,
  options: RequestOptions
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Only try to parse JSON if there's a response body
    if (response.status === 204) {
      return null as T;
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Error making API request to ${endpoint}:`, error);
    throw error;
  }
};
