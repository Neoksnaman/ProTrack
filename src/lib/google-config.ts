import 'dotenv/config'; // Loads .env automatically

// Spreadsheet settings
export const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
export const sheetName = process.env.GOOGLE_SHEET_NAME as string;

// Parse Google service account credentials from environment variable
export const serviceAccountCredentials = JSON.parse(
  process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS as string
);
