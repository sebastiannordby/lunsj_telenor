"use client"
import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalContent, 
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Listbox,
    Avatar,
    ListboxItem,
    user,
    Input,
    Checkbox
} from "@nextui-org/react";
import { User } from "../definitions";
import { API } from "../api";

export default function ManageUsers() {
    const [ users, setUsers ] = useState<User[]>([]);
    const [ user, setUser ] = useState<User>();
    const [ userIsNew, setUserIsNew ] = useState<boolean>(false);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [values, setValues] = React.useState<User>();

    const editUser = (user: User) => {
        setUser(user);
        setUserIsNew(false);
        onOpen();
    };

    const saveUser = async() => {
        if(user) {
            if(userIsNew) {
                await API.createUser(user);
            } else {
                await API.updateUser(user);
            }
            
            setUser(undefined);
            await updateUserList();
        }
    };

    const updateUserList = async() => {
        setUsers(await API.listUsers());
    };

    const showNewUserDialog = () => {
        setUser({
            id: '',
            isAdmin: false,
            password: '',
            username: ''
        } satisfies User);
        setUserIsNew(true);
        onOpen();
    };

    useEffect(() => {
        (async() => {
            await updateUserList();
        })();
    }, []);

    return (
        <div className="p-2">
            <div className="flex gap-2 items-center justify-between">
                <h3>Brukere</h3>

                <Button 
                    color="secondary"
                    size="md"
                    radius="full"
                    onClick={showNewUserDialog}>
                    Legg til
                </Button>
            </div>

            <Listbox
                classNames={{
                base: "w-full",
                list: "max-h-[300px] overflow-scroll w-full",
                }}
                items={users}
                label="Assigned to"
                selectionMode="single"
                variant="flat">
                {(item) => (
                <ListboxItem key={item.id} textValue={item.username}>
                    <div className="flex gap-2 items-center w-full">
                        <Avatar alt={item.username} className="flex-shrink-0" size="sm" />
                        <div className="flex flex-col">
                            <span className="text-small">{item.username}</span>
                            <span className="text-tiny text-default-400">{item.isAdmin ? "Administrator" : "Bruker"}</span>
                        </div>

                        <Button 
                            color="secondary"
                            className="ml-auto"
                            size="sm"
                            style={{ marginLeft: 'auto'}}
                            onClick={() => editUser(item)}
                            radius="full">
                            Rediger
                        </Button>
                    </div>
                </ListboxItem>
                )}
            </Listbox>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                        <ModalHeader className="flex flex-col gap-1">
                            { userIsNew ? "Ny bruker" : `Rediger - ${user?.username}` }
                        </ModalHeader>
                        <ModalBody>
                            <UserForm user={user} setUpdatedUser={setUser} />
                        </ModalBody>
                        <ModalFooter>
                            <Button 
                                color="secondary"
                                onPress={async() =>{  onClose(); await saveUser(); }}>Lagre</Button>
                        </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>            
        </div>
    );
}

export function UserForm({ user, setUpdatedUser }: {
    user: User | undefined,
    setUpdatedUser: (user: User) => void
}) {
    const [username, setUsername] = useState(user?.username ?? '');
    const [password, setPassword] = useState(user?.password ?? '');
    const [isAdmin, setIsAdmin ] = useState(user?.isAdmin ?? false);

    const updateUsername = (username: string) => {
        setUsername(username);

        if(user) {
            setUpdatedUser({ ...user, username: username ?? ''});
        }
    };

    const updateIsAdmin = (isAdmin: boolean) => {
        setIsAdmin(isAdmin);

        if(user) {
            setUpdatedUser({ ...user, isAdmin: isAdmin ?? false});
        }
    };

    const updatePassword = (password: string) => {
        setPassword(password);

        if(user) {
            setUpdatedUser({ ...user, password: password ?? ''});
        }
    };

  return (
    <div className="flex flex-col gap-2">
        <Input 
            label="Brukernavn"
            placeholder="Skriv inn brukernavn"
            type="text"
            value={username} 
            onValueChange={(e) => updateUsername(e)}/>

        <Input
            label="Passord"
            variant="bordered"
            placeholder="Skriv inn passord"
            type={"password"}
            value={password}
            onValueChange={(e) => updatePassword(e)}/>

        <Checkbox 
            checked={isAdmin} 
            onClick={() => updateIsAdmin(!isAdmin)}>Er administrator</Checkbox>
    </div>
  );
}
