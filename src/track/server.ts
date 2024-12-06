import express from 'express'
import auth from './endpoints/auth.js'

const app = express()

app.get('/api/auth', auth)

app.listen(3000)
