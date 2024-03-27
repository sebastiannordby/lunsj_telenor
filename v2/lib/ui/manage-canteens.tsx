"use client"
import { Button, Input, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea, useDisclosure } from "@nextui-org/react";
import { Canteen, CanteenMenu } from "../definitions";
import { useEffect, useState } from "react";
import { API } from "../api";

export function ManageCanteens() {
    const [canteens, setCanteens ] = useState<Canteen[]>([]);
    const [canteen, setCanteen ] = useState<Canteen>();
    const [isCanteenNew, setIsCanteenNew] = useState<boolean>();
    const {isOpen: isManageDialogOpen, onOpen: openManageDialog, onOpenChange: manageDialogChange} = useDisclosure();
    const {isOpen: isMenuDialogOpen, onOpen: openMenuDialog, onOpenChange: menuDialogChange} = useDisclosure();

    const [canteenMenus, setCanteenMenus ] = useState<CanteenMenu[]>([]);

    const fetchCanteens = async() => {
        setCanteens(await API.listCanteens());
    };

    const showMenuDialog = async(canteen: Canteen) => {
        const menus = await API.listCanteenMenus(canteen.id);

        for(let i = 0; i < menus.length; i++) {
            menus[i].canteenId = canteen.id;
        }

        setCanteenMenus(menus);
        openMenuDialog();
    };

    const saveCanteen = async() => {
        if(canteen) {
            if(isCanteenNew) {
                await API.createCanteen(canteen);
            } else {
                await API.updateCanteen(canteen);
            }

            await fetchCanteens();
            setIsCanteenNew(false);
            setCanteen(undefined);
        }
    };

    const editCanteen = (toEdit: Canteen) => {
        setCanteen(toEdit);
        setIsCanteenNew(false);
        openManageDialog();
    };

    const showNewCanteenDialog = () => {
        setCanteen({
            id: 0,
            name: '',
            adminUserId: 0
        } satisfies Canteen);
        setIsCanteenNew(true);
        openManageDialog();
    };

    useEffect(() => {
        (async() => {
            fetchCanteens();
        })();
    }, [ ]);

    return (
        <div className="flex flex-col gap-2 p-2">
            <div className="flex gap-2 items-center justify-between">
                <h3>Kantiner</h3>

                <Button 
                    color="secondary"
                    size="md"
                    radius="full"
                    onClick={showNewCanteenDialog}>
                    Legg til
                </Button>
            </div>

            <Listbox
                aria-label="User Menu"
                onAction={(key) => alert(key)}
                className="p-0 gap-0 divide-y divide-default-300/50 dark:divide-default-100/80 bg-content1 max-w-[300px] overflow-visible shadow-small rounded-medium"
                itemClasses={{
                    base: "px-3 first:rounded-t-medium last:rounded-b-medium rounded-none gap-3 h-12 data-[hover=true]:bg-default-100/80",
                }}
                >

                {canteens.map(item => 
                    <ListboxItem key={item.name}>
                        <div className="flex gap-2 items-center w-full">
                            <div className="flex flex-col">
                                <span className="text-small">{item.name}</span>
                                <span className="text-tiny text-default-400">sebastian</span>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                <Button 
                                    color="secondary"
                                    size="sm"
                                    style={{ marginLeft: 'auto'}}
                                    onClick={() => editCanteen(item)}
                                    radius="full">
                                    Rediger
                                </Button>
                                <Button 
                                    color="secondary"
                                    size="sm"
                                    style={{ marginLeft: 'auto'}}
                                    onClick={() => showMenuDialog(item)}
                                    radius="full">
                                    Meny
                                </Button>
                            </div>
                        </div>                    
                    </ListboxItem>

                )}
            </Listbox>

            <Modal isOpen={isManageDialogOpen} onOpenChange={manageDialogChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                { isCanteenNew ? "Ny kantine" : `Rediger - ${canteen?.name}` }
                            </ModalHeader>
                            <ModalBody>
                                <CanteenForm canteen={canteen} setUpdatedCanteen={setCanteen} />
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="secondary"
                                    onPress={async() =>{  onClose(); await saveCanteen(); }}>Lagre</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>             

            <Modal isOpen={isMenuDialogOpen} onOpenChange={menuDialogChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Meny for
                            </ModalHeader>
                            <ModalBody>
                                <div 
                                    style={{height: '310px'}}
                                    className="flex flex-col gap-4 overflow-auto max-h-[300px] h-[300px]">
                                    { canteenMenus.map(x => 
                                        <MenuManagement menu={x} />
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="secondary"
                                    onPress={async() =>{  onClose(); }}>Lagre</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>                       
        </div>
    )
}

export function MenuManagement({
    menu
} : {
    menu: CanteenMenu
}) {
    const [description, setDescription] = useState(menu?.description);
    const [allergens, setAllergens] = useState(menu?.allergens ?? 'Ingen');
    const days = [
        "Mandag",
        "Tirsdag",
        "Onsdag",
        "Torsdag",
        "Fredag",
        "Lørdag",
        "Søndag"
    ];

    return (
        <div className="flex flex-col gap-2 p-2 border-gray-400 rounded-md border border-solid">
            <Input 
                label="Dag"
                type="text"
                disabled={true}
                value={days[menu.day]} />

            <Textarea
                label="Beskrivelse"
                placeholder="Skriv inn beskrivelse"
                value={description} 
                onValueChange={(e) => setDescription(e)}/>
            <Textarea
                label="Allergener"
                placeholder="Skriv inn Allergener"
                value={allergens} 
                onValueChange={(e) => setAllergens(e)}/>
        </div>
    );
}

export function CanteenForm({ canteen, setUpdatedCanteen }: {
    canteen: Canteen | undefined,
    setUpdatedCanteen: (canteen: Canteen) => void
}) {
    const [name, setName] = useState(canteen?.name ?? '');

    const updateName = (name: string) => {
        setName(name);

        if(canteen) {
            setUpdatedCanteen({ ...canteen, name: name ?? ''});
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Input 
                label="Navn"
                placeholder="Skriv inn navn"
                type="text"
                value={name} 
                onValueChange={(e) => updateName(e)}/>

            {/* <Input
                label="Passord"
                variant="bordered"
                placeholder="Skriv inn passord"
                type={"password"}
                value={password}
                onValueChange={(e) => updatePassword(e)}/>

            <Checkbox 
                checked={isAdmin} 
                onClick={() => updateIsAdmin(!isAdmin)}>Er administrator</Checkbox> */}
        </div>
    );
}
