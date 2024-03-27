"use client"
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react"
import Link from "next/link";

export function SignoutComponent({
    session
}: {
    session: Session | null
}){
    if(session?.user) {
        return (
            <>
                <Link href="/management" className="cursor-pointer">Rediger meny</Link>

                <a 
                    className="cursor-pointer"
                    onClick={async() => await signOut()}>Logg ut</a>
            </>
        );
    }

    return (
        <a 
            className="cursor-pointer"
            onClick={async() => await signIn()}>Logg inn</a> 
    );
}