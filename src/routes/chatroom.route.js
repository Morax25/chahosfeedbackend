import { Router } from 'express'
import { getMessages } from '../controller/messages.controller.js'

const router = Router()

router.get('/:id', getMessages)

export default router
