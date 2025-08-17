import { db } from './db';
import { lensInteractions, lenses, rewardDistributions, creatorRewards } from '@shared/schema';
import { sql, gte, lt, desc, eq } from 'drizzle-orm';
import { CDPRewardService, CreatorRewardData } from './cdp-rewards';

export class RewardCalculator {
  private cdpService: CDPRewardService;

  constructor(cdpService: CDPRewardService) {
    this.cdpService = cdpService;
  }

  // Calculate weighted interactions for a given time period
  async calculateCreatorWeights(weekStart: Date, weekEnd: Date): Promise<CreatorWeightData[]> {
    // Interaction weights (higher values = more reward weight)
    const interactionWeights = {
      'apply': 1,      // Basic lens application
      'capture': 3,    // Photo capture with lens
      'share': 5,      // Social sharing
      'download': 2,   // Lens download
    };

    // Get all interactions for the week grouped by lens creator
    const weeklyInteractions = await db
      .select({
        lensId: lensInteractions.lensId,
        creator: lenses.creator,
        interactionType: lensInteractions.interactionType,
        count: sql<number>`count(*)::int`,
      })
      .from(lensInteractions)
      .innerJoin(lenses, eq(lensInteractions.lensId, lenses.id))
      .where(
        sql`${lensInteractions.createdAt} >= ${weekStart} AND ${lensInteractions.createdAt} < ${weekEnd}`
      )
      .groupBy(lensInteractions.lensId, lenses.creator, lensInteractions.interactionType);

    // Calculate weighted scores per creator
    const creatorWeights = new Map<string, CreatorWeightData>();

    for (const interaction of weeklyInteractions) {
      const weight = interactionWeights[interaction.interactionType as keyof typeof interactionWeights] || 1;
      const weightedScore = interaction.count * weight;

      if (!creatorWeights.has(interaction.creator)) {
        creatorWeights.set(interaction.creator, {
          creatorName: interaction.creator,
          creatorAddress: '', // This needs to be mapped from a creator registry
          totalInteractions: 0,
          weightedScore: 0,
          lensIds: new Set(),
        });
      }

      const creatorData = creatorWeights.get(interaction.creator)!;
      creatorData.totalInteractions += interaction.count;
      creatorData.weightedScore += weightedScore;
      creatorData.lensIds.add(interaction.lensId);
    }

    return Array.from(creatorWeights.values());
  }

  // Calculate reward distribution for a week
  async calculateWeeklyRewards(
    weekStart: Date, 
    weekEnd: Date, 
    totalRewardPool: number
  ): Promise<CreatorRewardData[]> {
    const creatorWeights = await this.calculateCreatorWeights(weekStart, weekEnd);
    
    if (creatorWeights.length === 0) {
      return [];
    }

    // Calculate total weighted score across all creators
    const totalWeightedScore = creatorWeights.reduce(
      (sum, creator) => sum + creator.weightedScore, 
      0
    );

    // Calculate individual reward amounts based on weighted distribution
    const rewards: CreatorRewardData[] = creatorWeights.map(creator => {
      const rewardWeight = creator.weightedScore / totalWeightedScore;
      const rewardAmount = (totalRewardPool * rewardWeight).toFixed(6);

      return {
        creatorAddress: creator.creatorAddress || this.getDefaultCreatorAddress(creator.creatorName),
        creatorName: creator.creatorName,
        amount: rewardAmount,
        weight: rewardWeight,
        interactionCount: creator.totalInteractions,
      };
    });

    return rewards.filter(reward => parseFloat(reward.amount) > 0.01); // Min $0.01 threshold
  }

  // Process weekly rewards distribution
  async processWeeklyDistribution(): Promise<string> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Check if distribution already exists for this week
    const existingDistribution = await db
      .select()
      .from(rewardDistributions)
      .where(eq(rewardDistributions.weekStart, weekStart))
      .limit(1);

    if (existingDistribution.length > 0) {
      throw new Error('Reward distribution already exists for this week');
    }

    const totalRewardPool = 1000; // $1000 USDC per week

    try {
      // Calculate rewards
      const calculatedRewards = await this.calculateWeeklyRewards(
        weekStart, 
        weekEnd, 
        totalRewardPool
      );

      if (calculatedRewards.length === 0) {
        throw new Error('No eligible creators for reward distribution');
      }

      // Create distribution record
      const [distribution] = await db
        .insert(rewardDistributions)
        .values({
          weekStart,
          weekEnd,
          totalRewardPool: totalRewardPool.toString(),
          status: 'processing',
        })
        .returning();

      // Create individual creator reward records
      const creatorRewardRecords = calculatedRewards.map(reward => ({
        distributionId: distribution.id,
        creatorAddress: reward.creatorAddress,
        creatorName: reward.creatorName,
        interactionCount: reward.interactionCount,
        rewardWeight: reward.weight.toString(),
        rewardAmount: reward.amount,
        status: 'pending' as const,
      }));

      await db.insert(creatorRewards).values(creatorRewardRecords);

      // Execute reward distribution via CDP
      const transactionHashes = await this.cdpService.distributeRewards(calculatedRewards);

      // Update records with transaction hashes
      for (let i = 0; i < creatorRewardRecords.length; i++) {
        await db
          .update(creatorRewards)
          .set({
            transactionHash: transactionHashes[i],
            status: 'sent',
          })
          .where(
            sql`${creatorRewards.distributionId} = ${distribution.id} AND ${creatorRewards.creatorAddress} = ${calculatedRewards[i].creatorAddress}`
          );
      }

      // Mark distribution as completed
      await db
        .update(rewardDistributions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          transactionHash: transactionHashes[0], // Primary transaction hash
        })
        .where(eq(rewardDistributions.id, distribution.id));

      return distribution.id;

    } catch (error) {
      console.error('Failed to process weekly distribution:', error);
      throw error;
    }
  }

  // Get the start of the current week (Monday)
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(date.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  // Default creator address mapping (this should be replaced with a proper creator registry)
  private getDefaultCreatorAddress(creatorName: string): string {
    // Mock creator addresses - in production, this should be a proper lookup
    const creatorAddresses: Record<string, string> = {
      'Jenil Panchal': '0x742d35Cc6635C0532925a3b8D79dC964ed2B8CC1', // Example Base address
      'LenZ Team': '0x8ba1f109551bD432803012645Hac136c7c3e8d6b',
      'AR Creator': '0x9fB1c8a3d4e5f6789a0b1c2d3e4f5g6h7i8j9k0l',
    };

    return creatorAddresses[creatorName] || '0x742d35Cc6635C0532925a3b8D79dC964ed2B8CC1';
  }
}

interface CreatorWeightData {
  creatorName: string;
  creatorAddress: string;
  totalInteractions: number;
  weightedScore: number;
  lensIds: Set<string>;
}

export const rewardCalculator = new RewardCalculator(
  new CDPRewardService()
);