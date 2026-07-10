// romcal ships no types of its own; calendar.ts treats its output as `any`
// and re-types it through the local RomcalEntry interface instead.
declare module 'romcal';
