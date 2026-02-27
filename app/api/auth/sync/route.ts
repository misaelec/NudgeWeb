import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const response = NextResponse.json({ success: true })
  
  return response
}
