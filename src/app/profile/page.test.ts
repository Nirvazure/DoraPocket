import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

mock.module('@/components/common/app-nav', {
  namedExports: { AppNav: () => null },
})
mock.module('@/components/common/page-shell', {
  namedExports: { PageShell: ({ children }: { children: ReactNode }) => children },
})
mock.module('@/components/common/unified-top-bar', {
  namedExports: { UnifiedTopBar: () => null },
})

const { default: ProfileRoutePage, metadata } = await import('./page')

test('profile route shows a public coming-soon page', () => {
  const html = renderToStaticMarkup(createElement(ProfileRoutePage))

  assert.match(html, /<h1[^>]*>待实现<\/h1>/)
  assert.match(html, /敬请期待/)
  assert.equal(metadata.title, '个人页待实现 | DoraPocket')
  assert.equal(metadata.description, '个人页待实现，敬请期待。')
})
