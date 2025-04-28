import axios from "axios";
import Product from '../databases/models/ozon/product.model.js'

const ozonHeaders = {
    headers: {
        "Client-Id": process.env.Ozon_Client_ID,
        "Api-Key": process.env.Ozon_Api_Key
    }
}
const skladHeaders = { 
    headers: {
    Authorization : `Basic ${process.env.SkladAuthToken}`
}}
console.log(skladHeaders, ozonHeaders)
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
    static async addProduct(code){
        const response = await axios.post(`https://api-seller.ozon.ru/v3/product/list`, {
            "filter": {
                "offer_id": [code],
                "visibility": "ALL"
            },
            "last_id": "",
            "limit": 1000
        }, ozonHeaders)
        const allOfferIds = response.data.result.items
        if(allOfferIds.length === 0 ) return false
        return await this.addProducts(allOfferIds)
    }
    static async addProducts(productsArray){
        const product_ids = {}
        const codes = productsArray.map(el => {
            product_ids[el.offer_id] = el.product_id
            return el.offer_id
        })
        const chunkedOfferIds = [...codes];
        const responses = [];

        while (chunkedOfferIds.length) {
            const temp = chunkedOfferIds.splice(0, 95);
            const filterString = temp.map(code => `code=${code}`).join(';');
            const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=${filterString}&expand=components.assortment&limit=100`;

            responses.push(axios.get(url, skladHeaders));
        }

        const resultResponses = await Promise.allSettled(responses);

        for (const res of resultResponses) {
            if (res.status !== 'fulfilled') {
                console.error('Ошибка запроса:', res.reason);
                continue
            }

            const rows = res.value.data.rows;
            if(rows.length == 0 ) continue
            for (const item of rows) {
                let product = await Product.findOne({ where: { assortmentId: item.id } });
                const productArgs = {
                    code: item.code,
                    productId: product_ids[item.code],
                    name: item.name,
                    assortmentId: item.id,
                    type: item.meta.type,
                    updateIt: product_ids[item.code] ? true : false,
                    listed: product_ids[item.code] ? true : false,
                    skladPrice: item.salePrices[0].value
                }
                if (!product)
                    product = await Product.create(productArgs);
                

                if (item.components?.rows?.length) {
                    for (const el of item.components.rows) {
                        let component = await Product.findOne({
                            where: { assortmentId: el.assortment.id }
                        });
                        const componentArgs = {
                            code: el.assortment.code,
                            name: el.assortment.name,
                            assortmentId: el.assortment.id,
                            type: el.assortment.meta.type,
                            updateIt: product_ids[el.assortment.code] ? true : false, 
                            listed: product_ids[el.assortment.code] ? true : false,
                            skladPrice: el.assortment.salePrices[0].value
                        }
                        if (!component) 
                            component = await Product.create(componentArgs)

                        await product.addComponent(component, {
                            through: { quantity: el.quantity }
                        });
                    }
                }
            }
        }
        return true
    }
    static async newPosting(){

    }
    static async postingCancelled(){

    }
    static async nullAll(){

    }
    static async deleteProducts(code){

    }

    static async syncAllProduct(){
        const response = await axios.post(`https://api-seller.ozon.ru/v3/product/list`, {
            "filter": {
              "visibility": "ALL"
            },
            "last_id": "",
            "limit": 1000
        }, ozonHeaders)
        const allOfferIds = response.data.result.items
        return  this.addProducts(allOfferIds)
    }
}