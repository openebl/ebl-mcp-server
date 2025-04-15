// src/models/ebl.model.ts

// Based on external/bu/api.yaml components/schemas

/**
 * Represents a geographical location, potentially using UN/LOCODE.
 */
export interface Location {
  locationName?: string; // Optional: Name of the location
  UNLocationCode: string; // UN location code (e.g., USNYC, SGPAS)
}

/**
 * Represents file content, typically for upload/input.
 */
export interface FileContent {
  name: string; // File name
  type: string; // MIME type
  content: string; // base64-encoded content
}

/**
 * Represents metadata about a file associated with an eBL.
 */
export interface FileInfo {
  name: string; // File name
  file_type: string; // MIME type
  created_date?: string; // ISO 8601 date-time string
}

/**
 * B/L Document Type (Master or House).
 */
export enum BillOfLadingDocumentType {
  Master = "MasterBillOfLading",
  House = "HouseBillOfLading",
}

/**
 * Possible statuses of an eBL lifecycle.
 * Derived from BillOfLadingAction and common eBL states.
 */
export enum EblStatus {
  Draft = 'draft',
  Issued = 'issued',
  Transferred = 'transferred', // Intermediate state during transfer? Or just use holder?
  Surrendered = 'surrendered', // Surrendered to release agent
  Accomplished = 'accomplished', // Cargo released
  Returned = 'returned', // Returned to previous holder/issuer
  AmendmentRequested = 'amendment_requested',
  Amended = 'amended',
  PrintedToPaper = 'printed_to_paper',
  Deleted = 'deleted', // For drafts
}

/**
 * Represents the core Electronic Bill of Lading data structure.
 */
export interface Ebl {
  id: string; // Unique identifier for the eBL (e.g., generated UUID or DID)
  version: number; // Version number, incremented on changes
  blNumber: string; // Bill of Lading number
  blDocType: BillOfLadingDocumentType; // Master or House
  toOrder: boolean; // Is it a negotiable "to order" B/L?
  pol: Location; // Port of Loading
  pod: Location; // Port of Discharge
  eta?: string; // Estimated Time of Arrival (ISO 8601 date string)
  shipper: string; // DID of the shipper Business Unit
  consignee: string; // DID of the consignee Business Unit
  endorsee?: string; // DID of the endorsee (required if toOrder=true and not draft)
  releaseAgent: string; // DID of the release agent Business Unit
  notifyParties?: string[]; // DIDs of notify parties (max 3)
  note?: string; // Additional notes
  status: EblStatus; // Current status of the eBL
  holder: string; // DID of the current holder Business Unit
  fileInfo?: FileInfo; // Metadata about the attached eBL document
  createdAt: string; // ISO 8601 date-time string
  createdBy: string; // DID of the user/agent who created it
  updatedAt: string; // ISO 8601 date-time string
  updatedBy: string; // DID of the user/agent who last updated it
  encryptContent?: boolean; // Should the content be encrypted? (Defaults to false)
  // Potentially add history/events array later
  // metadata?: Record<string, any>; // Optional application-specific metadata
}
