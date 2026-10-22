import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabasePublicConfigAvailable,
} from './config'

test('Auth reads canonical shared variables and treats blank configuration as unavailable', (t) => {
  const original = { ...process.env }
  t.after(() => {
    process.env = original
  })
  process.env.SUPABASE_URL = ' https://auth.example.supabase.co '
  process.env.SUPABASE_PUBLISHABLE_KEY = ' sb_publishable_example '
  assert.equal(getSupabaseUrl(), 'https://auth.example.supabase.co')
  assert.equal(getSupabasePublishableKey(), 'sb_publishable_example')
  assert.equal(isSupabasePublicConfigAvailable(), true)
  process.env.SUPABASE_PUBLISHABLE_KEY = '  '
  assert.equal(isSupabasePublicConfigAvailable(), false)
  assert.throws(getSupabasePublishableKey, /SUPABASE_PUBLISHABLE_KEY is required/)
})
