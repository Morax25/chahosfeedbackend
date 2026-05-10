import Redis from 'ioredis'
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD
} from './env.js'

export let redis

export const connectRedis = async () => {
  try {
    redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,

      // important for production stability
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true
    })

    await redis.connect()
    await redis.ping()

    console.log('Redis connected successfully')
  } catch (error) {
    console.log('Redis connection failed')
    console.log(error)

    process.exit(1)
  }
}