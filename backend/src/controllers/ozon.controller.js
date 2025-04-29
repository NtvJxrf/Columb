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
        const result = await OzonService.addProduct(req.body.code)
        if(result)
            return res.sendStatus(200)
        res.sendStatus(500)
    }
    static async syncAllProduct(req, res){
        const result = await OzonService.syncAllProduct() 
        if(result)
            return res.sendStatus(200)
        res.sendStatus(500)
    }
    static async nullAll(req, res){
        const result = await OzonService.nullAllStock()
        return res.sendStatus(200)
    }
    static async updateAll(req, res){
        const result = await OzonService.updateAllStock()
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