import { NextRequest, NextResponse } from 'next/server';
import { squidBridgeService } from '@/lib/squid-bridge';
import { z } from 'zod';

const BridgeFeesSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  fromAddress: z.string().min(1, 'From address is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, fromAddress } = BridgeFeesSchema.parse(body);

    const feeEstimate = await squidBridgeService.calculateBridgeFees(amount, fromAddress);

    return NextResponse.json({
      success: true,
      feeEstimate
    });
  } catch (error) {
    console.error('Bridge fee calculation failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors,
          success: false 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to calculate bridge fees',
        success: false 
      },
      { status: 500 }
    );
  }
}