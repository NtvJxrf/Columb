import express from "express"
import CalcRouter from './api/calcs.routes.js'
import UserRouter from './api/user.routes.js'
import OzonRouter from './api/ozon.routes.js'
import SkladRouter from './api/sklad.routes.js'
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
router.use('/moysklad', SkladRouter)
router.use((req, res) => {
    res.status(404).json({ message: "Not Found" })
})

export default router