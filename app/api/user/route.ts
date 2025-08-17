import { NextResponse } from 'next/server';

export async function GET() {
  // For now, return a simple mock user since we're not implementing full auth in this migration
  return NextResponse.json({
    id: '1',
    username: 'demo_user',
    isAuthenticated: true
  });
}