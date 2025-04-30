import OzonService from '../services/ozon.service.js'
export default class OzonController{
    static async getProducts(req, res){
        const result = await OzonService.getProducts()
        res.status(200).json(result)
    }
    static async switchUpdate(req, res){
        const result = await OzonService.switchUpdate(req.body)
        res.status(200).json(result)
    }
    static async addProduct(req, res){
        await OzonService.addProduct(req.body.code)
        res.sendStatus(200)
    }
    static async syncAllProduct(req, res){
        await OzonService.syncAllProduct() 
        res.sendStatus(200)
    }
    static async nullAll(req, res){
        await OzonService.nullAllStock()
        return res.sendStatus(200)
    }
    static async updateAll(req, res){
        await OzonService.updateAllStock()
        return res.sendStatus(200)
    }
    static ozonHook(req, res){
        const { message_type } = req.body
        OzonController[message_type](req, res)
    }
    static TYPE_PING(req, res){
        res.status(200).json({
            "version": "0.1",
            "name": "columbAPI",
            "time": new Date()
        })
    }
    static async TYPE_NEW_POSTING(req, res){
        const result = await OzonService.newPosting(req.body)
        res.sendStatus(200)
    }
    static async TYPE_POSTING_CANCELLED(req, res){
        const result = await OzonService.postingCancelled(req.body)
        res.sendStatus(200)
    }
    static async deleteProducts(){

    }
}