export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var body = req.body;
  var content = body.content;
  var chatId = body.chat_id;
  var openId = body.open_id;

  if (!content) {
    return res.status(400).json({ error: '缺少 content', code: -1 });
  }

  if (!chatId && !openId) {
    return res.status(400).json({ error: '缺少 chat_id 或 open_id', code: -1 });
  }

  var APP_ID = 'cli_aaeee4b765b81d22';
  var APP_SECRET = 'ENNYhWpzYrtFM432TIng1bQtJAOmyjkC';

  try {
    // 获取 tenant_access_token
    var tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    });
    var tokenData = await tokenRes.json();

    if (tokenData.code !== 0) {
      return res.status(500).json({ error: '获取飞书 Token 失败: ' + tokenData.msg, code: tokenData.code });
    }

    var token = tokenData.tenant_access_token;

    // 根据 receive_id 类型发送消息
    var receiveId = chatId || openId;
    var receiveIdType = chatId ? 'chat_id' : 'open_id';

    var msgRes = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=' + receiveIdType, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: 'text',
        content: JSON.stringify({ text: content })
      })
    });
    var msgData = await msgRes.json();

    if (msgData.code !== 0) {
      return res.status(500).json({ error: '发送消息失败: ' + msgData.msg, code: msgData.code });
    }

    return res.status(200).json({ success: true, message_id: msgData.data.message_id });
  } catch (e) {
    return res.status(500).json({ error: '服务异常: ' + e.message, code: -1 });
  }
}
