const fetch = require('node-fetch');  // Import node-fetch
const jwt = require('jsonwebtoken');

// Định nghĩa các giá trị cần thiết
const apiKeySid = 'SK.0.aKolUvebgJY2aRzZkq32mkKkSjVSLkkB';
const apiKeySecret = 'OW5LNEYzOWxaTTduVlBsY1k3bURQU1F6MUF2UVdhd3Y=';

/**
 * Hàm tạo Access Token
 * @returns {string} Access Token
 */
function getAccessToken() {
    const now = Math.floor(Date.now() / 1000); // Thời gian hiện tại (giây)
    const exp = now + 3600; // Hết hạn sau 1 giờ

    const header = { cty: "stringee-api;v=1" }; // Header của JWT
    const payload = {
        jti: `${apiKeySid}-${now}`, // Unique token ID
        iss: apiKeySid, // Issuer
        exp: exp, // Expiration time
        rest_api: true // Dùng cho API
    };

    // Tạo JWT token
    const token = jwt.sign(payload, apiKeySecret, { algorithm: 'HS256', header: header });
    return token;
}

/**
 * Hàm gọi API Stringee để thực hiện cuộc gọi
 * @param {string} token - Access token đã tạo
 * @param {string} fromNumber - Số điện thoại gọi đi
 * @param {string} toNumber - Số điện thoại gọi đến
 */
async function makeCall(token, toNumber,verificationCode) {
    const data = {
        from: {
            type: "external",
            number: "842473001664", 
            alias:"842473001664"
        },
        to: [{
            type: "external",
            number: toNumber,
            alias: toNumber
        }],
        actions: [{
            action: "talk",
            text: "Mã xác thực của bạn là "+verificationCode
        }]
    };

    const url = 'https://api.stringee.com/v1/call2/callout';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response:', responseData);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Export hàm để sử dụng ở nơi khác
module.exports = {
    getAccessToken,
    makeCall
};
