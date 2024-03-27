import { auth } from "@/app/auth";
import { getUserByUsername } from "@/lib/database/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const authUser = await auth();

        if(authUser?.user?.name) {
            const user = await getUserByUsername(authUser?.user?.name);
            console.log('GELLO GET USER: ', user);

            return NextResponse.json(user);
        }        

        return NextResponse.json({ msg: "The security not that bad.."});
    } catch (err) {
        return NextResponse.error();
    }
}
  