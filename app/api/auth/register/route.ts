import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // TODO: Implement database user creation with hashed password
    // This is a placeholder - you'll need to integrate with your actual database

    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role: 'staff',
      branchId: null,
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = Buffer.from(JSON.stringify(mockUser)).toString('base64');

    const response = NextResponse.json(
      { 
        user: mockUser,
        token 
      },
      { status: 201 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[v0] Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
