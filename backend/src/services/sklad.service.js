import axios from 'axios'
export default class SkladService{
   static async createHook(id){
        const createdOrder = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/customerorder/${id}`)
        console.log(createdOrder.data)
   }
   static async updateHook(events){
    
   }
}