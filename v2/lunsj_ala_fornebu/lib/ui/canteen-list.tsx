"use client"
import { Listbox, ListboxItem } from "@nextui-org/react";
import { Canteen } from "../definitions";

export function CanteenList() {
    const canteens: Canteen[] = [
        {
            name: "FoodTruck",
            usersWithAccess: []
        },
        {
            name: "Andre Etasje",
            usersWithAccess: []
        },
        {
            name: "Fjerde Etasje",
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