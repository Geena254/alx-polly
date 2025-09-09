import { NextRequest, NextResponse } from 'next/server';
import Tokens from 'csrf';

const csrf = new Tokens();

export async function GET() {
  try {
    const token = csrf.secret();
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}