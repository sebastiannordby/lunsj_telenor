"use client"
import { API } from '@/lib/api';
import { Canteen, CanteenMenu, CanteenView } from '@/lib/definitions';
import { Card, CardBody, CardFooter, CardHeader, Divider, Select, SelectItem } from '@nextui-org/react';
import { useEffect, useState } from 'react';

// Define the types for your menu data
type Menu = {
  [canteen: string]: CanteenMenu[];
};

const daysOfWeek: string[] = [
  'Mandag', 
  'Tirsdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lørdag',
  'Søndag'
];

const DAYS = {
    "1": "Mandag",
    "2": "Tirsdag",
    "3": "Onsdag",
    "4": "Torsdag",
    "5": "Fredag",
    "6": "Lørdag",
    "7": "Søndag"
} as any;

function fetchMenuForDay<Menu>(day: string) {
  return {
    "Kantine 1": [ "Kylling", "Taco", "Burger" ],
    "Kantine 2": [ "Kylling", "Taco", "Burger" ],
    "Kantine 3": [ "Kylling", "Taco", "Burger" ],
  };
}

export default function Home() {
  const [selectedDay, setSelectedDay] = useState<string>('Mandag');
  const [menu, setMenu] = useState<Menu>({});
  const [canteens, setCanteens] = useState<CanteenView[]>();

  useEffect(() => {
    let day = new Date().getDay();

    if(day == 0) {
      day = 7;
    }

    const dayName = (DAYS as any)[day];

    setSelectedDay(dayName as string);
  }, []);

  const handleDayChange = async(event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = event.target.value;
    setSelectedDay(newDay);
  };

  const fetchCanteens = async() => {
    setCanteens(await API.listCanteensViews());
  };

  useEffect(() => {
    (async() => {
      await fetchCanteens();
    })();
  }, []);

  useEffect(() => {
    const menu: Menu = {};
    const dayEntries = Object.entries(DAYS);
    const dayEntry = dayEntries.find(x => x[1] == selectedDay);
    const dayAsNumber = dayEntry?.[0] ?? 1;

    canteens?.forEach(x => {
      menu[x.name] = x.menus
        .filter(x => x.day == dayAsNumber);
    });

    setMenu(menu);

  }, [ selectedDay ]);

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
                {canteenMenu.map((menu, index) => (
                  <li key={index}>{menu.description}</li>
                ))}
              </ul>
            </CardBody>
          </Card>          
        ))}
      </div>
    </div>
  );
};
