import TokenService from '../services/token.service.js';
import ApiError from '../utils/apiError.js';
import logger from '../utils/logger.js'
import ipRangeCheck from 'ip-range-check'
export const trustedIps = [ '195.34.21.0/24', '185.73.192.0/22', '91.223.93.0/24', //ozon

                            '23.105.238.220', '23.105.239.236',                    //sklad

                            '176.99.2.42','89.108.74.231','89.108.82.230',['89.108.94.211', '89.108.94.217'],//yougile
                            '89.108.109.85','89.108.117.153','89.108.120.67','89.108.120.149',//yougile
                            '89.108.120.158','89.108.120.246','89.108.120.247','89.108.122.62',//yougile
                            '89.108.124.175','89.108.127.200','194.67.64.241',//yougile
                            '127.0.0.1','::1'//localhost
]
const authMiddleware = async (req, res, next) => {
    console.log(req.ip)
    if (ipRangeCheck(req.ip, trustedIps)) {
        return next();
    }
    try {
        const accessToken = req.cookies.accessToken
        const refreshToken = req.cookies.refreshToken
        if (!accessToken && !refreshToken) {
            return next(new ApiError(401, 'Unauthorized: No tokens'));
        }

        try {
            const payload = TokenService.verifyAccessToken(accessToken)
            req.user = payload
            return next()
        } catch (error) {
            if (refreshToken) {
                try {
                    const tokens = await TokenService.refreshTokens(refreshToken)
                    res.cookie('accessToken', tokens.accessToken, {
                        maxAge: process.env.JWT_ACCESS_EXPIRATION_MINUTES * 60 * 1000,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict'
                    });
                    res.cookie('refreshToken', tokens.refreshToken, {
                        maxAge: process.env.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict'
                    });
                    const payload = TokenService.verifyAccessToken(tokens.accessToken);
                    res.cookie('id', payload.id, {
                        maxAge: process.env.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
                    })
                    req.user = payload;
                    return next();
                } catch (error) {
                    res.clearCookie('accessToken');
                    res.clearCookie('refreshToken');
                    console.error('Error refreshing token: ', error);
                    logger.error('Error refreshing token: ', error);
                    return next(new ApiError(401, 'Invalid refresh token'));
                }
            }
            return next(new ApiError(401, 'Invalid access token'));
        }
    } catch (error) {
        console.error('Authentication error:', error);
        logger.error('Authentication error:', error);
        next(new ApiError(401, 'Authentication failed'));
    }
};
export default authMiddleware;