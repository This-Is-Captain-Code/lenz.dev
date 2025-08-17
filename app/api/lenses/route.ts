import { NextResponse } from 'next/server';
import { storage } from '../../../app/server/storage';

export async function GET() {
  try {
    const lenses = await storage.getAllLenses();
    return NextResponse.json(lenses);
  } catch (error) {
    console.error('Error fetching lenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lenses' },
      { status: 500 }
    );
  }
}