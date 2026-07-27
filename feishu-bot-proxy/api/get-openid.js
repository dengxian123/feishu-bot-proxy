export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  var code = req.query.code || (req.body && req.body.code);

  if (!code) {
    return res.status(400).json({ error: '缺少 code 参数' });
  }

  var APP_ID = 'cli_aaeee4b765b81d22';
  var APP_SECRET = 'ENNYhWpzYrtFM432TIng1bQtJAOmyjkC';

  try {
    // Step 1: 获取 app_access_token
    var tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    });
    var tokenData = await tokenRes.json();

    if (tokenData.code !== 0) {
      return res.status(500).json({ error: '获取 app_access_token 失败: ' + tokenData.msg, code: tokenData.code });
    }

    var appAccessToken = tokenData.app_access_token;

    // Step 2: 用授权码换取用户身份 (open_id)
    var userRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + appAccessToken
      },
      body: JSON.stringify({ grant_type: 'authorization_code', code: code })
    });
    var userData = await userRes.json();

    if (userData.code !== 0) {
      return res.status(500).json({ error: '获取用户身份失败: ' + userData.msg, code: userData.code });
    }

    return res.status(200).json({
      open_id: userData.data.open_id,
      user_id: userData.data.user_id,
      name: userData.data.name || ''
    });
  } catch (e) {
    return res.status(500).json({ error: '服务异常: ' + e.message, code: -1 });
  }
}
