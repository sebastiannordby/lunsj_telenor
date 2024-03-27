"use client"
import { LoginForm } from "@/lib/ui/login-form";

export default function LoginPage() {
    return (
        <div className="container my-auto mx-auto p-8 rounded-lg pink-text">
            <h1 className="text-center mb-4 text-2xl">Logg inn</h1>

            <LoginForm></LoginForm>
        </div>
    );
}