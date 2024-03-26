import { Canteen } from "./definitions";

export const API = {
    listCanteens: async() => {
        const res = await fetch("/api/canteens", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            }
        });
        const json = await res.json();

        return json as Canteen[];
    }
};