import { NextResponse } from 'next/server'
import { getAvatarBucket } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { verifySession } from '@/server/auth/dal'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const session = await verifySession()
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'file is required' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ message: 'Only image files are allowed' }, { status: 400 })
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ message: 'Avatar must be 5MB or smaller' }, { status: 400 })
  }

  const bucket = getAvatarBucket()
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'png'
  const objectPath = `${session.user.id}/${Date.now()}.${extension || 'png'}`
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)
  return NextResponse.json({ url: data.publicUrl, path: objectPath })
}
