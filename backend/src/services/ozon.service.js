import axios from "axios";
import Product from '../databases/models/ozon/product.model.js'
import logger from "../utils/logger.js";
import Client from "../utils/got.js";
import doTransaction from "../utils/doTransaction.js";
import ApiError from "../utils/apiError.js";
let isUpgrading = false
export default class OzonService{
    static async getProducts(){
        const result = await Product.findAll({ where: { listed: true } })
        return result.map(el => el.toJSON())
    }
    static async switchUpdate(data){
        const products = await Product.findAll({
            where: { code: data }
          });
          
        const results = await Promise.allSettled(
            products.map(product =>
                product.update({ updateIt: !product.updateIt })
            )
        );
        return results.filter(el => el.status != 'fulfilled').map(el => el.value.code)
    }
    static async addProduct(code) {
        const response = await Client.ozon(`https://api-seller.ozon.ru/v3/product/info/list`, 'post',{
                "offer_id": [ code ],
            })
        const skladInfo = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=code=${code}&expand=components.assortment&limit=100`, 'get');
        const ozonData = response.items[0];
        const skladData = skladInfo.rows[0];
    
        const productArgs = {
            code,
            productId: ozonData.id,
            sku: ozonData.sources.find(item => item.source === 'sds' && item.shipment_type === 'SHIPMENT_TYPE_GENERAL')?.sku,
            name: ozonData.name,
            assortmentId: skladData.id,
            type: skladData.meta.type,
            updateIt: true,
            listed: true,
        };
        return await doTransaction(async (t) => {
            let [product] = await Product.upsert(productArgs, { 
                returning: true,
                conflictFields: ['code'],
                transaction: t
            });
        
                
            if (skladData.components) {
                for (const item of skladData.components.rows) {
                    const el = item.assortment;
        
                    const componentArgs = {
                        code: el.code,
                        name: el.name,
                        assortmentId: el.id,
                        type: el.meta.type,
                    };

                    let [component] = await Product.upsert(componentArgs, {
                        returning: true,
                        conflictFields: ['code'],
                        transaction: t
                      });
        
                    if (Array.isArray(component)) {
                        component = component[0];
                    }
        
                    await product.addComponent(component, {
                        through: { quantity: item.quantity },
                        transaction: t
                      });
                }
            }
            return true
        }, 'Ошибка при добавлении продукта')
    }
    static async newPosting(data){
        const args = {
            "agent": {
                "meta": {
                            "href": "https://api.moysklad.ru/api/remap/1.2/entity/counterparty/9893428c-d5d3-11ec-0a80-0c7b000bdebf",
                            "type": "counterparty",
                            "mediaType": "application/json"
                        }
            },
            "organization": {
                "meta": {
                    "href": "https://api.moysklad.ru/api/remap/1.2/entity/organization/77e3a9af-4dfb-11e8-9107-5048002bbbf7",
                    "type": "organization",
                    "mediaType": "application/json"
              }
            },
            "store": {
                "meta": {
                    "href": "https://api.moysklad.ru/api/remap/1.2/entity/store/77e4c035-4dfb-11e8-9107-5048002bbbf9",
                    "type": "store",
                    "mediaType": "application/json"
                }
            },
            "state": {
                "meta": {
                    "href" : "https://api.moysklad.ru/api/remap/1.2/entity/demand/metadata/states/261e245d-e9c1-11e9-0a80-01b40007536e",
                    "type" : "state",
                    "mediaType" : "application/json"
                }
            },
            "salesChannel": {
                "meta": {
                    "href" : "https://api.moysklad.ru/api/remap/1.2/entity/saleschannel/b0a15997-de45-11ec-0a80-02f600145265",
                    "type" : "saleschannel",
                    "mediaType" : "application/json",
                }
            },
            "description": `This document created automatically with API, it belongs to order with posting number ${data.posting_number}`
        }
        args.positions = await getPositions(data)
        const response = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/entity/demand`, 'post', args)
    }
    static async postingCancelled(data){
        const args = {
            "organization": {
                "meta": {
                    "href": "https://api.moysklad.ru/api/remap/1.2/entity/organization/77e3a9af-4dfb-11e8-9107-5048002bbbf7",
                    "type": "organization",
                    "mediaType": "application/json"
              }
            },
            "store": {
                "meta": {
                    "href": "https://api.moysklad.ru/api/remap/1.2/entity/store/77e4c035-4dfb-11e8-9107-5048002bbbf9",
                    "type": "store",
                    "mediaType": "application/json"
                }
            },
            "state": {
                "meta": {
                    "href" : "https://api.moysklad.ru/api/remap/1.2/entity/enter/metadata/states/138e167d-682f-11ee-0a80-054f00100492",
                    "metadataHref" : "https://api.moysklad.ru/api/remap/1.2/entity/enter/metadata",
                    "type" : "state",
                    "mediaType" : "application/json"
                  }
            },
            "description": `This document created automatically with API, it belongs to order with posting number ${data.posting_number}`
        }
        args.positions = await getPositions(data)
        const response = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/entity/enter`, 'post', args)
    }
    static async nullAllStock() {
        if (isUpgrading)
            throw new ApiError(503, 'В данный момент товары обновляются, попробуйте позже')
        
        isUpgrading = true;
        
        try {
            const warehouseId = 23524151071000;
            const products = await Product.findAll({
                where: { listed: true },
                attributes: ['productId']
            });
        
            await Product.update({ updateIt: false }, { where: { listed: true } });
        
            const allStocks = products.map(el => ({
                product_id: el.productId,
                quant_size: 1,
                stock: 0,
                warehouse_id: warehouseId
            }));
        
            const chunkSize = 95;
        
            for (let i = 0; i < allStocks.length; i += chunkSize) {
                const chunk = allStocks.slice(i, i + chunkSize);
                try {
                    const response = await Client.ozon(
                        `https://api-seller.ozon.ru/v2/products/stocks`,
                        'post',
                        { stocks: chunk }
                    );
                } catch (err) {
                    logger.error('Ошибка при обнулении остатков', err.message);
                }
        
                if (i + chunkSize < allStocks.length) {
                    await new Promise(resolve => setTimeout(resolve, 30_000));
                }
            }
        
        } finally {
            isUpgrading = false
        }
        return true
    }
    static async updateAllStock(){
        if (isUpgrading)
            throw new ApiError(503, 'В данный момент товары обновляются, попробуйте позже')
        
        isUpgrading = true;
        try{
            const warehouseId = 23524151071000;
            const products = await Product.findAll({
                where: { listed: true, updateIt: true },
                attributes: ['productId', 'assortmentId', 'type'],
                include: [{
                        model: Product,
                        as: 'Components',
                        through: { attributes: ['quantity'] }
                    }]
            });
            const stock = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/report/stock/all/current?include=zeroLines`)
            const stockMap = new Map()
            stock.forEach(el => stockMap.set(el.assortmentId, el.stock))
            const allStocks = products.map(el => {
                let stock = Math.max(stockMap.get(el.assortmentId) || 0, 0)
                if(el.type === 'bundle'){
                    const temp = []
                    el.Components.forEach( i => temp.push(Math.max((stockMap.get(i.assortmentId) || 0) / i.ProductComponents.quantity, 0)))
                    stock = Math.floor(Math.min(...temp))

                }
                return {
                    product_id: el.productId,
                    quant_size: 1,
                    stock,
                    warehouse_id: warehouseId
                }
            });
            const chunkSize = 95;
            for (let i = 0; i < allStocks.length; i += chunkSize) {
                const chunk = allStocks.slice(i, i + chunkSize);
                try {
                    const response = await Client.ozon(`https://api-seller.ozon.ru/v2/products/stocks`,'post',{ stocks: chunk },);
                } catch (err) {
                    logger.error('Ошибка при обновлении остатков', err.message)
                }
        
                if (i + chunkSize < allStocks.length) {
                    await new Promise(resolve => setTimeout(resolve, 30_000));
                }
            }
        }finally{
            isUpgrading = false
        }
        return true
    }
    static async deleteProducts(code){

    }

    static async syncAllProduct() {
        const allCodes = await Client.ozon(`https://api-seller.ozon.ru/v3/product/list`, 'post', {
            "filter": { "visibility": "ALL" },
            "limit": 1000
        })
        const codes = allCodes.result.items.map(el => el.offer_id)
    
        const ozonInfo = await Client.ozon(`https://api-seller.ozon.ru/v3/product/info/list`, 'post', {
            "offer_id": codes,
        })
        const chunkedOfferIds = [...codes]
        const responses = []
    
        while (chunkedOfferIds.length) {
            const temp = chunkedOfferIds.splice(0, 95);
            const filterString = temp.map(code => `code=${code}`).join(';');
            const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=${filterString}&expand=components.assortment&limit=100`;
    
            responses.push(Client.sklad(url, 'get'));
        }
    
        const products = {}
        ozonInfo.items.forEach(item => {
            products[item.offer_id] = {
                sku: item.sources.find(i => i.source === 'sds' && i.shipment_type === 'SHIPMENT_TYPE_GENERAL')?.sku,
                code: item.offer_id,
                productId: item.id,
                listed: true,
                updateIt: true
            }
        })
        const resultResponses = await Promise.allSettled(responses)
        for (const res of resultResponses) {
            const rows = res.value.rows
            for (const item of rows) {
                const productData = {
                    code: item.code,
                    name: item.name,
                    assortmentId: item.id,
                    type: item.meta.type,
                    components: item?.components?.rows
                }
                products[item.code] = { ...products[item.code], ...productData }
    
                if (item.components) {
                    item.components.rows.forEach(el => {
                        if (!products[el.assortment.code]) {
                            products[el.assortment.code] = {
                                code: el.assortment.code,
                                name: el.assortment.name,
                                assortmentId: el.assortment.id,
                                type: el.assortment.meta.type,
                            }
                        }
                    })
                }
            }
        }
        return doTransaction(async (t) => {
            for (const item of Object.values(products)) {
                let [product] = await Product.upsert(item, { conflictFields: ['code'], transaction: t});
        
                if (item.components) {
                    const componentPromises = item.components.map(async (i) => {
                        const el = i.assortment;
                        let [component] = await Product.upsert({
                            code: el.code,
                            name: el.name,
                            assortmentId: el.id,
                            type: el.meta.type,
                        }, { conflictFields: ['code'], transaction: t });
        
                        await product.addComponent(component, {
                            through: { quantity: i.quantity },
                            transaction: t
                        });
                    });
    
                    await Promise.all(componentPromises);
                }
            }
            return true;
        }, 'Ошибка при синхронизации всех продуктов')
    }
    
}
const getPositions = async (data) => {
    const orderMap = {}
        const products = await Product.findAll({
            where: {
                sku: data.products.map(el => el.sku)
            }
        })
        const filterString = products.map(el => {
            orderMap[el.code] = {sku: el.sku}
            return `code=${el.code}`
        }).join(';')
        const skladData = await Client.sklad(`https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=${filterString}&expand=components.assortment&limit=100`)
        const positions = skladData.rows.map(el => {
            if(el.components){
                return el.components.rows.map(component => {
                    return {
                        price: component.assortment.salePrices[0].value,
                        assortment: {
                            meta: component.assortment.meta
                        },
                        quantity: component.quantity * data.products.find(i => i.sku === orderMap[el.code].sku).quantity
                    }
                })
            }else{
                return {
                    price: el.salePrices[0].value,
                        assortment: {
                            meta: el.meta
                        },
                    quantity: data.products.find(i => i.sku === orderMap[el.code].sku).quantity
                }
            }
        }).flat()
        return positions
}