import { NextResponse } from 'next/server';
import { seedDatabase } from '@/db/seed';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'Demo dataset reset to initial state successfully.',
    });
  } catch (error) {
    console.error('Failed to reset demo dataset:', error);
    return NextResponse.json(
      { error: 'Failed to reset demo dataset' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
