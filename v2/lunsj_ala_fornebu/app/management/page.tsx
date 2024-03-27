import { auth } from "../auth";
import { getUserByUsername } from "@/lib/database/database";
import { AdminManagement } from "@/lib/ui/admin-management";

export default async function ManagementPage() {
    const session = await auth();
    const user = await getUserByUsername(session?.user?.name ?? '');

    if(user?.isAdmin) {
        return (
            <AdminManagement session={session} />
        );
    } else {
        return (
            <AdminManagement session={session} />
        );
    }
}

