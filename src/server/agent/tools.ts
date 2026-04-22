import { z } from 'zod'
import {
  TOOL_ID_AIR_QUALITY,
  TOOL_ID_EXCHANGE,
  TOOL_ID_TIME,
  TOOL_ID_WEATHER,
  TOOL_ID_WEB_SUMMARY,
  type ToolMeta,
} from '@/shared/tool-registry'

function formatChinaTimeWithWeekday(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    weekday: 'long',
  })
  const parts = formatter.formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hour = get('hour')
  const minute = get('minute')
  const second = get('second')
  const weekday = weekdayFormatter.format(now)
  return `${year}-${month}-${day} ${hour}:${minute}:${second}（北京时间，${weekday}）`
}

export const TOOL_DEFINITIONS: ToolMeta[] = [
  {
    toolId: TOOL_ID_WEATHER,
    name: 'get_current_weather',
    description: '获取指定地点天气概览',
    inputSchema: z.object({
      location: z.string().min(1),
    }),
  },
  {
    toolId: TOOL_ID_TIME,
    name: 'get_current_time',
    description: '获取当前时间与星期',
    inputSchema: z.object({}),
  },
  {
    toolId: TOOL_ID_EXCHANGE,
    name: 'get_exchange_rate',
    description: '查询汇率并可换算金额',
    inputSchema: z.object({
      from: z.string().length(3),
      to: z.string().length(3),
      amount: z.number().positive().optional(),
    }),
  },
  {
    toolId: TOOL_ID_AIR_QUALITY,
    name: 'get_air_quality',
    description: '查询城市空气质量（AQI）',
    inputSchema: z.object({
      location: z.string().min(1),
    }),
  },
  {
    toolId: TOOL_ID_WEB_SUMMARY,
    name: 'summarize_webpage',
    description: '读取网页正文并输出简要摘要',
    inputSchema: z.object({
      url: z.string().url(),
    }),
  },
]

type OpenMeteoGeoItem = {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

type OpenMeteoGeoResponse = {
  results?: OpenMeteoGeoItem[]
}

type OpenMeteoForecastResponse = {
  current?: {
    time?: string
    temperature_2m?: number
    relative_humidity_2m?: number
    apparent_temperature?: number
    precipitation?: number
    wind_speed_10m?: number
  }
}

type OpenMeteoAirQualityResponse = {
  current?: {
    us_aqi?: number
    pm2_5?: number
    pm10?: number
    ozone?: number
    nitrogen_dioxide?: number
    sulphur_dioxide?: number
    carbon_monoxide?: number
  }
}

type ExchangeHostResponse = {
  success?: boolean
  info?: { rate?: number }
  result?: number
  query?: { amount?: number; from?: string; to?: string }
}

type FrankfurterResponse = {
  rates: Record<string, number>
}

function cityLabel(first: OpenMeteoGeoItem): string {
  return [first.country, first.admin1, first.name].filter(Boolean).join('·')
}

async function geocodeLocation(location: string): Promise<OpenMeteoGeoItem> {
  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=zh&format=json`,
  )
  if (!geoResponse.ok) {
    throw new Error(`地理编码失败: ${geoResponse.status}`)
  }
  const geoData = (await geoResponse.json()) as OpenMeteoGeoResponse
  const first = geoData.results?.[0]
  if (!first) {
    throw new Error(`未找到“${location}”对应的地理坐标`)
  }
  return first
}

async function fetchWeatherByLocation(location: string): Promise<string> {
  const first = await geocodeLocation(location)
  const forecastResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${first.latitude}&longitude=${first.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&timezone=Asia%2FShanghai`,
  )
  if (!forecastResponse.ok) {
    throw new Error(`天气查询失败: ${forecastResponse.status}`)
  }
  const forecastData = (await forecastResponse.json()) as OpenMeteoForecastResponse
  const current = forecastData.current
  if (!current) {
    throw new Error('天气接口未返回实时数据')
  }

  const temperature = Number.isFinite(current.temperature_2m) ? `${current.temperature_2m}°C` : '未知'
  const humidity = Number.isFinite(current.relative_humidity_2m) ? `${current.relative_humidity_2m}%` : '未知'
  const feelsLike = Number.isFinite(current.apparent_temperature) ? `${current.apparent_temperature}°C` : '未知'
  const precipitation = Number.isFinite(current.precipitation) ? `${current.precipitation} mm` : '未知'
  const windSpeed = Number.isFinite(current.wind_speed_10m) ? `${current.wind_speed_10m} km/h` : '未知'

  return `${cityLabel(first)} 当前天气：温度 ${temperature}，湿度 ${humidity}，体感 ${feelsLike}，降水 ${precipitation}，风速 ${windSpeed}。`
}

async function fetchAirQualityByLocation(location: string): Promise<string> {
  const first = await geocodeLocation(location)
  const response = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${first.latitude}&longitude=${first.longitude}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide&timezone=Asia%2FShanghai`,
  )
  if (!response.ok) {
    throw new Error(`空气质量查询失败: ${response.status}`)
  }
  const data = (await response.json()) as OpenMeteoAirQualityResponse
  const current = data.current
  if (!current) {
    throw new Error('空气质量接口未返回实时数据')
  }

  const aqi: number | null =
    typeof current.us_aqi === 'number' && Number.isFinite(current.us_aqi) ? current.us_aqi : null
  const pm25 = Number.isFinite(current.pm2_5) ? `${current.pm2_5} μg/m³` : '未知'
  const pm10 = Number.isFinite(current.pm10) ? `${current.pm10} μg/m³` : '未知'
  const ozone = Number.isFinite(current.ozone) ? `${current.ozone} μg/m³` : '未知'
  const no2 = Number.isFinite(current.nitrogen_dioxide) ? `${current.nitrogen_dioxide} μg/m³` : '未知'

  const level =
    aqi === null ? '未知' : aqi <= 50 ? '优' : aqi <= 100 ? '良' : aqi <= 150 ? '轻度污染' : aqi <= 200 ? '中度污染' : '重度污染'

  return `${cityLabel(first)} 当前空气质量：AQI ${aqi ?? '未知'}（${level}），PM2.5 ${pm25}，PM10 ${pm10}，臭氧 ${ozone}，二氧化氮 ${no2}。`
}

async function fetchExchangeRate(from: string, to: string, amount: number): Promise<string> {
  const normalizedFrom = from.toUpperCase()
  const normalizedTo = to.toUpperCase()
  const encodedAmount = encodeURIComponent(String(amount))
  const hostUrl = `https://api.exchangerate.host/convert?from=${normalizedFrom}&to=${normalizedTo}&amount=${encodedAmount}`
  try {
    const response = await fetch(hostUrl)
    if (response.ok) {
      const data = (await response.json()) as ExchangeHostResponse
      if (data.success !== false && typeof data.result === 'number') {
        const rate =
          typeof data.info?.rate === 'number' ? data.info.rate : amount > 0 ? data.result / amount : undefined
        return `汇率结果：${amount} ${normalizedFrom} = ${data.result.toFixed(4)} ${normalizedTo}${rate ? `（1 ${normalizedFrom} ≈ ${rate.toFixed(6)} ${normalizedTo}）` : ''}。`
      }
    }
  } catch {}

  const fallbackUrl = `https://api.frankfurter.app/latest?from=${normalizedFrom}&to=${normalizedTo}&amount=${encodedAmount}`
  const fallbackResponse = await fetch(fallbackUrl)
  if (!fallbackResponse.ok) {
    throw new Error(`汇率查询失败: ${fallbackResponse.status}`)
  }
  const fallbackData = (await fallbackResponse.json()) as FrankfurterResponse
  const converted = fallbackData.rates[normalizedTo]
  if (!Number.isFinite(converted)) {
    throw new Error('汇率接口未返回有效结果')
  }
  const rate = converted / amount
  return `汇率结果：${amount} ${normalizedFrom} = ${converted.toFixed(4)} ${normalizedTo}（1 ${normalizedFrom} ≈ ${rate.toFixed(6)} ${normalizedTo}）。`
}

function normalizeUrl(input: string): string {
  const raw = input.trim()
  if (!raw) throw new Error('网页链接为空')
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  const parsed = new URL(candidate)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('仅支持 http/https 链接')
  return parsed.toString()
}

async function summarizeWebPage(url: string): Promise<string> {
  const safeUrl = normalizeUrl(url)
  const readerUrl = `https://r.jina.ai/${safeUrl}`
  const response = await fetch(readerUrl)
  if (!response.ok) {
    throw new Error(`网页读取失败: ${response.status}`)
  }
  const text = (await response.text()).replace(/\s+/g, ' ').trim()
  if (!text) {
    throw new Error('网页正文为空')
  }
  const clipped = text.slice(0, 900)
  return `网页摘要（来源：${safeUrl}）：${clipped}${text.length > clipped.length ? '…' : ''}`
}

export async function executeTool(toolId: string, args: Record<string, unknown>): Promise<string> {
  if (toolId === TOOL_ID_TIME) {
    return `现在时间是：${formatChinaTimeWithWeekday()}。`
  }

  if (toolId === TOOL_ID_WEATHER) {
    const location = typeof args.location === 'string' && args.location.trim() ? args.location.trim() : '西安'
    try {
      return await fetchWeatherByLocation(location)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      return `天气查询失败：${detail}`
    }
  }

  if (toolId === TOOL_ID_AIR_QUALITY) {
    const location = typeof args.location === 'string' && args.location.trim() ? args.location.trim() : '西安'
    try {
      return await fetchAirQualityByLocation(location)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      return `空气质量查询失败：${detail}`
    }
  }

  if (toolId === TOOL_ID_EXCHANGE) {
    const from = typeof args.from === 'string' ? args.from : 'USD'
    const to = typeof args.to === 'string' ? args.to : 'CNY'
    const amount =
      typeof args.amount === 'number' && Number.isFinite(args.amount) && args.amount > 0 ? args.amount : 1
    try {
      return await fetchExchangeRate(from, to, amount)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      return `汇率查询失败：${detail}`
    }
  }

  if (toolId === TOOL_ID_WEB_SUMMARY) {
    const url = typeof args.url === 'string' ? args.url : ''
    try {
      return await summarizeWebPage(url)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      return `网页摘要失败：${detail}`
    }
  }

  return '未命中可执行工具。'
}
