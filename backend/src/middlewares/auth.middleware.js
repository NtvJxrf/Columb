import TokenService from '../services/token.service.js';
import ApiError from '../utils/apiError.js';
import logger from '../utils/logger.js'
import ipRangeCheck from 'ip-range-check'
export const trustedIps = [ '195.34.21.0/24', '185.73.192.0/22', '91.223.93.0/24', //ozon

                            '23.105.238.220',                                      //sklad

                            '176.99.3.97','46.183.165.32','89.108.74.109','89.108.90.101',//yougile
                            '89.108.94.5','89.108.95.229','89.108.108.97','89.108.108.253',//yougile
                            '89.108.118.205','89.108.120.32','89.108.120.189','89.108.125.79',//yougile
                            '89.108.125.159','89.108.127.199', '89.108.94.215', '89.108.111.226',//yougile
                            '89.108.111.65', '89.108.124.18', '89.108.124.19', '89.108.125.140',//yougile
                            '89.108.124.17', '89.108.124.26'//yougile
]
const authMiddleware = async (req, res, next) => {
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