"use client"
import { API } from '@/lib/api';
import { Canteen } from '@/lib/definitions';
import { Card, CardBody, CardFooter, CardHeader, Divider, Select, SelectItem } from '@nextui-org/react';
import { useEffect, useState } from 'react';

// Define the types for your menu data
type Menu = {
  [canteen: string]: string[];
};

const daysOfWeek: string[] = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];

function fetchMenuForDay<Menu>(day: string) {
  return {
    "Kantine 1": [ "Kylling", "Taco", "Burger" ],
    "Kantine 2": [ "Kylling", "Taco", "Burger" ],
    "Kantine 3": [ "Kylling", "Taco", "Burger" ],
  };
}

export default function Home() {
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  const [menu, setMenu] = useState<Menu>({});
  const [canteens, setCanteens] = useState<Canteen[]>();

  const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = event.target.value;
    setSelectedDay(newDay);
    setMenu(fetchMenuForDay(newDay));
  };

  useEffect(() => {
    setMenu(fetchMenuForDay(selectedDay));
  }, []);

  useEffect(() => {
    (async() => {
      const cant = await API.listCanteens();

      console.log(cant);

      setCanteens(cant);
    })();
  }, []);

  return (
    <div className="container my-auto mx-auto p-8 rounded-lg">
      <h1 className="text-center mb-4 text-2xl font-bold text-white">🥕🥑 Lunsjmeny - Fornebu 🥑🥕</h1>
      
      <div className='flex flex-col gap-2 justify-center items-center'>
        <Select
          label="Viser meny for"
          placeholder="Velg dag for å vise meny"
          className="max-w-xs"
          fullWidth={true}
          value={selectedDay}
          onChange={handleDayChange}>
          {daysOfWeek.map((day) => (
            <SelectItem key={day} value={day}>
              {day}
            </SelectItem>
          ))}
        </Select>

        {Object.entries(menu).map(([canteenName, canteenMenu]) => (
          <Card className="max-w-[400px]" key={canteenName} fullWidth={true}>
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">{canteenName}</p>
              </div>
            </CardHeader>
            <Divider/>
            <CardBody>
              <ul className="list-disc pl-5">
                {canteenMenu.map((foodItem, index) => (
                  <li key={index}>{foodItem}</li>
                ))}
              </ul>
            </CardBody>
          </Card>          
        ))}
      </div>
    </div>
  );
};
