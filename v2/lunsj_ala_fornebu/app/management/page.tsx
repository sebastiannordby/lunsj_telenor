import { Listbox, ListboxItem } from "@nextui-org/react";
import { auth } from "../auth";
import { Canteen } from "@/lib/definitions"
import { CanteenList } from "@/lib/ui/canteen-list";

export default async function ManagementPage() {
    const session = await auth();

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
}
