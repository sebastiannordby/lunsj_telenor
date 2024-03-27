import { Canteen, CanteenView, User } from "./definitions";

export const API = {
    listCanteens: async() => {
        const res = await fetch("/api/canteens", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            }
        });
        const json = await res.json();

        return json as CanteenView[];
    },
    listUsers: async() => {
        const res = await fetch("/api/users", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            }
        });
        const json = await res.json();

        return json as User[];
    },
    updateUser: async(user: User) => {
        const res = await fetch("/api/users", {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });
        const json = await res.json();

        return json as boolean;
    },
    createUser: async(user: User) => {
        const res = await fetch("/api/users", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });
        const json = await res.json();

        return json as boolean;
    }
};