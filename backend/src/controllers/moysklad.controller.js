import SkladService from '../services/sklad.service.js'
export default class MoySkladController{
    static async createHook(req, res){
        const id = req.query.id
        const result = await SkladService.createHook(id)
    }
    static async updateHook(req, res){
        
    }
}