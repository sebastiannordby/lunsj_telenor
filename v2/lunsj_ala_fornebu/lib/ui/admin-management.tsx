"use client"
import { Card, CardBody, Listbox, ListboxItem, Tab, Tabs } from "@nextui-org/react";
import { CanteenList } from "@/lib/ui/canteen-list";
import { Session } from "next-auth";
import ManageUsers from "./manage-users";

export function AdminManagement({ session} : { session: Session | null }) {
    return (
        <div className="container my-auto mx-auto p-8 rounded-lg bg-white">
            <h1 className="text-center mb-2 text-xl">Hei {session?.user?.name}</h1>

            <div className="flex flex-col">
                <Tabs aria-label="Options">
                    <Tab key="users" title="Brukere">
                        <Card>
                            <CardBody>
                                <ManageUsers />
                            </CardBody>
                        </Card>  
                    </Tab>
                    <Tab key="canteens" title="Kantiner">
                        <Card>
                            <CardBody>
                                <CanteenList></CanteenList>
                            </CardBody>
                        </Card>  
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
