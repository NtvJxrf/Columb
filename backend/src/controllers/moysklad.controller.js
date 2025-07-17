import SkladService from '../services/sklad.service.js'
export default class MoySkladController{
    static async createHook(req, res){
        const id = req.query.id
        res.sendStatus(200)
        SkladService.createHook(id)
    }
    static async updateHook(req, res){
        const id = req.query.id
        res.sendStatus(200)
        SkladService.updateHook(id)
    }
    static async moveCardInYougile(req, res){
        const id = req.query.id
        res.sendStatus(200)
        SkladService.moveCardInYougile(id)
    }
}