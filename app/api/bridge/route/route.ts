import { NextRequest, NextResponse } from 'next/server';
import { squidBridgeService } from '@/lib/squid-bridge';
import { z } from 'zod';

const BridgeRouteSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  fromAddress: z.string().min(1, 'From address is required'),
  toAddress: z.string().min(1, 'To address is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, fromAddress, toAddress } = BridgeRouteSchema.parse(body);

    const route = await squidBridgeService.getBridgeRoute({
      amount,
      fromAddress,
      toAddress
    });

    return NextResponse.json({
      success: true,
      route
    });
  } catch (error) {
    console.error('Bridge route calculation failed:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to calculate bridge route',
        success: false 
      },
      { status: 500 }
    );
  }
}