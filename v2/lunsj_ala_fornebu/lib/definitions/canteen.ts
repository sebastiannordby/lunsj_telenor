export type Canteen = {
    id: number;
    name: string;
    adminUserId: number;
    usersWithAccess: string[]
};

export type CanteenMenu = {
    id: number;
    day: number;
    description: string;
    allergens: string;
    canteenId: number;
};

export type CanteenView = {
    id: number;
    name: string;
    menus: CanteenMenu[];
};