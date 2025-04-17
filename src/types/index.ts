import type { components } from './bu-scheme.d.ts';

type EBlAllowAction = components['schemas']['BillOfLadingAction'];
type EBlRecordType = components['schemas']['BillOfLadingRecord'];
type EBlRecordListType = components['schemas']['ListBillOfLadingRecord'];
type EBlEventType = components['schemas']['BillOfLadingEvent'];

export { EBlAllowAction, EBlRecordType, EBlRecordListType, EBlEventType };
