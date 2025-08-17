import { NextResponse } from 'next/server';
import { storage } from '../../lib/storage';
import { insertUserLensSchema } from '../../../shared/schema';
import { z } from 'zod';

export async function GET() {
  try {
    // For now, return empty array since we don't have authentication
    // In a real app, you'd get the userId from the session
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching user lenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user lenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = insertUserLensSchema.parse(body);
    const userLens = await storage.addUserLens(validatedData);
    return NextResponse.json(userLens, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error adding user lens:', error);
    return NextResponse.json(
      { error: 'Failed to add lens to collection' },
      { status: 500 }
    );
  }
}