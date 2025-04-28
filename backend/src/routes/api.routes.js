import express from "express"
import UserController from "../controllers/user.controller.js"
import CalcsController from "../controllers/calc.controller.js"
import adminRouteMiddleware from "../middlewares/adminRoute.middleware.js"
import CalcRouter from './api/calcs.routes.js'
import UserRouter from './api/user.routes.js'
import OzonRouter from './api/ozon.routes.js'
const router = express.Router()

//api routes
router
    .route('/isAuthenticated')
    .get((req, res) => {
        res.json({ auth: true})
    })
router.use('/calc', CalcRouter)
router.use('/user', UserRouter)
router.use('/ozon', OzonRouter)
router.use((req, res) => {
    res.status(404).json({ message: "Not Found" })
})

export default router