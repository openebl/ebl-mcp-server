import { EBlRecordType, EBlEventType } from './index.js';
import { findLast } from 'remeda';

export type EBlPartiesType = {
  issuer?: string;
  shipper?: string;
  consignee?: string;
  releaser?: string;
  endorsee?: string;
};

export type EBlStatusType =
  | 'UPDATE'
  | 'TRANSFER'
  | 'RETURN'
  | 'REQUEST_AMEND'
  | 'SURRENDER'
  | 'PRINT'
  | 'ACCOMPLISH'
  | 'UNKNOWN';

export function latestBillOfLadingEvent(record: EBlRecordType) {
  if (!record.bl?.events) return undefined;

  // find the last ISSUED event
  const event = findLast(record.bl.events, (event) => !!event.bill_of_lading?.bill_of_lading_v3);

  return event?.bill_of_lading;
}

export function eBlNo(record: EBlRecordType) {
  return latestBillOfLadingEvent(record)?.bill_of_lading_v3?.transportDocumentReference;
}

export function eblParties(record: EBlRecordType, excludeDraft = true): EBlPartiesType | undefined {
  if (!record?.bl?.events) return undefined;

  let billOfLadingEvent: EBlEventType['bill_of_lading'] | undefined;
  if (excludeDraft) {
    // find the last ISSUED event
    billOfLadingEvent = findLast(
      record.bl.events,
      (event) => event.bill_of_lading?.bill_of_lading_v3?.transportDocumentStatus === 'ISSUED',
    )?.bill_of_lading;
  } else {
    billOfLadingEvent = latestBillOfLadingEvent(record);
  }

  const parties = billOfLadingEvent?.bill_of_lading_v3?.documentParties;
  if (!parties) return {} as EBlPartiesType;

  // const key = partyFunctionToPartyCodeMap[party.partyFunction];
  // return key ? { ...acc, [key]: partyCode(party.party) } : acc;

  return {
    issuer: parties.issuingParty?.identifyingCodes?.[0]?.partyCode,
    shipper: parties.shipper?.identifyingCodes?.[0]?.partyCode,
    consignee: parties.consignee?.identifyingCodes?.[0]?.partyCode,
    endorsee: parties.endorsee?.identifyingCodes?.[0]?.partyCode,
    releaser: parties.other?.find((n) => n.partyFunction === 'DDS')?.party.identifyingCodes?.[0]?.partyCode,
  };
}
