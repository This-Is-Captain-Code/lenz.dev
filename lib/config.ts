/**
 * Configuration for the Camera Kit integration
 */

export const SNAP_API_TOKEN = process.env.NEXT_PUBLIC_SNAP_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzQ0ODA0MTU5LCJzdWIiOiIzYjM3YjZmZi0yMDI4LTQ3OTAtYmE3YS1jZGIyYWQ4OTc0NTF-U1RBR0lOR34wZGIxZWY5ZC1lM2RjLTQ0YjgtYmI1ZS1mZmE2NDYwOTRjMjcifQ.gh5mg-KtZQynKFw4pnBqU2AcrRstbtedDwNtO3beX8k';
export const SNAP_GROUP_ID = process.env.NEXT_PUBLIC_SNAP_GROUP_ID || 'b5551368-7881-4a23-a034-a0e757ec85a7';
export const DEFAULT_LENS_ID = '49a28a50-9294-475b-bdb5-d0b7395109e2';

export const config = {
  snap: {
    apiToken: SNAP_API_TOKEN,
    groupId: SNAP_GROUP_ID
  }
};

export default config;
