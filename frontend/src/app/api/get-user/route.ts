// frontend/src/app/api/get-user/route.ts
// API route to get Clerk user data server-side

import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { clerkId } = await request.json();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Clerk ID is required' },
        { status: 400 }
      );
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(clerkId);
    
    // Return user data
    return NextResponse.json({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      createdAt: user.createdAt,
      imageUrl: user.imageUrl,
    });
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}