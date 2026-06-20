import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // TODO: Implement database lookup and password verification
    // This is a placeholder - you'll need to integrate with your actual database
    
    // For now, return a mock user for demo purposes
    const mockUser = {
      id: '1',
      email,
      name: 'Demo User',
      role: 'admin',
      branchId: null,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = Buffer.from(JSON.stringify(mockUser)).toString('base64');

    const response = NextResponse.json(
      { 
        user: mockUser,
        token 
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
