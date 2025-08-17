/**
 * Configuration for the Camera Kit integration
 */

// Your updated credentials
export const SNAP_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzU1NDE1NTk3LCJzdWIiOiI4OTBkNjZiOC03OTliLTRjNGItOWJjNS1mYWFlNTNkYmJhY2J-U1RBR0lOR35iYmZkMjFmOS0xMGIzLTQxMjItODBkNi0zN2JiOGQyNjUxYjUifQ.cbddVIF2ZSWwXrA2NQVZDUlWdCMLXeDGR2GvvAfjb6s';
export const SNAP_GROUP_ID = '753b00f7-d785-4799-b3b6-09bb39ef53ae';
export const SNAP_APP_ID = '890d66b8-799b-4c4b-9bc5-faae53dbbacb';
export const DEFAULT_LENS_ID = 'c0858ad5-11f4-4ba8-b7b9-edb9b64a2164';

export const config = {
  snap: {
    apiToken: SNAP_API_TOKEN,
    groupId: SNAP_GROUP_ID
  }
};

export default config;