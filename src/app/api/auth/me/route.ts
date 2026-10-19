import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('rozgarsetu_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        mobile: users.mobile,
        role: users.role,
        dob: users.dob,
        qualificationLevel: users.qualificationLevel,
        qualificationStream: users.qualificationStream,
        category: users.category,
        disability: users.disability,
        preferredDistrict: users.preferredDistrict,
        language: users.language,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, sessionId));

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (err) {
    console.error('Session retrieval error:', err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
