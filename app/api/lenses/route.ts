import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../lib/storage';
import { insertLensSchema } from '../../../shared/schema';
import { z } from 'zod';

export async function GET() {
  try {
    const lenses = await storage.getLenses();
    return NextResponse.json(lenses);
  } catch (error) {
    console.error('Error fetching lenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertLensSchema.parse(body);
    const lens = await storage.createLens(validatedData);
    return NextResponse.json(lens, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid lens data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating lens:', error);
    return NextResponse.json(
      { error: 'Failed to create lens' },
      { status: 500 }
    );
  }
}