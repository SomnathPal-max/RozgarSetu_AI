import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { persona, mobile, password } = body;

    let role = 'reviewer';
    let userId = 'rev-1';

    if (persona === 'reviewer-2' || mobile === '0000000003') {
      role = 'reviewer2';
      userId = 'rev-2';
    } else if (persona === 'admin' || mobile === '0000000004') {
      role = 'admin';
      userId = 'admin-1';
    } else if (persona === 'reviewer-1' || mobile === '0000000002') {
      role = 'reviewer';
      userId = 'rev-1';
    } else if (mobile && password) {
      // In demo mode with fake numbers
      if (mobile === '0000000001') {
        // User role
        return NextResponse.json(
          { error: 'User mobile number provided. Only reviewers or administrators can access the reviewer portal.' },
          { status: 403 }
        );
      }
      role = 'reviewer';
      userId = 'rev-1';
    }

    const response = NextResponse.json({
      success: true,
      role,
      userId,
      message: `Authenticated as ${role}`,
    });

    response.cookies.set('rozgarsetu_role', role, {
      httpOnly: false, // Accessible to client for conditional nav display
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    response.cookies.set('rozgarsetu_session', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Reviewer login failed:', err);
    return NextResponse.json({ error: 'Reviewer login failed' }, { status: 500 });
  }
}
