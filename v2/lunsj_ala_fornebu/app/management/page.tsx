import { Listbox, ListboxItem } from "@nextui-org/react";
import { auth } from "../auth";
import { Canteen } from "@/lib/definitions"

export default async function ManagementPage() {
    const session = await auth();


    return (
        <div className="container my-auto mx-auto p-8 rounded-lg bg-primary pink-text">
            <h1 className="text-center mb-2 text-xl">Hei {session?.user?.name}</h1>

            <div className="flex gap-2">
                <div>
                    <List></List>
                </div>
            </div>
        </div>
    );
}

export function List() {
    "use client"

    const canteens: Canteen[] = [
        {
            name: "Kantine 1",
            usersWithAccess: []
        }

    ];

    return (
        <>
            <Listbox
                aria-label="User Menu"
                onAction={(key) => alert(key)}
                className="p-0 gap-0 divide-y divide-default-300/50 dark:divide-default-100/80 bg-content1 max-w-[300px] overflow-visible shadow-small rounded-medium"
                itemClasses={{
                    base: "px-3 first:rounded-t-medium last:rounded-b-medium rounded-none gap-3 h-12 data-[hover=true]:bg-default-100/80",
                }}
                >

                {canteens.map(x => 
                    <ListboxItem key={x.name}>
                        {x.name}
                    </ListboxItem>
                )}
            </Listbox>
        </>
    )
}