export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const data = req.body || {};

    console.log('STEP 1: webhook hit');
    console.log('STEP 2: raw Tilda data:', JSON.stringify(data));

    const fio = data.Name || '';
    let phoneNumber = data.Phone || '';

    phoneNumber = String(phoneNumber).replace(/\D/g, '');
    if (phoneNumber.startsWith('8')) {
      phoneNumber = '7' + phoneNumber.slice(1);
    }

    const email = data.Email || '';
    const sessionId = data.ct_session_id || '';
    const requestNumber = data.tranid || '';
    const subject = 'Tilda form';
    const requestUrl = req.headers.referer || '';

    const params = new URLSearchParams();

    if (subject) params.append('subject', subject);
    if (requestNumber) params.append('requestNumber', requestNumber);
    if (sessionId) params.append('sessionId', sessionId);
    if (fio) params.append('fio', fio);
    if (phoneNumber) params.append('phoneNumber', phoneNumber);
    if (email) params.append('email', email);
    if (requestUrl) params.append('requestUrl', requestUrl);

    console.log('STEP 3: params to Calltouch:', params.toString());

    const calltouchResponse = await fetch(
      'https://api.calltouch.ru/calls-service/RestAPI/requests/81493/register/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: params.toString(),
      }
    );

    const responseText = await calltouchResponse.text();

    console.log('STEP 4: Calltouch status:', calltouchResponse.status);
    console.log('STEP 5: Calltouch response:', responseText);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('ok');
  } catch (error) {
    console.error('STEP ERROR:', error);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('error');
  }
}
