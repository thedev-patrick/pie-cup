import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = 'admin@piecup.cci';
const ADMIN_PASSWORD = 'PieCupLagos100!';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? '');
  const password = String(body.password ?? '');

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'admin-auth',
    value: 'true',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
  });
  return response;
}
