import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { mobile, password } = body;

    if (!mobile || !password) {
      return NextResponse.json(
        { error: 'Please enter both mobile number and password' },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile).trim();

    // Look up user by mobile
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, cleanMobile));

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid mobile number or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid mobile number or password' },
        { status: 401 }
      );
    }

    // Audit log
    await db.insert(auditLog).values({
      id: `audit-${Date.now()}`,
      actor: user.id,
      action: 'user_login',
      entity: 'users',
      entityId: user.id,
      reason: `User logged in with mobile ${cleanMobile.slice(0, 3)}****${cleanMobile.slice(-3)}`,
      createdAt: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        dob: user.dob,
        qualificationLevel: user.qualificationLevel,
        category: user.category,
        disability: user.disability,
      },
      message: `Welcome back, ${user.name}`,
    });

    // Set secure session cookies
    response.cookies.set('rozgarsetu_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    });

    response.cookies.set('rozgarsetu_role', user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    response.cookies.set('rozgarsetu_user_name', encodeURIComponent(user.name), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
