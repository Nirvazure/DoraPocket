import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const RPCClient = require('@alicloud/pop-core') as new (config: {
  accessKeyId: string
  accessKeySecret: string
  endpoint: string
  apiVersion: string
}) => {
  request<T = unknown>(action: string, params: Record<string, unknown>, options?: { method?: string }): Promise<T>
}

export async function fetchNlsToken(akId: string, akSecret: string): Promise<string> {
  const client = new RPCClient({
    accessKeyId: akId,
    accessKeySecret: akSecret,
    endpoint: 'https://nls-meta.cn-shanghai.aliyuncs.com',
    apiVersion: '2019-02-28',
  })

  const result = (await client.request('CreateToken', { RegionId: 'cn-shanghai' }, { method: 'POST' })) as {
    Token?: { Id?: string }
  }
  const token = result.Token?.Id?.trim()
  if (!token) throw new Error('CreateToken failed')
  return token
}
