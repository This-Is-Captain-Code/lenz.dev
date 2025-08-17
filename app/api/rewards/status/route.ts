import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rewardDistributions, creatorRewards } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';

// Get current reward distribution status and recent distributions
export async function GET(request: NextRequest) {
  try {
    // Get latest distribution
    const [latestDistribution] = await db
      .select()
      .from(rewardDistributions)
      .orderBy(desc(rewardDistributions.createdAt))
      .limit(1);

    // Get recent distributions with creator rewards
    const recentDistributions = await db
      .select()
      .from(rewardDistributions)
      .orderBy(desc(rewardDistributions.createdAt))
      .limit(5);

    // Get creator rewards for the latest distribution
    let latestCreatorRewards: any[] = [];
    if (latestDistribution) {
      latestCreatorRewards = await db
        .select()
        .from(creatorRewards)
        .where(eq(creatorRewards.distributionId, latestDistribution.id))
        .orderBy(desc(creatorRewards.rewardAmount));
    }

    // Calculate stats
    const stats = {
      totalDistributions: recentDistributions.length,
      totalRewardsDistributed: recentDistributions
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + parseFloat(d.totalRewardPool), 0),
      activeCreators: latestCreatorRewards.length,
      lastDistributionDate: latestDistribution?.createdAt || null,
    };

    return NextResponse.json({
      stats,
      latestDistribution,
      latestCreatorRewards,
      recentDistributions,
    });
  } catch (error) {
    console.error('Failed to fetch reward status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reward status' },
      { status: 500 }
    );
  }
}