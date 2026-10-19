import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  response.cookies.set('rozgarsetu_role', '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set('rozgarsetu_session', '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set('rozgarsetu_user_name', '', { path: '/', maxAge: 0, expires: new Date(0) });

  response.cookies.delete('rozgarsetu_role');
  response.cookies.delete('rozgarsetu_session');
  response.cookies.delete('rozgarsetu_user_name');

  return response;
}

export async function GET() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  response.cookies.set('rozgarsetu_role', '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set('rozgarsetu_session', '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set('rozgarsetu_user_name', '', { path: '/', maxAge: 0, expires: new Date(0) });

  response.cookies.delete('rozgarsetu_role');
  response.cookies.delete('rozgarsetu_session');
  response.cookies.delete('rozgarsetu_user_name');

  return response;
}
