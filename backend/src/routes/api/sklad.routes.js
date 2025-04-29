import express from "express"
import MoySkladController from '../../controllers/moysklad.controller.js'
import adminRouteMiddleware from "../../middlewares/adminRoute.middleware.js"
const router = express.Router()
//api/sklad
router
    .route('/createHook')
    .post(MoySkladController.createHook)
router
    .route('/updateHook')
    .post(MoySkladController.updateHook)
export default router