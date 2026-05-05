const fetch = require('node-fetch');
require('dotenv').config();
const KEY = process.env.GEMINI_API_KEY;

async function test(model, label) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + KEY;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ contents:[{parts:[{text:'Say hello in 5 words.'}]}], generationConfig:{maxOutputTokens:20}})
  });
  const d = await res.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text || d.error?.message;
  console.log(label + ':', text ? text.slice(0,80) : 'no response');
}

(async()=>{
  await test('gemini-2.0-flash', 'CHAT model');
  await new Promise(r=>setTimeout(r,3000));
  await test('gemini-2.0-flash-lite', 'INSIGHTS model');
})();
