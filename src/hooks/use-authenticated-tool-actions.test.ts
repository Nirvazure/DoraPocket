import test from 'node:test'
import assert from 'node:assert/strict'

import { createSaveToolHandler } from '@/hooks/use-authenticated-tool-actions'

test('createSaveToolHandler returns early when not authenticated', () => {
  let called = false
  const save = createSaveToolHandler({
    authPending: false,
    isAuthenticated: false,
    saveToolToPocket: () => {
      called = true
    },
  })
  save('tool-1')
  assert.equal(called, false)
})

test('createSaveToolHandler calls saveToolById when authenticated', () => {
  const saved: unknown[] = []
  const save = createSaveToolHandler({
    authPending: false,
    isAuthenticated: true,
    saveToolToPocket: (input) => {
      saved.push(input)
    },
    getSourceQuestion: () => 'test question',
  })
  save('tool-1')
  assert.deepEqual(saved, [{ toolId: 'tool-1', sourceQuestion: 'test question' }])
})
