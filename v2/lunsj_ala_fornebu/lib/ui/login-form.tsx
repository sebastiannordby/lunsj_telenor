'use client'

import {Button} from '@nextui-org/button'; 
import { Input } from '@nextui-org/react';
import { authenticate } from '@/lib/actions';
import { useFormState, useFormStatus } from 'react-dom';

export function LoginForm() {  
  // const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  const onSubmit = async (data: any) => {
    console.log(data);
    
    const { email, password } = data;
    
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2 flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="email">
              E-post
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Skriv inn e-post"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="password">
              Password
            </label>
            <div className="relative">

              <Input
                type='password'
                name='password'
                required={true}
                minLength={6}
                placeholder='Skriv inn passord' />
            </div>
          </div>
        </div>
        <Button 
          type="submit"
          className="mt-4 w-full text-white"
          color="success">Logg inn</Button>
      </div>
    </form>
  );
}
