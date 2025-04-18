// src/schemas/ebl.schema.ts
import { z } from 'zod';
import { BillOfLadingDocumentType } from '../models/ebl.model.js'; // Import enum
// EblStatus enum is no longer needed for issue input/output schemas
// import { EblStatus } from '../models/ebl.model.js';

// Schema for Location based on the interface
const LocationSchema = z.object({
  locationName: z.string(),
  UNLocationCode: z.string().optional(), // Match backend optionality
});

// Schema for File Content (required for backend POST /ebl)
const FileContentSchema = z.object({
  name: z.string(),
  type: z.string(), // MIME type
  content: z.string(), // Base64 encoded content
});

// Base Input schema for issuing a new electronic Bill of Lading (matching backend request body)
export const issueEblInputSchema = z
  .object({
    // --- Fields required by backend API ---
    // authentication_id: z.string(),
    requester_bu_id: z.string(), // Used for X-Business-Unit-ID header
    file_content: FileContentSchema, // Changed from file_info, now required
    bl_number: z.string(),
    bl_doc_type: z.nativeEnum(BillOfLadingDocumentType),
    pol: LocationSchema,
    pod: LocationSchema,
    shipper: z.string(), // DID of the shipper BU
    consignee: z.string(), // DID of the consignee BU
    release_agent: z.string(), // DID of the release agent BU
    draft: z.boolean(),

    // --- Optional/Conditional fields based on backend API ---
    to_order: z.boolean().optional(), // Optional in backend request
    eta: z.string().date().optional(), // Optional, format: date
    endorsee: z.string().optional(), // Optional, DID, required if !draft && to_order
    notify_parties: z.array(z.string()).max(3).optional(), // Optional, DIDs, required if !draft && to_order
    note: z.string().optional(),
    encrypt_content: z.boolean().optional().default(false),
    // metadata: z.any().optional(), // Optional ApplicationMetaData if needed later

    // --- Fields removed (not part of backend input) ---
    // id: z.string().optional(),
    // version: z.number().optional(),
    // status: z.nativeEnum(EblStatus).optional(),
    // holder: z.string().optional(),
    // file_info: FileInfoSchema.optional(), // Replaced by file_content
    // created_at: z.string().datetime().optional(),
    // created_by: z.string().optional(),
    // updated_at: z.string().datetime().optional(),
    // updated_by: z.string().optional(),
  })
  .describe('Input schema for the issue_ebl MCP Tool, mapping to backend POST /ebl request.');

// Refined input schema for conditional 'endorsee' and 'notify_parties' requirements
export const refinedIssueEblInputSchema = issueEblInputSchema;
/*.refine(
  (data: z.infer<typeof issueEblInputSchema>) => {
    // If issuing (not drafting) and it's 'to_order', endorsee must be provided
    if (!data.draft && data.to_order && (typeof data.endorsee !== 'string' || data.endorsee.trim() === '')) {
      return false;
    }
    // If issuing (not drafting) and it's 'to_order', notify_parties must be provided
    if (!data.draft && data.to_order && (!data.notify_parties || data.notify_parties.length === 0)) {
      return false;
    }
    return true;
  },
  {
    // Custom error message for refinement failure
    message: "If issuing (draft=false) and to_order=true, both 'endorsee' and 'notify_parties' must be provided.",
    // Specify paths for error reporting if refinement fails
    path: ['endorsee', 'notify_parties'],
  },
);
*/

// --- Output Schema ---
// Represents the simplified confirmation returned by the backend POST /ebl
// Mapped from BillOfLadingRecord -> BillOfLadingPack
export const issueEblOutputSchema = z
  .object({
    id: z.string().describe('Unique ID of the created eB/L'),
    version: z.number().int().describe('Initial version of the created eB/L (usually 1)'),
    holder: z.string().describe('DID of the current holder/owner of the created eB/L'),
  })
  .describe('Output schema for the issue_ebl MCP Tool, confirming creation.');

// --- Schemas below are NOT directly used for issue_ebl input/output anymore ---
// --- but kept for potential use in other tools/resources (e.g., get_ebl) ---

// Schema for FileInfo based on the interface (Metadata only)
const FileInfoSchema = z.object({
  name: z.string(),
  file_type: z.string(),
  created_date: z.string().datetime(),
});

// Full EBL Schema based on the model interface (Used for GET /ebl/{id} potentially)
// Note: Needs alignment with backend BillOfLadingRecord/BillOfLadingPack if used for GET
export const EblSchema = z.object({
  id: z.string(),
  version: z.number().int(),
  blNumber: z.string(),
  blDocType: z.nativeEnum(BillOfLadingDocumentType),
  toOrder: z.boolean().optional(),
  pol: LocationSchema,
  pod: LocationSchema,
  eta: z.string().datetime().optional(),
  issuer: z.string(),
  shipper: z.string(),
  consignee: z.string(),
  endorsee: z.string().optional(),
  releaseAgent: z.string(),
  notifyParties: z.array(z.string()).optional(),
  note: z.string().optional(),
  // status: z.nativeEnum(EblStatus), // Status might be derived from events/allow_actions in backend record
  // holder: z.string(),
  // fileInfo: FileInfoSchema.optional(),
  // createdAt: z.string().datetime(),
  // createdBy: z.string(),
  // updatedAt: z.string().datetime(),
  // updatedBy: z.string(),
  // encryptContent: z.boolean().optional(),
  // --- Fields derived from backend BillOfLadingRecord ---
  // allow_actions: z.array(z.string()).optional(), // Map from backend
  // events: z.array(z.any()).optional(), // Map from backend BillOfLadingPack
});
