"use client"
import { Card, CardBody, Tab, Tabs } from "@nextui-org/react";
import { ManageCanteens } from "@/lib/ui/manage-canteens";
import { Session } from "next-auth";
import ManageUsers from "./manage-users";

export function AdminManagement() {
    return (
        <div className="container my-auto mx-auto p-8 rounded-lg bg-white">
            <h1 className="text-center mb-2 text-xl">Dashboard</h1>

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
                                <ManageCanteens/>
                            </CardBody>
                        </Card>  
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
