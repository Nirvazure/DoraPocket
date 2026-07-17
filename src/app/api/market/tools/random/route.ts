import { NextResponse } from 'next/server'
import { createRandomDoorRecommendation } from '@/server/market/random-door'

export async function GET() {
  try {
    const recommendation = await createRandomDoorRecommendation()
    if (!recommendation) {
      return NextResponse.json({ message: 'No eligible tools found' }, { status: 404 })
    }

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error('[market/tools/random] Failed to create random recommendation', error)
    return NextResponse.json({ message: 'Failed to create random recommendation' }, { status: 500 })
  }
}
