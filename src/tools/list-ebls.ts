import { z } from 'zod';
import { createApiClient, getDefaultHeaders, extractErrorMessage } from '../util/client.js';
import { EblSchema } from '../schemas/ebl.schema.js';
import { BillOfLadingDocumentType } from '../models/ebl.model.js';
import type { components } from '../types/bu-scheme.js';
import { EBlRecordType } from '../types/index.js';
import { eblParties, latestBillOfLadingEvent } from '../types/ebl-records.js';
import { fetchAuthenticationId } from '../util/auth.js';

// Type for the backend API response to GET /ebl
type ListBillOfLadingRecord = components['schemas']['ListBillOfLadingRecord'];

/**
 * Input schema for list_ebls tool
 * Maps to the query parameters for GET /ebl endpoint
 */
export const listEblsInputSchema = z.object({
  // Required parameters
  requester_bu_id: z
    .string()
    .describe('Business Unit ID making the request (will be passed as X-Business-Unit-ID header)'),
  // authentication_id: z.string().describe('Authentication ID for the request'),

  // Optional filtering parameters
  status: z
    .enum(['action_needed', 'upcoming', 'sent', 'archive'])
    .describe('Filter eBLs by status category. One of: action_needed, upcoming, sent, archive'),

  keyword: z.string().optional().describe('Search keyword, matches against From field or BL number'),

  // Pagination parameters
  offset: z.number().int().min(0).optional().default(0).describe('Number of items to skip'),

  limit: z.number().int().min(1).max(100).optional().default(20).describe('Number of items to return (max 100)'),

  // Extra options
  include_report: z.boolean().optional().default(false).describe('Whether to include status report counts in response'),
});

/**
 * Output schema for list_ebls tool
 * Maps the backend response to a simplified format for MCP clients
 */
export const listEblsOutputSchema = z.object({
  total: z.number().int().describe('Total number of eBLs matching the criteria'),
  ebls: z.array(EblSchema).describe('List of eBLs matching the criteria'),
  report: z
    .object({
      action_needed: z.number().int().optional().describe('Count of eBLs requiring action'),
      upcoming: z.number().int().optional().describe('Count of upcoming eBLs'),
      sent: z.number().int().optional().describe('Count of sent eBLs'),
      archive: z.number().int().optional().describe('Count of archived eBLs'),
    })
    .optional()
    .describe('Summary report of eBL counts by status'),
});

/**
 * Maps a BillOfLadingRecord from the API to our EblSchema format
 */
const mapBillOfLadingRecordToEbl = (record: EBlRecordType): z.infer<typeof EblSchema> | null => {
  const bl = record.bl;
  if (!bl) {
    throw new Error('Bill of Lading record does not contain BL data');
  }

  // Get the current bill of lading from the first event if available
  const latestEvent = latestBillOfLadingEvent(record);
  const billOfLading = latestEvent?.bill_of_lading_v3;

  if (!billOfLading) {
    return null;
  }

  // Create basic mapped object with defaults for required fields
  const mappedEbl: z.infer<typeof EblSchema> = {
    id: bl.id ?? '',
    version: bl.version ?? 1,
    blNumber: '',
    blDocType: BillOfLadingDocumentType.House,
    toOrder: false,
    pol: {
      locationName: '',
      UNLocationCode: '',
    },
    pod: {
      locationName: '',
      UNLocationCode: '',
    },
    issuer: '',
    shipper: '',
    consignee: '',
    releaseAgent: '',
    // holder: bl.current_owner ?? '',
    // createdAt: new Date().toISOString(),
    // createdBy: '',
    // updatedAt: new Date().toISOString(),
    // updatedBy: '',
  };

  // If we have event data with bill of lading, populate the fields
  if (billOfLading) {
    // Map all the fields that exist in the bill_of_lading object
    // We need to be careful with optional chaining since any field could be undefined

    // Map BL number if available
    if (typeof billOfLading.transportDocumentReference === 'string') {
      mappedEbl.blNumber = billOfLading.transportDocumentReference;
    }

    // Map document type if available
    mappedEbl.blDocType = BillOfLadingDocumentType.House;

    // Map to order flag if available
    mappedEbl.toOrder = false;

    // Map port of loading if available
    if (billOfLading.transports?.portOfLoading?.locationName) {
      mappedEbl.pol = {
        locationName: billOfLading.transports.portOfLoading.locationName ?? '',
        UNLocationCode: billOfLading.transports.portOfLoading.UNLocationCode ?? '',
      };
    }

    // Map port of discharge if available
    if (billOfLading.transports?.portOfDischarge?.locationName) {
      mappedEbl.pod = {
        locationName: billOfLading.transports.portOfDischarge.locationName ?? '',
        UNLocationCode: billOfLading.transports.portOfDischarge.UNLocationCode ?? '',
      };
    }

    const parties = eblParties(record);

    // Map other fields if available
    if (parties?.issuer) {
      mappedEbl.issuer = parties.issuer;
    }

    if (parties?.consignee) {
      mappedEbl.consignee = parties.consignee;
    }

    if (parties?.releaser) {
      mappedEbl.releaseAgent = parties.releaser;
    }

    if (parties?.endorsee) {
      mappedEbl.endorsee = parties.endorsee;
    }

    // if (parties?.notifyParties) {
    //   mappedEbl.notifyParties = parties.notifyParties;
    // }

    // if (typeof billOfLading.note === 'string') {
    //   mappedEbl.note = billOfLading.note;
    // }

    // if (typeof billOfLading.encrypt_content === 'boolean') {
    //   mappedEbl.encryptContent = billOfLading.encrypt_content;
    // }

    // Add file info if available
    // if (billOfLading.file) {
    //   mappedEbl.fileInfo = {
    //     name: billOfLading.file.name || '',
    //     file_type: billOfLading.file.type || '',
    //     created_date: new Date().toISOString(),
    //   };
    // }
  }

  // // Generate timestamps for createdAt and updatedAt
  // // Since the event object structure doesn't seem to match what we expected,
  // // we'll use the current date as a fallback
  // mappedEbl.createdAt = new Date().toISOString();
  // mappedEbl.updatedAt = new Date().toISOString();

  // // Set default creator/updater
  // mappedEbl.createdBy = 'System';
  // mappedEbl.updatedBy = 'System';

  return mappedEbl;
};

/**
 * Converts the List BL API response to our output schema format
 */
const convertApiResponseToOutput = (response: ListBillOfLadingRecord): z.infer<typeof listEblsOutputSchema> => {
  // Map records to our schema format
  console.error('Mapping records to EBL schema format');
  const ebls = (response.records ?? [])
    .map((record) => {
      try {
        return mapBillOfLadingRecordToEbl(record);
      } catch (error) {
        console.error('Error mapping BL record:', error);
        return null;
      }
    })
    .filter((ebl): ebl is z.infer<typeof EblSchema> => ebl !== null);

  // Create the output object
  const output: z.infer<typeof listEblsOutputSchema> = {
    total: response.total ?? ebls.length,
    ebls,
  };

  // Add report if available
  if (response.report) {
    output.report = {
      action_needed: response.report.action_needed,
      upcoming: response.report.upcoming,
      sent: response.report.sent,
      archive: response.report.archive,
    };
  }

  return output;
};

/**
 * Handles the list_ebls MCP Tool request
 * 1. Validates input parameters
 * 2. Makes GET /ebl request to backend API
 * 3. Transforms response to match listEblsOutputSchema
 */
export const handleListEblsTool = async (args: unknown) => {
  try {
    // Parse and validate the input parameters
    const validatedArgs = listEblsInputSchema.parse(args);

    // Create API client for this request
    const client = createApiClient();

    // Prepare query parameters
    const queryParams: Record<string, string | number | boolean> = {};

    if (validatedArgs.status) {
      queryParams.status = validatedArgs.status;
    }

    if (validatedArgs.keyword) {
      queryParams.keyword = validatedArgs.keyword;
    }

    queryParams.offset = validatedArgs.offset;
    queryParams.limit = validatedArgs.limit;
    queryParams.report = validatedArgs.include_report;

    // Call the backend API GET /ebl endpoint
    const { data, error } = await client.GET('/ebl', {
      headers: getDefaultHeaders(validatedArgs.requester_bu_id),
      params: {
        query: queryParams,
      },
    });

    // Handle API errors
    if (error) {
      throw new Error(`API error: ${extractErrorMessage(error)}`);
    }

    // Handle missing data in response
    if (!data) {
      throw new Error('No data returned from API');
    }

    // Transform the backend response to match our output schema
    const result = convertApiResponseToOutput(data);

    // Format a user-friendly summary
    const summaryText = formatResultSummary(result);

    console.error('Final:', summaryText);

    // Return the MCP tool response in the expected format
    return {
      content: [
        {
          type: 'text',
          text: summaryText,
        },
        {
          type: 'application/json',
          json: result,
        },
      ],
    };
  } catch (error) {
    console.error('Error in list_ebls tool:', error);

    // Check if it's a Zod validation error and format it appropriately
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');

      return {
        error: {
          content: [
            {
              type: 'text',
              text: `Validation error in list_ebls tool:\n${formattedErrors}`,
            },
          ],
        },
      };
    }

    // Generic error handling
    return {
      error: {
        content: [
          {
            type: 'text',
            text: `Error in list_ebls tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      },
    };
  }
};

/**
 * Formats a user-friendly summary of the eBL list results
 */
const formatResultSummary = (result: z.infer<typeof listEblsOutputSchema>): string => {
  const { total, ebls, report } = result;

  let summary = `Found ${total} electronic Bill${total === 1 ? '' : 's'} of Lading`;

  if (report) {
    summary += '\n\nStatus breakdown:';
    if (report.action_needed !== undefined) summary += `\n- Action needed: ${report.action_needed}`;
    if (report.upcoming !== undefined) summary += `\n- Upcoming: ${report.upcoming}`;
    if (report.sent !== undefined) summary += `\n- Sent: ${report.sent}`;
    if (report.archive !== undefined) summary += `\n- Archived: ${report.archive}`;
  }

  if (ebls.length > 0) {
    summary += `\n\nShowing ${ebls.length} result${ebls.length === 1 ? '' : 's'}:`;

    // Show brief summary of each eBL
    ebls.forEach((ebl, index) => {
      summary += `\n\n${index + 1}. ${ebl.blNumber} (${ebl.blDocType})`;
      summary += `\n   ID: ${ebl.id}`;
      summary += `\n   POL: ${ebl.pol.locationName || ebl.pol.UNLocationCode}`;
      summary += `\n   POD: ${ebl.pod.locationName || ebl.pod.UNLocationCode}`;
      // summary += `\n   Current holder: ${ebl.holder}`;
    });
  } else {
    summary += '\n\nNo eBLs match the specified criteria.';
  }

  return summary;
};

// Tool definition for MCP server
export const getListEblsToolDefinition = () => ({
  name: 'list_ebls',
  description: 'List all electronic Bills of Lading with optional filtering',
  inputSchema: {
    type: 'object',
    properties: {
      requester_bu_id: {
        type: 'string',
        description: 'Business Unit ID making the request (will be passed as X-Business-Unit-ID header)',
      },
      // authentication_id: {
      //   type: 'string',
      //   description: 'Authentication ID for the request',
      // },
      status: {
        type: 'string',
        enum: ['action_needed', 'upcoming', 'sent', 'archive'],
        description: 'Filter eBLs by status category. One of: action_needed, upcoming, sent, archive',
      },
      keyword: {
        type: 'string',
        description: 'Search keyword, matches against From field or BL number',
      },
      offset: {
        type: 'integer',
        minimum: 0,
        description: 'Number of items to skip',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        description: 'Number of items to return (max 100)',
      },
      include_report: {
        type: 'boolean',
        description: 'Whether to include status report counts in response',
      },
    },
    required: ['requester_bu_id', 'authentication_id'],
  },
});
