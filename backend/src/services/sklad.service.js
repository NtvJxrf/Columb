import Client from '../utils/got.js'
import Tasks from '../databases/models/yougile/tasks.model.js';
import { json } from 'sequelize';
import { text } from 'express';
export default class SkladService{
  static async createHook(id) {
    const createdOrder = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/entity/customerorder/${id}?expand=project,agent,state,positions.assortment,owner&limit=100`);
    let type = null
    if(createdOrder.state.name != 'ремонт' && createdOrder.state.name != 'изготовление')
      return
    type = createdOrder.state.name === 'ремонт' ? 'repair' : 'neworder'
    const taskId = await createOrder(createdOrder, type)
    await Tasks.create({
      skladId: id,
      yougileId: taskId
    })
    return taskId
  }


  static async updateHook(data){
    const trackedFields = ["description", "positions", 'Название', 'project', 'deliveryPlannedMoment'];
    const trackedStates = ['ремонт', 'изготовление', 'в работе']
    const updated = data.events[0]?.updatedFields;
    if (!updated || !updated.some(field => trackedFields.includes(field))) return

    const customerorderId = data.events[0].meta.href.split('/').pop()
    const order = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/entity/customerorder/${customerorderId}?expand=project,agent,state,positions.assortment,owner&limit=100`)

    if(!trackedStates.includes(order.state.name)) return

    const isRepair = order.state.name === 'ремонт';
    const customerorder = await Tasks.findOne({ where: { skladId: customerorderId } })

    if(!customerorder) return await SkladService.createHook(customerorderId)

    const audit = await Client.sklad(data.auditContext.meta.href + '/events')
    const ownerId = process.env[order.owner.id.replace(/-/g, '_')];
    const headers = { Authorization: `Bearer ${ownerId}`}
    const task = await Client.yougile(`https://ru.yougile.com/api-v2/tasks/${customerorder.yougileId}`, 'get', { headers })
    const diff = audit.rows[0].diff

    let subtasks = []
    if(data.events[0]?.updatedFields?.includes('positions') && task.subtasks?.length){
      subtasks = await Promise.all(task.subtasks.map(el => Client.yougile(`https://ru.yougile.com/api-v2/tasks/${el}`, 'get', { headers })))
    }

    const diffMessages = [`Изменения заказа<br><br><br><hr>`]
    const json = {}

    await parseDiffs()

    const response = await Client.yougile(`https://ru.yougile.com/api-v2/tasks/${customerorder.yougileId}`, 'put', {
      headers,
      json
    })

    if(diffMessages.length === 1 ) return 
    const chatMessage = diffMessages.join('')
    await Client.yougile(`https://ru.yougile.com/api-v2/chats/${response.id}/messages`, 'post', {
      headers,
      json: {
        label: 'Изменения',
        text: chatMessage,
        textHtml: chatMessage
      }
    })

    async function parseDiffs() {      
      for (const point of Object.keys(diff)) {
        const { oldValue, newValue } = diff[point];
      
        switch (point) {
          case 'description':
            diffMessages.push(`<br><br><br>Старое описание: ${oldValue}<br>Новое описание: ${newValue}<hr>`);
            json.description = formatDescription(order, isRepair)
          break;
      
          case 'positions':
            let subtasks = [];
      
            if (task.subtasks) {
              subtasks = await Promise.all(
                task.subtasks.map(el =>
                  Client.yougile(`https://ru.yougile.com/api-v2/tasks/${el}`, 'get', { headers })
                )
              );
            }
      
            for (const position of diff[point]) {
              const oldTitle = position.oldValue ? formatPositionTitle(position.oldValue) : null;
              const newTitle = position.newValue ? formatPositionTitle(position.newValue) : null;
      
              if (oldTitle && newTitle) {
                diffMessages.push(`<br><br>Позиция обновлена с: ${oldTitle}<br>На: ${newTitle}<hr>`);
                subtasks = subtasks.filter(el => el.title !== oldTitle);
                const newTasks = await createSubTasks([newTitle], ownerId);
                subtasks.push(...newTasks);
              } else if (oldTitle && !newTitle) {
                diffMessages.push(`<br><br>Позиция удалена: ${oldTitle}<hr>`);
                subtasks = subtasks.filter(el => {
                  console.log(el)
                  if(el.title !== oldTitle)
                    return true
                  Client.yougile(`https://ru.yougile.com/api-v2/tasks/${el.id}`, 'put', { headers, json: { deleted: true } })
                });
              } else if (!oldTitle && newTitle) {
                diffMessages.push(`<br><br>Добавлена новая позиция: ${newTitle}<hr>`);
                const newTasks = await createSubTasks([newTitle], ownerId);
                subtasks.push(...newTasks);
              }
            }
      
            json.subtasks = subtasks.map(el => typeof el === 'object' ? el.id : el);
          break;
            
          case 'Название':
            diffMessages.push(`<br><br><br>Название изменено с: ${oldValue || 'Без названия'}<br>На: ${newValue}<hr>`);
            json.title = formatTitle(isRepair, order)
          break
          case 'deliveryPlannedMoment':
            diffMessages.push(`<br><br><br>Дедлайн изменен с: ${oldValue || 'Без дедлайна'}<br>На: ${newValue}МСК<hr>`);
            json.deadline = { deadline: formatDeadline(order.deliveryPlannedMoment) }
          break
          case 'project':
            diffMessages.push(`<br><br><br>Проект изменен с: ${oldValue?.name || 'Без проекта'}<br>На: ${newValue?.name}<hr>`);
            json.title = formatTitle(isRepair, order)
          break
        }
      }      
    }
  }   
}
const createOrder = async (createdOrder, type) => {
  const isRepair = type === 'repair';
  const ownerId = process.env[createdOrder.owner.id.replace(/-/g, '_')];

  const yougileBody = {
    title: formatTitle(isRepair, createdOrder),
    description: formatDescription(createdOrder, isRepair),
    stopwatch: { running: true },
    stickers: {},
    columnId: isRepair
      ? '900fba52-90fd-40c0-8305-f00940882239'
      : '1e80a566-a300-46b8-a066-2a0c0b16880f',
  };
  if(createdOrder.positions)
    yougileBody.subtasks = await createSubTasks(
      createdOrder.positions.rows.map(el => `${el.assortment.name} ${el.quantity}шт`),
      ownerId
  );

  if (createdOrder.deliveryPlannedMoment) {
    yougileBody.deadline = {
      deadline: formatDeadline(createdOrder.deliveryPlannedMoment)
    };
  }

  switchAttributes(createdOrder.attributes, yougileBody);

  const { id } = await Client.yougile(`https://ru.yougile.com/api-v2/tasks`, 'post', {
    headers: {
      Authorization: `Bearer ${ownerId}`
    },
    json: yougileBody
  });

  return id;
};
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
const switchAttributes = (attributes, object) => {
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

const rules = {
  "Лодка моторная": ["Раскрой", "Сборка корпуса", "Сборка сумок", "Установка транца", "Установка фурнитуры", "Установка днища", "Усиление"],
  "Катамаран с рамой": ["Раскрой", "Сборка баллонов", "Сборка сумок", "Установка крепления рамы", "Установка фурнитуры", "Усиление", "Сборка рамы"],
  "Катамаран с надувной рамой": ["Раскрой", "Сборка баллонов", "Сборка сумок", "Установка перемычек и палубы", "Установка фурнитуры", "Усиление"],
  "Моторная лодка НДНД": ["Раскрой", "Сборка корпуса", "Сборка днища", "Сборка сумок", "Установка транца", "Установка фурнитуры", "Установка днища", "Усиление"],
  "Баллон для катамарана": ["Раскрой", "Сборка баллона", "Установка крепления", "Установка усиления", "Установка фурнитуры"],
  "Внутренний баллон для катамарана": ["Раскрой", "Сборка баллона"],
  "Надувное кресло": ["Раскрой", "Сборка кресла", "Установка фурнитуры"],
  "Гребная лодка НД": ["Раскрой", "Сборка корпуса", "Сборка днища", "Сборка сумки", "Установка фурнитуры", "Установка днища"],
  "Лодка гребная": ["Раскрой", "Сборка корпуса", "Сборка сумки", "Установка фурнитуры", "Установка днища"],
  "Матрас надувной": ["Раскрой", "Сборка матраса", "Пошив чехла", "Установка фурнитуры"],
  "Накладка на банку": ["Раскрой", "Шитье накладок"],
  "Комплект накладка на банку + сумка": ["Раскрой", "Шитье накладок", "Шитье сумки"],
  "Сумка на ликтрос": ["Раскрой", "Пошив сумок", "Установка фурнитуры"],
  "Сумка на молнии": ["Раскрой", "Пошив молний и ручек", "Сборка сумок"],
  "Сумка для": ["Раскрой", "Пошив молний и ручек", "Сборка сумок"],
  "Ведро": ["Раскрой", "Пошив", "Сборка ведер"],
  "Надувной баллон \"Динамический снаряд\"": ["Раскрой", "Сборка снарядов", "Установка фурнитуры"],
  "Балансировочная платформа из ткани пвх": ["Раскрой", "Сборка платформ", "Установка фурнитуры"],
  "Конус из ткани пвх, с ручками": ["Раскрой", "Пошив тарелочек", "Сборка конусов", "Установка фурнитуры"],
  "Гермосумка": ["Раскрой", "Пошив фурнитуры", "Сборка"],
  "Гермомешок 40л": ["Раскрой", "Пошив фурнитуры", "Сборка"],
  "Гермомешок 60л": ["Раскрой", "Пошив фурнитуры", "Сборка"],
  "Гермомешок 80л": ["Раскрой", "Сборка"],
  "Гермомешок 100л": ["Раскрой", "Сборка"],
  "Гермомешок 120л": ["Раскрой", "Сборка"],
  "Гермомешок 140л": ["Раскрой", "Сборка"],
  "Гермомешок 160л": ["Раскрой", "Сборка"],
  "Баллоны из ткани пвх по размерам заказчика для РИБ-390": ["Раскрой", "Сборка корпуса", "Обвес"],
  "Баллоны из ткани пвх по размерам заказчика для РИБ-445 с пластиковой вставкой": ["Раскрой", "Сборка корпуса", "Обвес"],
  "Баллоны из ткани пвх по размерам заказчика для РИБ-465": ["Раскрой", "Сборка корпуса", "Обвес"]
};

const createSubTasks = async (positions, owner) => {
  const result = []
  for(const position of positions){
    const args = {
      headers: {
         Authorization : `Bearer ${owner}`
      },
      json: {title: position }
    }
    const matchedKey = Object.keys(rules).find(key => position.includes(key));
    const subtasks = rules[matchedKey]
    if(subtasks){
      const idsubtasks = await createSubTasks(subtasks, owner)
      args.json.subtasks = idsubtasks
    }
    result.push(Client.yougile(`https://ru.yougile.com/api-v2/tasks`, 'post', args))
  }
  const ids = await Promise.all(result)
  return ids.map(el => el.id)
}

const formatPositionTitle = (position) => `${position.assortment.name} ${position.quantity}шт`;
const formatTitle = (isRepair, order) => `${(isRepair ? order?.project?.name : order.name)|| 'Без номера'}, ${new Date(new Date(order.created).getTime() + 7200000).toLocaleString("ru-RU").slice(0, 17)}, ${order?.attributes.find(el => el?.name == 'Название')?.value || 'Без названия'}`
const formatDeadline = (date) => Math.round(new Date(date).getTime())
const formatDescription = (order, isRepair) => isRepair
  ? `${order.description || 'Без описания'}<br><br><br>ФИО: ${order.agent?.name || 'Без имени'}<br>Телефон: <a href="tel:+${order.agent?.phone || 'Без номера телефона'}">${order.agent.phone}</a>`
  : `${order.description || 'Без описания'}`