import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, getUserByEmail, updateUserPlaidToken, updateUserSelectedAccount, clearUserPlaidConnection } from '@/lib/db';

// GET - Get user by email
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      hasBankLinked: !!user.plaid_access_token,
      selectedAccountId: user.selected_account_id,
    });
  } catch (error: any) {
    console.error('Error getting user:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

// POST - Create or get user by email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await getOrCreateUser(email);

    return NextResponse.json({
      email: user.email,
      hasBankLinked: !!user.plaid_access_token,
      selectedAccountId: user.selected_account_id,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PATCH - Update user data
export async function PATCH(request: NextRequest) {
  try {
    const { email, plaid_access_token, selected_account_id, clear_plaid } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let user;

    if (clear_plaid) {
      user = await clearUserPlaidConnection(email);
    } else if (plaid_access_token) {
      user = await updateUserPlaidToken(email, plaid_access_token);
    } else if (selected_account_id) {
      user = await updateUserSelectedAccount(email, selected_account_id);
    } else {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    return NextResponse.json({
      email: user.email,
      hasBankLinked: !!user.plaid_access_token,
      selectedAccountId: user.selected_account_id,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
