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
    var openId = body.open_id;
    var content = body.content;

    if (!openId || !content) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: '缺少 open_id 或 content' })
      };
    }

    // 获取 tenant_access_token
    var tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
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

    // 发送私信
    var msgRes = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenData.tenant_access_token
      },
      body: JSON.stringify({
        receive_id: openId,
        msg_type: 'text',
        content: JSON.stringify({ text: content })
      })
    });
    var msgData = await msgRes.json();

    if (msgData.code !== 0) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: '发送消息失败: ' + msgData.msg, code: msgData.code })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message_id: msgData.data.message_id })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: '服务异常: ' + e.message })
    };
  }
};
