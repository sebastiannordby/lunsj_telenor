import { Listbox, ListboxItem } from "@nextui-org/react";
import { auth } from "../auth";
import { Canteen, User } from "@/lib/definitions"
import { CanteenList } from "@/lib/ui/canteen-list";

export default async function ManagementPage() {
    const session = await auth();
    const user = session?.user as User;

    if(user.isAdmin) {
        return (
            <div className="container my-auto mx-auto p-8 rounded-lg bg-white">
                <h1 className="text-center mb-2 text-xl">Hei {session?.user?.name}</h1>
    
                <div className="flex gap-2">
                    <div>
                        <CanteenList></CanteenList>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <h1>Ikke admin</h1>
        );
    }
}
