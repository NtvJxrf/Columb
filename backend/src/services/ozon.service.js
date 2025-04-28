import axios from "axios";
import Product from '../databases/models/ozon/product.model.js'
const ozonHeaders = {
    headers: {
        "Client-Id": process.env.Ozon_Client_Id,
        "Api-Key": process.env.Ozon_Api_Key
    }
}
const skladHeaders = { 
    headers: {
    Authorization : `Basic ${process.env.SkladAuthToken}`
}}
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
        const response = await axios.post(`https://api-seller.ozon.ru/v3/product/info/list`, {
            "offer_id": [ code ],
        }, ozonHeaders);
        
        const skladInfo = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=code=${code}&expand=components.assortment&limit=100`, skladHeaders);
        
        if (response.status !== 200 || skladInfo.status !== 200)
            return false;
    
        const ozonData = response.data.items[0];
        const skladData = skladInfo.data.rows[0];
    
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
    
        let [product] = await Product.upsert(productArgs, { returning: true, conflictFields: ['code'] },);
    
            
        if (skladData.components) {
            for (const item of skladData.components.rows) {
                const el = item.assortment;
    
                const componentArgs = {
                    code: el.code,
                    name: el.name,
                    assortmentId: el.id,
                    type: el.meta.type,
                };

                let [component] = await Product.upsert(componentArgs, { returning: true }, { conflictFields: ['code'] });
    
                if (Array.isArray(component)) {
                    component = component[0];
                }
    
                await product.addComponent(component, {
                    through: { quantity: item.quantity }
                });
            }
        }
    
        return true;
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
        const response = await axios.post(`https://api.moysklad.ru/api/remap/1.2/entity/demand`, args, skladHeaders)
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
        const response = await axios.post(`https://api.moysklad.ru/api/remap/1.2/entity/enter`, args, skladHeaders)
    }
    static async nullAll(){

    }
    static async deleteProducts(code){

    }

    static async syncAllProduct() {    
        const allCodes = await axios.post(`https://api-seller.ozon.ru/v3/product/list`, {
            "filter": { "visibility": "ALL" },
            "limit": 1000
        }, ozonHeaders)
    
        const codes = allCodes.data.result.items.map(el => el.offer_id)
    
        const ozonInfo = await axios.post(`https://api-seller.ozon.ru/v3/product/info/list`, {
            "offer_id": codes,
        }, ozonHeaders)

        const chunkedOfferIds = [...codes]
        const responses = []
    
        while (chunkedOfferIds.length) {
            const temp = chunkedOfferIds.splice(0, 95);
            const filterString = temp.map(code => `code=${code}`).join(';');
            const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=${filterString}&expand=components.assortment&limit=100`;
    
            responses.push(axios.get(url, skladHeaders));
        }
    
        const resultResponses = await Promise.allSettled(responses)
    
        const products = {}
        ozonInfo.data.items.forEach(item => {
            products[item.offer_id] = {
                sku: item.sources.find(i => i.source === 'sds' && i.shipment_type === 'SHIPMENT_TYPE_GENERAL')?.sku,
                code: item.offer_id,
                productId: item.id,
                listed: true,
                updateIt: true
            }
        })
    
        for (const res of resultResponses) {
            const rows = res.value.data.rows
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
    
        for (const item of Object.values(products)) {
            let [product] = await Product.upsert(item, { conflictFields: ['code'] });
    
            if (item.components) {
                const componentPromises = item.components.map(async (i) => {
                    const el = i.assortment;
                    let [component] = await Product.upsert({
                        code: el.code,
                        name: el.name,
                        assortmentId: el.id,
                        type: el.meta.type,
                    }, { conflictFields: ['code'] });
    
                    await product.addComponent(component, {
                        through: { quantity: i.quantity }
                    });
                });

                await Promise.all(componentPromises);
            }
        }
        return true;
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
        const skladData = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=${filterString}&expand=components.assortment&limit=100`, skladHeaders)
        const positions = skladData.data.rows.map(el => {
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