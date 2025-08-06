// Load dotenv only during local development
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

export const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
export const sheetName = process.env.GOOGLE_SHEET_NAME as string;
export const serviceAccountCredentials = JSON.parse(
  process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS as string
);
