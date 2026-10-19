import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      name,
      mobile,
      password,
      dob,
      qualificationLevel,
      qualificationStream,
      category,
      disability,
    } = body;

    if (!name || !mobile || !dob || !qualificationLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: Full Name, Mobile, Date of Birth, and Qualification' },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile).trim();
    if (!/^\d{10}$/.test(cleanMobile)) {
      return NextResponse.json(
        { error: 'Mobile number must be exactly 10 digits' },
        { status: 400 }
      );
    }

    // Check if mobile already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, cleanMobile));

    if (existing) {
      return NextResponse.json(
        { error: 'This mobile number is already registered. Please log in.' },
        { status: 409 }
      );
    }

    const plainPassword = password && String(password).trim().length >= 6
      ? String(password).trim()
      : 'demo_user_123';
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const userId = `user-${Date.now()}`;

    await db.insert(users).values({
      id: userId,
      name: String(name).trim(),
      mobile: cleanMobile,
      passwordHash,
      dob: String(dob).trim(),
      qualificationLevel: String(qualificationLevel).trim(),
      qualificationStream: qualificationStream ? String(qualificationStream).trim() : 'General',
      category: category ? String(category).trim() : null,
      disability: disability ? String(disability).trim() : null,
      language: 'en',
      role: 'user',
      createdAt: new Date().toISOString(),
    });

    // Write to audit_log
    await db.insert(auditLog).values({
      id: `audit-${Date.now()}`,
      actor: userId,
      action: 'user_register',
      entity: 'users',
      entityId: userId,
      reason: `New citizen account registered with mobile ${cleanMobile.slice(0, 3)}****${cleanMobile.slice(-3)}`,
      createdAt: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      userId,
      user: {
        id: userId,
        name: String(name).trim(),
        mobile: cleanMobile,
        role: 'user',
      },
      message: 'Account created successfully',
    });

    response.cookies.set('rozgarsetu_session', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    response.cookies.set('rozgarsetu_role', 'user', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    response.cookies.set('rozgarsetu_user_name', encodeURIComponent(String(name).trim()), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Registration failed:', err);
    return NextResponse.json(
      { error: 'An error occurred while creating your account. Please try again.' },
      { status: 500 }
    );
  }
}
