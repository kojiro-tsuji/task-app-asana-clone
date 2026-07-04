import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const regions = [
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1'
]

export async function GET() {
  const results: any = {}

  for (const region of regions) {
    const encodedPassword = "z-JJtz6%21HSq6jgK"
    const url = `postgresql://postgres.yakqeblvqcpztgwbofeo:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
    
    try {
      const client = new PrismaClient({
        datasources: {
          db: { url }
        }
      })
      await client.$connect()
      results[region] = "✅ CONNECTED SUCCESS!"
      await client.$disconnect()
    } catch (e: any) {
      const msg = e.message || ''
      if (msg.includes('not found') || msg.includes('tenant')) {
        results[region] = "❌ Tenant not found"
      } else if (msg.includes('authentication failed') || msg.includes('password')) {
        results[region] = "🔑 Correct Region! But Password Auth Failed"
      } else {
        results[region] = `❓ Other Error: ${msg.substring(0, 100)}`
      }
    }
  }

  // 直接接続（5432）もテストする
  try {
    const directUrl = `postgresql://postgres:z-JJtz6%21HSq6jgK@db.yakqeblvqcpztgwbofeo.supabase.co:5432/postgres`
    const client = new PrismaClient({
      datasources: {
        db: { url: directUrl }
      }
    })
    await client.$connect()
    results["direct-5432"] = "✅ DIRECT CONNECTED SUCCESS!"
    await client.$disconnect()
  } catch (e: any) {
    results["direct-5432"] = `❌ Direct Error: ${e.message?.substring(0, 100)}`
  }

  return NextResponse.json(results)
}
