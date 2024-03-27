import { Canteen, CanteenMenu, CanteenView, User } from "./definitions";

export const API = {
    listCanteensViews: async() => {
        const res = await fetch("/api/canteens/view", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            }
        });
        const json = await res.json();

        return json as CanteenView[];
    },
    listCanteens: async() => {
        const res = await fetch("/api/canteens", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            }
        });
        const json = await res.json();

        return json as Canteen[];
    },
    createCanteen: async(canteen: Canteen) => {
        const res = await fetch("/api/canteens", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(canteen)
        });
        const json = await res.json();

        return json as boolean;
    },
    updateCanteen: async(canteen: Canteen) => {
        const res = await fetch("/api/canteens", {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(canteen)
        });
        const json = await res.json();

        return json as boolean;
    },
    listCanteenMenus: async(canteenId: number) => {
        const res = await fetch("/api/canteens/menu", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "CanteenId": canteenId.toString()
            }
        });
        const json = await res.json();

        return json as CanteenMenu[];
    },    
    saveCanteenMenus: async(canteens: CanteenMenu[]) => {
        await fetch("/api/canteens/menu", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(canteens)
        });
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
    },
    getUser: async() => {
        const res = await fetch("/api/auth/user", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            }
        });
        const json = await res.json();

        return json as User;
    },
};