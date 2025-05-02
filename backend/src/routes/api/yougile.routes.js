import express from "express"
import YouGileController from "../../controllers/yougile.controller.js"
const router = express.Router()
//api/moysklad
router
    .route('/changeStatus')
    .post(YouGileController.changeStatus)
export default router