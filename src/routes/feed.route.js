import express from 'express'
import { getFeed, getPost, getModerationQueue, deleteModerationPost } from '../controller/feed.controller.js'

const router = express.Router()

router.get('/', getFeed)
router.get('/moderation/queue', getModerationQueue)
router.delete('/moderation/queue/:postId', deleteModerationPost)
router.get('/:id', getPost)

export default router
