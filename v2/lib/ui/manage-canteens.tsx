"use client"
import { Button, Input, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { Canteen } from "../definitions";
import { useEffect, useState } from "react";
import { API } from "../api";

export function ManageCanteens() {
    const [canteens, setCanteens ] = useState<Canteen[]>([]);
    const [canteen, setCanteen ] = useState<Canteen>();
    const [isCanteenNew, setIsCanteenNew] = useState<boolean>();
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    const fetchCanteens = async() => {
        setCanteens(await API.listCanteens());
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
        onOpen();
    };

    const showNewCanteenDialog = () => {
        setCanteen({
            id: 0,
            name: '',
            adminUserId: 0
        } satisfies Canteen);
        setIsCanteenNew(true);
        onOpen();
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
                                    onClick={() => editCanteen(item)}
                                    radius="full">
                                    Meny
                                </Button>
                            </div>
                        </div>                    
                    </ListboxItem>

                )}
            </Listbox>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
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
        </div>
    )
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
