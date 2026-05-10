import dotenv from 'dotenv'

dotenv.config()

const required = ['PORT']
required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing env: ${key}`)
  }
})

  export const PORT = process.env.PORT
  export const REDIS_PORT = process.env.REDIS_PORT
  export const REDIS_HOST = process.env.REDIS_HOST
  export const REDIS_PASSWORD = process.env.REDIS_PASSWORD
  export const NODE_ENV =  process.env.NODE_ENV || 'development'