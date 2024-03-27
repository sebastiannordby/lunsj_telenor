"use client"
import { Accordion, AccordionItem, Button, Input, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea, useDisclosure } from "@nextui-org/react";
import { Canteen, CanteenMenu } from "../definitions";
import { useEffect, useState } from "react";
import { API } from "../api";

const DAYS = {
    "1": "Mandag",
    "2": "Tirsdag",
    "3": "Onsdag",
    "4": "Torsdag",
    "5": "Fredag",
    "6": "Lørdag",
    "7": "Søndag"
} as any;

export function ManageCanteens() {
    const [canteens, setCanteens ] = useState<Canteen[]>([]);
    const [canteen, setCanteen ] = useState<Canteen | null>(null);
    const [isCanteenNew, setIsCanteenNew] = useState<boolean>(false);
    const {isOpen: isManageDialogOpen, onOpen: openManageDialog, onOpenChange: manageDialogChange} = useDisclosure();

    const [showingMenuFor, setShowingMenuFor] = useState<string>('');
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

        setShowingMenuFor(canteen.name);
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
            setCanteen(null);
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

    const saveMenus = async() => {
        await API.saveCanteenMenus(canteenMenus);
        setCanteenMenus([]);
        setShowingMenuFor('');
    };

    const onMenuUpdated = (menu: CanteenMenu) => {
        const updatedMenus = canteenMenus.map(item => 
            item.day === menu.day ? menu : item
        );
    
        setCanteenMenus(updatedMenus);
    };

    useEffect(() => {
        (async() => {
            await fetchCanteens();
        })();
    }, [ ]);

    return (
        <div className="flex flex-col gap-2 p-2">
            <div className="flex gap-2 items-center justify-between">
                <h3>Kantiner</h3>

                <Button 
                    color="secondary"
                    size="sm"
                    radius="full"
                    onClick={showNewCanteenDialog}>
                    Legg til
                </Button>
            </div>

            <Listbox
                aria-label="User Menu"
                selectionMode="none"
                className="p-0 gap-0 divide-y divide-default-300/50 dark:divide-default-100/80 bg-content1 max-w-[300px] overflow-visible shadow-small rounded-medium"
                itemClasses={{
                    base: "px-3 first:rounded-t-medium last:rounded-b-medium rounded-none gap-3 h-12 data-[hover=true]:bg-default-100/80",
                }}>

                {canteens.map(item => 
                    <ListboxItem key={item.id} textValue={item.name} >
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
                                    Endre
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
                                { isCanteenNew ? "Ny kantine" : `Endre - ${canteen?.name}` }
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

            <Modal isOpen={isMenuDialogOpen} onOpenChange={menuDialogChange} size="full">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Meny for {showingMenuFor}
                            </ModalHeader>
                            <ModalBody>
                                <Accordion className="h-100">
                                    { canteenMenus.map(x => 
                                        <AccordionItem 
                                            key={x.day} 
                                            aria-label={DAYS[x.day.toString()]}
                                            title={DAYS[x.day.toString()]}>
                                            <MenuManagement menu={x} setMenu={onMenuUpdated}/>
                                        </AccordionItem>
                                    )}
                                </Accordion>
                            </ModalBody>                            
                            <ModalFooter>
                                <Button 
                                    color="secondary"
                                    onPress={async() =>{  onClose(); await saveMenus() }}>Lagre</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>                       
        </div>
    )
}

export function CanteenForm({ canteen, setUpdatedCanteen }: {
    canteen: Canteen | null,
    setUpdatedCanteen: (canteen: Canteen) => void
}) {
    const [name, setName] = useState<string>('');

    const updateName = (name: string) => {
        setName(name);

        if(canteen) {
            setUpdatedCanteen({ ...canteen, name: name ?? ''});
        }
    };

    useEffect(() => {
        setName(canteen?.name ?? '');
    }, [canteen]);

    return (
        <div className="flex flex-col gap-2">
            <Input 
                label="Navn"
                placeholder="Skriv inn navn"
                type="text"
                value={name} 
                onValueChange={(e) => updateName(e)}/>
        </div>
    );
}

export function MenuManagement({
    menu,
    setMenu
} : {
    menu: CanteenMenu,
    setMenu: (menu: CanteenMenu) => void
}) {
    const [description, setDescription] = useState<string>('');

    const descriptionUpdated = (description: string) => {
        setDescription(description);
        setMenu({
            ...menu,
            description: description
        });
    };

    useEffect(() => {
        setDescription(menu?.description ?? '');
    }, [menu]);

    return (
        <div className="flex flex-col gap-2 p-2">
            <Textarea
                label="Beskrivelse"
                placeholder="Skriv inn beskrivelse"
                value={description} 
                onValueChange={(e) => descriptionUpdated(e)}/>
        </div>
    );
}
