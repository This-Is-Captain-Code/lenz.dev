import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../../lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lens = await storage.getLens(id);
    if (!lens) {
      return NextResponse.json(
        { error: 'Lens not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(lens);
  } catch (error) {
    console.error('Error fetching lens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lens' },
      { status: 500 }
    );
  }
}