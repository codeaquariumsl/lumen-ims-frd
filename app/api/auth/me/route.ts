import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // TODO: Verify token and fetch actual user from database
    const userDataStr = Buffer.from(token, 'base64').toString('utf-8');
    const user = JSON.parse(userDataStr);

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('[v0] Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
