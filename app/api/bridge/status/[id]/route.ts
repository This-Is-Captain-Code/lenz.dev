import { NextRequest, NextResponse } from 'next/server';
import { squidBridgeService } from '@/lib/squid-bridge';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const status = await squidBridgeService.getTransactionStatus(id);
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Bridge status check failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check bridge status',
        success: false 
      },
      { status: 500 }
    );
  }
}