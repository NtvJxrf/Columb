import YouGileService from "../services/yougile.service.js";
export default class YouGileController{
    static async changeStatus(req, res){
        const result = await YouGileService.changeStatus(req.body)
        res.sendStatus(200)
    }
}