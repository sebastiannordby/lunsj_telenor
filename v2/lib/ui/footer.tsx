"use client"
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react"
import Link from "next/link";

export default function Footer({
    session
}: {
    session: Session | null
}){

    return (
        <footer className="flex p-2 text-white justify-between underline">
            <a 
            target="_blank"
            href="https://no.linkedin.com/in/sebastian-nordby-b45087152">
                Utviklet av Nordby Solutions
            </a>

            {session?.user ? 
                <Link href="/management" className="cursor-pointer">Rediger meny</Link>
                : 
                ''
            }

            {session?.user ? 
                <a 
                    className="cursor-pointer"
                    onClick={async() => await signOut()}>Logg ut</a>
                : 
                <a 
                    className="cursor-pointer"
                    onClick={async() => await signIn()}>Logg inn</a> 
            }
        </footer>
    );
}

