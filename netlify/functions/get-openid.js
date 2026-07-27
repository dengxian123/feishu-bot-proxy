const APP_ID = 'cli_aaeee4b765b81d22';
const APP_SECRET = 'ENNYhWpzYrtFM432TIng1bQtJAOmyjkC';

exports.handler = async function(event, context) {
  // CORS 预检
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    var body = JSON.parse(event.body);
    var authCode = body.auth_code;

    if (!authCode) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: '缺少 auth_code' })
      };
    }

    // 第 1 步：获取 app_access_token
    var tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    });
    var tokenData = await tokenRes.json();

    if (tokenData.code !== 0) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: '获取 Token 失败: ' + tokenData.msg, code: tokenData.code })
      };
    }

    // 第 2 步：用 auth_code 换取 open_id
    var authRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenData.app_access_token
      },
      body: JSON.stringify({ grant_type: 'authorization_code', code: authCode })
    });
    var authData = await authRes.json();

    if (authData.code !== 0) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: '换取 open_id 失败: ' + authData.msg, code: authData.code })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, open_id: authData.data.open_id })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: '服务异常: ' + e.message })
    };
  }
};
