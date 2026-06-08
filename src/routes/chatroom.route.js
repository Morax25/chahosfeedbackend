import { Router } from "express"
import { getMessages, getRooms, createRoom } from "../controller/messages.controller.js"

const router = Router()

router.get("/", getRooms)
router.post("/create", createRoom)
router.get("/:id", getMessages)

export default router
