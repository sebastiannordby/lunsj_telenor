import { listCanteenViews, listCanteens } from '@/lib/database/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {

    console.log('REQUEST: ', req.referrer);

    const canteens = await listCanteenViews();

    console.log('CANTEENS: ', canteens);

    return NextResponse.json(canteens);
  } catch (err) {
    return NextResponse.error();
  }
}
