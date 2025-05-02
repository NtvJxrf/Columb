import express from "express"
import MoySkladController from '../../controllers/moysklad.controller.js'
const router = express.Router()
//api/moysklad
router
    .route('/createHook')
    .post(MoySkladController.createHook)
router
    .route('/updateHook')
    .post(MoySkladController.updateHook)
router
    .route('/moveCardInYougile')
    .post(MoySkladController.moveCardInYougile)
export default router