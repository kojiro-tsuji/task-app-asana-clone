import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const providers = ['aws-0', 'gcp-0']
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
  'eu-central-1',
  'eu-west-3'
]

export async function GET() {
  const results: any = {}

  for (const provider of providers) {
    for (const region of regions) {
      const key = `${provider}-${region}`
      const encodedPassword = "z-JJtz6%21HSq6jgK"
      const url = `postgresql://postgres.yakqeblvqcpztgwbofeo:${encodedPassword}@${provider}.${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
      
      try {
        const client = new PrismaClient({
          datasources: {
            db: { url }
          }
        })
        await client.$connect()
        results[key] = "✅ CONNECTED SUCCESS!"
        await client.$disconnect()
      } catch (e: any) {
        const msg = e.message || ''
        if (msg.includes('not found') || msg.includes('tenant')) {
          results[key] = "❌ Tenant not found"
        } else if (msg.includes('authentication failed') || msg.includes('password')) {
          results[key] = "🔑 Correct Region! But Password Auth Failed"
        } else {
          // Connection timed out or DNS error, omit to keep output readable
        }
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
