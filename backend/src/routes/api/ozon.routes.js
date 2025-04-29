import express from "express"
import OzonController from '../../controllers/ozon.controller.js'
import adminRouteMiddleware from "../../middlewares/adminRoute.middleware.js"
const router = express.Router()
//api/ozon
router
    .route('/getProducts')
    .get(OzonController.getProducts)
router
    .route('/switchUpdate')
    .post(OzonController.switchUpdate)
router
    .route('/addProduct')
    .post(OzonController.addProduct)
router
    .route('/syncAllProduct')
    .get(OzonController.syncAllProduct)
router
    .route('/nullAll')
    .get(adminRouteMiddleware, OzonController.nullAll)
router
    .route('/updateAll')
    .get(OzonController.updateAll)
router
    .route('/')
    .post(OzonController.ozonHook)
export default router