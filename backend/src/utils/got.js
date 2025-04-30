import got from 'got';
import ApiError from './apiError.js';

const gotClient = got.extend({
    retry: {
        limit: 3,
        statusCodes: [408, 500, 502, 503, 504],
        errorCodes: ['ETIMEDOUT', 'ECONNREFUSED'],
    },
    throwHttpErrors: false,
});


let yougileRequestCount = 0;
const YOUGILE_LIMIT = 50;

let mouskladRequestCount = 0;
const MOYSKLAD_LIMIT = 45;


class Client {
    static async request(url, type, args, service) {
        const response = await gotClient[type](url, args);
        if (response.statusCode >= 200 && response.statusCode < 300) {
            return JSON.parse(response.body);
        } else {
            throw new ApiError(response.statusCode, `Ошибка во время запроса к ${service}, ${response.body}`);
        }
    }

    static async sklad(url, type = 'get', data) {
        const args = {
            headers: {
                Authorization: `Basic ${process.env.SkladAuthToken}`,
            },
            json: data || undefined,
        };
        while (mouskladRequestCount >= MOYSKLAD_LIMIT) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        mouskladRequestCount++
        setTimeout(() => {
            mouskladRequestCount--
        }, 3_000)
        return this.request(url, type, args, 'MoySklad');
    }

    static async ozon(url, type = 'get', data) {
        const args = {
            headers: {
                'Client-Id': process.env.Ozon_Client_Id,
                'Api-Key': process.env.Ozon_Api_Key,
            },
            json: data || undefined,
        };
        return this.request(url, type, args, 'Ozon');
    }

    static async yougile(url, type = 'get', args) {
        while (yougileRequestCount >= YOUGILE_LIMIT) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        yougileRequestCount++
        setTimeout(() => {
            yougileRequestCount--
        }, 60_000)
        return this.request(url, type, args, 'YouGile')
    }
}

export default Client;
