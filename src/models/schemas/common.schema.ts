// Reusable schema fields
export const nullableString = { type: String, default: null };
export const nullableTrimmedString = { type: String, trim: true, default: null };
export const countryCode = { type: String, uppercase: true, trim: true };
