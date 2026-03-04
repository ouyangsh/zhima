'use strict';

const https = require('https');

const GEMINI_API_KEY = 'AIzaSyCGH3VRquOSZHxJNSuOdbWb8KQrp2NrIn4';
const MODEL = 'gemini-2.0-flash';
const DAILY_LIMIT = 3;

exports.main = async (event, context) => {
    const { base64Data } = event;

    if (!base64Data) {
        return { errCode: 'PARAM_IS_NULL', errMsg: '缺少图片数据' };
    }

    // ========== 每日限频检查 ==========
    const uid = context.CLIENTUID || context.OPENID || 'anonymous';
    const db = uniCloud.database();
    let remaining = DAILY_LIMIT;

    try {
        const usageCollection = db.collection('ai-usage-log');
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const countRes = await usageCollection
            .where({ uid: uid, timestamp: db.command.gte(todayStart) })
            .count();

        const usedCount = countRes.total || 0;
        console.log(`用户 ${uid} 今日已使用 ${usedCount}/${DAILY_LIMIT} 次`);

        if (usedCount >= DAILY_LIMIT) {
            return {
                errCode: 'LIMIT_EXCEEDED',
                errMsg: `今日 AI 解析次数已用完（${DAILY_LIMIT}次/天），请明天再试。`,
                remaining: 0
            };
        }

        await usageCollection.add({ uid: uid, timestamp: Date.now() });
        remaining = DAILY_LIMIT - usedCount - 1;
    } catch (e) {
        console.warn('限频检查跳过（集合可能不存在）:', e.message);
    }

    // ========== 调用 Gemini API ==========
    const systemPrompt = `你是一个钩织图解专家。请分析上传的图解图片，提取所有的钩织步骤（R1, R2, R3...）。
请严格按照以下 JSON 格式输出：
{
  "sections": [
    {
      "title": "部位名称（如：主体、耳朵、腿）",
      "rows": [
        { "id": "R1", "count": 针数数字, "detail": "具体的针法描述，如 5x 或 2(x,v)" }
      ]
    }
  ]
}
注意：
1. count 必须是纯数字（如果是连接行，请填写大概针数或0）。
2. 如果图片中有多个部位，请拆分到不同的 sections。
3. 针法描述尽量保留原样。
4. 如果 R7-11:34x 这样的格式，表示 R7 到 R11 都是 34x，请展开为多个行。`;

    const imageBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    const payload = JSON.stringify({
        contents: [
            {
                role: 'user',
                parts: [
                    { text: '请解析这张钩织图解并生成结构化的进度列表。' },
                    { inlineData: { mimeType: 'image/png', data: imageBase64 } }
                ]
            }
        ],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: 'application/json' }
    });

    const callGemini = (retries = 3, delay = 1000) => {
        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, (response) => {
                let data = '';
                response.on('data', chunk => { data += chunk; });
                response.on('end', () => {
                    if (response.statusCode !== 200) {
                        if (retries > 0) {
                            setTimeout(() => {
                                callGemini(retries - 1, delay * 2).then(resolve).catch(reject);
                            }, delay);
                            return;
                        }
                        reject(new Error(`HTTP ${response.statusCode}: ${data.substring(0, 200)}`));
                        return;
                    }
                    try { resolve(JSON.parse(data)); }
                    catch (e) { reject(new Error('解析响应失败')); }
                });
            });
            req.on('error', (err) => {
                if (retries > 0) {
                    setTimeout(() => {
                        callGemini(retries - 1, delay * 2).then(resolve).catch(reject);
                    }, delay);
                    return;
                }
                reject(err);
            });
            req.write(payload);
            req.end();
        });
    };

    try {
        console.log('开始调用 Gemini API...');
        const result = await callGemini();
        console.log('Gemini 返回:', JSON.stringify(result).substring(0, 500));

        const text = result.candidates && result.candidates[0] && result.candidates[0].content &&
            result.candidates[0].content.parts && result.candidates[0].content.parts[0] &&
            result.candidates[0].content.parts[0].text;
        if (text) {
            const parsed = JSON.parse(text);
            return { errCode: 0, data: parsed, remaining: remaining };
        }
        return { errCode: 'NO_RESULT', errMsg: 'AI 未返回有效结果', remaining: remaining };
    } catch (err) {
        console.error('Gemini API 调用失败:', err);
        return { errCode: 'REQUEST_FAILED', errMsg: err.message, remaining: remaining };
    }
};
