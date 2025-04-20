import { z } from 'zod';
import createClient from 'openapi-fetch';
import { getDefaultHeaders, extractErrorMessage } from '../util/client.js';
import { refinedIssueEblInputSchema, issueEblOutputSchema } from '../schemas/ebl.schema.js';
import type { paths, components } from '../types/bu-scheme.js';
import { fetchAuthenticationId } from '../util/auth.js';

// Type for the backend API response to POST /ebl
type BillOfLadingRecord = components['schemas']['BillOfLadingRecord'];

/**
 * Fetches file content from a URL and returns it in the format expected by the API
 */
async function fetchFileFromUrl(url: string): Promise<{ name: string; type: string; content: string }> {
  try {
    // Fetch the file from the URL using native fetch API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.status} ${response.statusText}`);
    }

    // Get content type and extract filename from Content-Disposition or URL
    const contentType = response.headers.get('content-type') || 'application/pdf';

    // Try to get filename from Content-Disposition header
    let filename = '';
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const filenameMatch = /filename="?([^"]*)"?/i.exec(contentDisposition);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // If no filename from headers, extract from URL
    if (!filename) {
      const urlPath = new URL(url).pathname;
      const pathParts = urlPath.split('/');
      filename = pathParts[pathParts.length - 1] || 'document.pdf';
    }

    // Convert file to base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Content = buffer.toString('base64');

    return {
      name: filename,
      type: contentType,
      content: base64Content,
    };
  } catch (error) {
    console.error('Error fetching file from URL:', error);
    throw new Error(`Failed to fetch file from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts the input from MCP format to the OpenAPI schema format
 */
const convertMcpInputToApiRequest = async (
  input: z.infer<typeof refinedIssueEblInputSchema>,
  authentication_id: string,
): Promise<components['schemas']['UpdateBillOfLadingRequest']> => {
  // Most fields map directly from MCP input to API request
  const baseRequest = {
    authentication_id,
    bl_number: input.bl_number,
    bl_doc_type: input.bl_doc_type,
    pol: input.pol,
    pod: input.pod,
    shipper: input.shipper,
    consignee: input.consignee,
    release_agent: input.release_agent,
    draft: input.draft,
    to_order: input.to_order,
    eta: input.eta,
    endorsee: input.endorsee ?? undefined,
    notify_parties: input.notify_parties,
    note: input.note,
    encrypt_content: input.encrypt_content,
  };

  // Handle file content based on its source type
  if (input.file_content.source === 'url') {
    // For URL source, fetch the file and convert to expected format
    const fileData = await fetchFileFromUrl(input.file_content.url);

    return {
      ...baseRequest,
      file: fileData,
    };
  } else {
    // For direct content source, map file_content to file as expected by the OpenAPI schema
    return {
      ...baseRequest,
      file: {
        name: input.file_content.name,
        type: input.file_content.type,
        content: input.file_content.content,
      },
    };
  }
};

/**
 * Extracts the simplified output from the API response
 */
const extractOutputFromApiResponse = (response: BillOfLadingRecord): z.infer<typeof issueEblOutputSchema> => {
  // Access nested fields based on OpenAPI schema structure
  const bl = response.bl;

  return {
    // Extract id, version, and holder from the appropriate nested locations
    id: bl?.id ?? '',
    version: bl?.version ?? 1,
    holder: bl?.current_owner ?? '',
  };
};

/**
 * Handles the issue_ebl MCP Tool request
 * 1. Validates input with refinedIssueEblInputSchema
 * 2. Transforms input for backend API call
 * 3. Makes POST /ebl request to backend using openapi-fetch
 * 4. Transforms response to match issueEblOutputSchema
 */
export const handleIssueEblTool = async (args: unknown) => {
  try {
    // Parse and validate arguments using the refined schema with conditional validation
    const validatedArgs = refinedIssueEblInputSchema.parse(args);

    const authentication_id = await fetchAuthenticationId(validatedArgs.requester_bu_id);

    // Convert MCP input to API request format
    const requestBody = await convertMcpInputToApiRequest(validatedArgs, authentication_id);

    // Create API client using openapi-fetch
    const client = createClient<paths>({ baseUrl: process.env.BU_SERVER_URL });

    console.error('Issuing eBL with request:', JSON.stringify(requestBody, null, 2));

    // Call the backend API POST /ebl endpoint using openapi-fetch
    const { data, error } = await client.POST('/ebl', {
      headers: getDefaultHeaders(validatedArgs.requester_bu_id),
      body: requestBody,
    });

    // Handle API errors
    if (error) {
      console.error('API error:', error);
      throw new Error(`API error: ${extractErrorMessage(error)}`);
    }

    // Handle missing data in response
    if (!data) {
      throw new Error('No data returned from API');
    }

    // Transform the backend response to match our output schema
    const result = extractOutputFromApiResponse(data);

    // Validate the output against our schema
    const validatedOutput = issueEblOutputSchema.parse(result);

    // Return the MCP tool response
    return {
      result: {
        content: [
          {
            type: 'text',
            text: `Successfully ${validatedArgs.draft ? 'drafted' : 'issued'} eBL: ${JSON.stringify(validatedOutput, null, 2)}`,
          },
        ],
      },
    };
  } catch (error) {
    console.error('Error in issue_ebl tool:', error);

    // Check if it's a Zod validation error and format it appropriately
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');

      return {
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Validation error in issue_ebl tool:\n${formattedErrors}`,
            },
          ],
        },
      };
    }

    // Generic error handling
    return {
      result: {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error in issue_ebl tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      },
    };
  }
};

// Tool definition for MCP server
export const getIssueEblToolDefinition = () => ({
  name: 'issue_ebl',
  description: 'Issue or draft a new electronic Bill of Lading',
  inputSchema: {
    type: 'object',
    properties: {
      requester_bu_id: {
        type: 'string',
        description: 'Business Unit ID of the requester',
      },
      file_content: {
        type: 'object',
        oneOf: [
          {
            // URL source variant
            properties: {
              source: {
                type: 'string',
                enum: ['url'],
                description: 'Indicates file content will be fetched from a URL',
              },
              url: {
                type: 'string',
                format: 'uri',
                description: 'URL to the PDF file to use for the eBL',
              },
            },
            required: ['source', 'url'],
          },
          {
            // Direct content variant
            properties: {
              source: {
                type: 'string',
                enum: ['content'],
                description: 'Indicates file content is provided directly',
              },
              name: {
                type: 'string',
                description: 'Filename of the document',
              },
              type: {
                type: 'string',
                description: 'MIME type of the document (e.g., application/pdf)',
              },
              content: {
                type: 'string',
                description: 'Base64-encoded content of the document',
              },
            },
            required: ['source', 'name', 'type', 'content'],
          },
        ],
        description: 'File content information - either a URL to fetch from or direct base64-encoded content',
      },
      bl_number: {
        type: 'string',
        description: 'Bill of Lading number',
      },
      bl_doc_type: {
        type: 'string',
        enum: ['MasterBillOfLading', 'HouseBillOfLading'],
        description: 'Bill of Lading document type. Must be "HouseBillOfLading" for now',
      },
      pol: {
        type: 'object',
        properties: {
          locationName: { type: 'string' },
          UNLocationCode: { type: 'string' },
        },
        required: ['UNLocationCode'],
        description: 'Port of Loading',
      },
      pod: {
        type: 'object',
        properties: {
          locationName: { type: 'string' },
          UNLocationCode: { type: 'string' },
        },
        required: ['UNLocationCode'],
        description: 'Port of Discharge',
      },
      shipper: {
        type: 'string',
        description: 'DID of the shipper Business Unit',
      },
      consignee: {
        type: 'string',
        description: 'DID of the consignee Business Unit',
      },
      release_agent: {
        type: 'string',
        description: 'DID of the release agent Business Unit',
      },
      draft: {
        type: 'boolean',
        description: 'Whether to create as draft (true) or issue (false)',
      },
      to_order: {
        type: 'boolean',
        description: 'Whether the eBL is to order',
      },
      eta: {
        type: 'string',
        description: 'Estimated Time of Arrival (ISO date string)',
      },
      endorsee: {
        type: 'string',
        description: 'DID of the endorsee Business Unit (only if to_order is true)',
      },
      notify_parties: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Array of DIDs for notify parties',
      },
      note: {
        type: 'string',
        description: 'Additional notes for the eBL',
      },
      encrypt_content: {
        type: 'boolean',
        description: 'Whether to encrypt the content of the eBL',
      },
    },
    required: [
      'requester_bu_id',
      'file_content',
      'bl_number',
      'bl_doc_type',
      'pol',
      'pod',
      'shipper',
      'consignee',
      'release_agent',
      'draft',
    ],
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the issued eBL',
      },
      version: {
        type: 'number',
        description: 'Version number of the issued eBL',
      },
      holder: {
        type: 'string',
        description: 'DID of the current holder of the issued eBL',
      },
    },
    required: ['id', 'version', 'holder'],
  },
});
