import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, mobile, dob, qualificationLevel, category, disability } = body;

    if (!name || !mobile || !dob || !qualificationLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: name, mobile, dob, qualificationLevel' },
        { status: 400 }
      );
    }

    const defaultPasswordHash = await bcrypt.hash('demo123', 10);
    const userId = `user-${Date.now()}`;

    await db.insert(users).values({
      id: userId,
      name,
      mobile,
      passwordHash: defaultPasswordHash,
      dob,
      qualificationLevel,
      category: category || null,
      disability: disability || null,
      language: 'en',
      role: 'user',
      createdAt: new Date().toISOString(),
    });

    const response = NextResponse.json({ success: true, userId });
    response.cookies.set('rozgarsetu_session', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Registration failed:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
