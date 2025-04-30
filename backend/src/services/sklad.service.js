import axios from 'axios'
import Client from '../utils/got.js'
const skladHeaders = { 
    headers: {
    Authorization : `Basic ${process.env.SkladAuthToken}`
}}
const yougileHeaders = {
      headers: {
        "Authorization" : `Bearer ${process.env.SkladAuthToken}`
      }
}
export default class SkladService{
   static async createHook(id){
        const createdOrder = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/entity/customerorder/${id}?expand=project,agent,state,positions.assortment,owner&limit=100`)
        const yougileBody = {
            title: `${createdOrder?.project?.name || 'Без номера'}, ${new Date(new Date(createdOrder.created).getTime() + 7200000).toLocaleString("ru-RU").slice(0, 17)}, ${createdOrder?.attributes.find(el => el.name == 'Название')?.value || 'Без названия'}`,
            description: `${createdOrder.description || 'Без описания'}<br><br><br>ФИО: ${createdOrder.agent.name}<br>Телефон: <a href="tel:+${createdOrder.agent.phone}">${createdOrder.agent.phone}</a>`,
            stopwatch: { running: true },
            stickers: {},
            columnId: '900fba52-90fd-40c0-8305-f00940882239',
            idTaskCommon: createdOrder.id,
            checklists: [{   title: 'Позиции',
                            items: createdOrder.positions.rows.map(position => {
                                return {title: `${position.assortment.name} ${position.quantity}шт`, isCompleted: false
                                }
                            })
            }]
        }
        switchAttributes(yougileBody, createdOrder.attributes)
        const taskId = await Client.yougile(`https://ru.yougile.com/api-v2/tasks`,'post', {
          headers: {
             Authorization : `Bearer ${process.env[createdOrder.owner.id.replace(/-/g, '_')]}`
          },
          json: yougileBody
        })
        console.log(taskId)
   }
   static async updateHook(id){
    
   }
}
const stickersMap = {
    'Срочность': {
      name: 'Срочность',
      id: '76f9f9a4-4587-475b-a20e-cacdcc64dfb2',
      states: {
        'Срочно': { name: 'Срочно', id: '22d3fab17fce' },
        'Не срочно': { name: 'Не срочно', id: '5d4a376431e7' }
      }
    },
    'Диагностика': {
      name: 'Диагностика',
      id: '80ff2393-87e9-46c0-b9a3-7ac2aa3f8491',
      states: {
        'Сложный ремонт': { name: 'Сложный ремонт', id: 'c7b4f5b7e63e' },  
        'Созвон по цене': { name: 'Созвон по цене', id: '47c4596110d6' },  
        'Нет места': { name: 'Нет места', id: 'a0564b60694a' },
        'Бесполезно ремонтировать': { name: 'Бесполезно ремонтировать', id: '3f74fc4bbc04' },
        'Ждем решения клиента': { name: 'Ждем решения клиента', id: 'a52e3a60f0de' }
      }
    },
    'Статус': {
      name: 'Статус',
      id: 'b33d1aab-d8ad-42c8-ad40-ba88151f2162',
      states: { 'Ожидание': { name: 'Ожидание', id: 'bb2b9775bfe2' } }     
    },
    'Доставка': {
      name: 'Доставка',
      id: '436e8a70-550a-40b7-b7c9-17437ce19612',
      states: {
        'Самовывоз': { name: 'Самовывоз', id: '0d6d22833b4c' },
        'Доставка': { name: 'Доставка', id: 'f71120c93f7a' },
        'Склад': { name: 'Склад', id: '5bebe0067292' }
      }
    },
    'Упаковка': {
      name: 'Упаковка',
      id: 'e9276334-aa22-4c8d-8933-1572bbc47a7b',
      states: { 'Упаковано': { name: 'Упаковано', id: '512d3c462c91' } }   
    },
    'Какшаров Леонид': {
      name: 'Какшаров Леонид',
      id: 'e909c2a8-8138-4d5d-a285-58c022003c1e',
      states: {
        'Какшаров Леонид': { name: 'Какшаров Леонид', id: '3f0853018168' } 
      }
    },
    'Приоритет': {
      name: 'Приоритет',
      id: '60f449f5-a280-4eba-a9fd-8fcfcdc4008c',
      states: {
        'Срочно': { name: 'Срочно', id: '8cc100a681af' },
        'Не срочно': { name: 'Не срочно', id: '7701b46ee585' },
        'Отменен': { name: 'Отменен', id: 'bf35bcf74485' }
      }
    },
    'Сотрудник': {
      name: 'Сотрудник',
      id: 'ce3d5335-fbc0-4353-93fb-e88f04aff6ff',
      states: {
        'Какшаров Леонид': { name: 'Какшаров Леонид', id: '80cc4a135122' },      'Людмила': { name: 'Людмила', id: '7709e0c21db0' }
      }
    },
    'Звонок': {
      name: 'Звонок',
      id: 'c11c0381-8784-40f1-8ea6-6d8cde60cefb',
      states: {
        'Звонок после диагностики': { name: 'Звонок после диагностики', id: '821a441ea814' },
        'Звонок по стоимости': { name: 'Звонок по стоимости', id: '2069b3c94b90' }
      }
    },
    'Отметка': {
      name: 'Отметка',
      id: 'bae9ca30-5002-47f5-bdde-0c1195000d55',
      states: {
        'Вредный': { name: 'Вредный', id: 'aa08ad44a0e8' },
        'По записи': { name: 'По записи', id: 'ef54df9ccef0' },
        'Ждем клиента': { name: 'Ждем клиента', id: '10ced0a9f834' }       
      }
    }
  }
const columnsMap = {
    'Нужна диагностика': 'f90f1d04-50aa-469f-a147-ec9100f09e43',
    'Приняли в ремонт': '900fba52-90fd-40c0-8305-f00940882239',
    'Усиление': 'e0fa6da2-2a12-44ff-9ecc-65636086e399',
    'Работа с транцем': '3f0592b3-ef08-4dc2-9da1-1648859559ad',
    'Нужен звонок': '47dfc402-430b-4fd6-be7e-125fc255e4fd',
}
const switchAttributes = (object, attributes) => {
    for(const attribute of attributes){
        switch(attribute.name){
            case 'Доставка': 
                object.stickers[stickersMap['Доставка'].id] = stickersMap['Доставка'].states[attribute.value.name].id
            break
            case 'Вид работ':
                object.columnId = columnsMap[attribute.value.name]
            break
            case 'Звонок после диагностики':
                attribute.value && (object.stickers[stickersMap['Звонок'].id] = stickersMap['Звонок'].states['Звонок после диагностики'].id)
            break
        }
    }
}