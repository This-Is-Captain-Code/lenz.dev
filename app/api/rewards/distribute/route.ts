import { NextRequest, NextResponse } from 'next/server';
import { rewardCalculator } from '@/lib/reward-calculator';
import { db } from '@/lib/db';
import { rewardDistributions } from '@shared/schema';
import { desc } from 'drizzle-orm';

// Manual trigger for weekly reward distribution (admin only)
export async function POST(request: NextRequest) {
  try {
    // In production, add authentication/authorization here
    // const authResult = await verifyAdminAuth(request);
    // if (!authResult.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    console.log('Starting weekly reward distribution...');
    
    const distributionId = await rewardCalculator.processWeeklyDistribution();
    
    return NextResponse.json({ 
      success: true, 
      distributionId,
      message: 'Weekly reward distribution completed successfully'
    });
  } catch (error) {
    console.error('Failed to process reward distribution:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process reward distribution',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get distribution history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const distributions = await db
      .select()
      .from(rewardDistributions)
      .orderBy(desc(rewardDistributions.createdAt))
      .limit(limit);
    
    return NextResponse.json({ distributions });
  } catch (error) {
    console.error('Failed to fetch distributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch distributions' },
      { status: 500 }
    );
  }
}