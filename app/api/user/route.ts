import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return null for guest user (matching the Express implementation)
    return NextResponse.json(null);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}