'use strict'

const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['error'],
})

module.exports = db
