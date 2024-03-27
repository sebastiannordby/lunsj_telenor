import { createCanteen, listCanteens, updateCanteen } from '@/lib/database/database'
import { Canteen } from '@/lib/definitions';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const canteens = await listCanteens();

    return NextResponse.json(canteens);
  } catch (err) {
    return NextResponse.error();
  }
}

export async function PUT(req: NextRequest) {
  try {
      const incoming = await req.json();
      const canteen = incoming as Canteen;
      
      await updateCanteen(
        canteen.id, canteen.name, canteen.adminUserId);

      return NextResponse.json(true);
    } catch (err) {
      return NextResponse.error();
  }
}
export async function POST(req: NextRequest) {
  try {
      const incoming = await req.json();
      const canteen = incoming as Canteen;
      
      await createCanteen(
        canteen.name, canteen.adminUserId);

      return NextResponse.json(true);
    } catch (err) {
      return NextResponse.error();
  }
}