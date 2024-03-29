"use client"
import { API } from "@/lib/api";
import { User } from "@/lib/definitions";
import { AdminManagement } from "@/lib/ui/admin-management";
import { useEffect, useState } from "react";

export default function ManagementPage() {
    const [user, setUser] = useState<User>();

    useEffect(() => {
        (async() => {
            setUser(await API.getUser());
        })();
    }, []);

    if(user?.isAdmin) {
        return (
            <AdminManagement />
        );
    } else {
        return (
            <h1>Hmmm</h1>
        );
    }
}

