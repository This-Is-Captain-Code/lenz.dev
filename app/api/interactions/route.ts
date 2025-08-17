import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lensInteractions, insertLensInteractionSchema } from '@shared/schema';
import { eq, gte, desc } from 'drizzle-orm';
import { z } from 'zod';

// Track lens interactions for reward calculations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = insertLensInteractionSchema.parse(body);
    
    // Insert interaction record
    const [interaction] = await db
      .insert(lensInteractions)
      .values(validatedData)
      .returning();
    
    return NextResponse.json({ 
      success: true, 
      interaction 
    });
  } catch (error) {
    console.error('Failed to track interaction:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

// Get interactions summary for analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lensId = searchParams.get('lensId');
    const days = parseInt(searchParams.get('days') || '7');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let interactions;
    
    if (lensId) {
      interactions = await db
        .select()
        .from(lensInteractions)
        .where(
          eq(lensInteractions.lensId, lensId)
        )
        .orderBy(desc(lensInteractions.createdAt));
    } else {
      interactions = await db
        .select()
        .from(lensInteractions)
        .where(gte(lensInteractions.createdAt, startDate))
        .orderBy(desc(lensInteractions.createdAt));
    }
    
    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Failed to fetch interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}