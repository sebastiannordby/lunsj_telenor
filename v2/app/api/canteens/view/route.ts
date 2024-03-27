import { listCanteenViews } from '@/lib/database/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const canteens = await listCanteenViews();

    return NextResponse.json(canteens);
  } catch (err) {
    return NextResponse.error();
  }
}
