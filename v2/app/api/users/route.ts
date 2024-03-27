import { createUser, listUsers, updateUser } from '@/lib/database/database'
import { User } from '@/lib/definitions';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const users = await listUsers();

    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.error();
  }
}

export async function PUT(req: NextRequest) {
    try {
        const incoming = await req.json();
        const user = incoming as User;
        
        await updateUser(user);

        return NextResponse.json(true);
        } catch (err) {
        return NextResponse.error();
    }
}

export async function POST(req: NextRequest) {
    try {
        const incoming = await req.json();
        const user = incoming as User;
        
        await createUser(user.username, user.password, user.isAdmin);

        return NextResponse.json(true);
      } catch (err) {
        console.error('users.route: ', err);
        return NextResponse.error();
    }
}