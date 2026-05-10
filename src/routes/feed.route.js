import express from 'express'
import {getFeed, getPost} from '../controller/feed.controller.js'

const router = express.Router()

router.get('/', getFeed)
router.get('/:id', getPost)

export default router




