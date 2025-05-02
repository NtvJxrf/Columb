import Client from '../utils/got.js'
import Tasks from '../databases/models/yougile/tasks.model.js'
export default class YouGileService{
  static async changeStatus(data) {
    const task = data.payload
    if(task.columnId === '4f871d08-03cc-40a8-96f4-12b4a0d22208'){
        const order = await Tasks.findOne({ where: { yougileId: task.id } })
        if(!order) return
        const response = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/entity/customerorder/${order.skladId}`, 'put', {
                "state" : {
                    "meta" : {
                        "href" : "https://api.moysklad.ru/api/remap/1.2/entity/customerorder/metadata/states/2af4ce96-2788-11f0-0a80-1950002dd89c",
                        "metadataHref" : "https://api.moysklad.ru/api/remap/1.2/entity/customerorder/metadata",
                        "type" : "state",
                        "mediaType" : "application/json"
                    }
                }
        })
        return response
    }
    return
  } 
}