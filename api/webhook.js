export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body || {};

    const fio = data.Name || '';
    let phoneNumber = data.Phone || '';

    phoneNumber = phoneNumber.replace(/\D/g, ''); // оставить только цифры
    if (phoneNumber.startsWith('8')) {
    phoneNumber = '7' + phoneNumber.slice(1);
    }
    const email = data.Email || '';
    const sessionId = data.ct_session_id || '';
    const requestNumber = data.tranid || '';
    const subject = 'Tilda form';
    const requestUrl = req.headers.referer || '';

    const params = new URLSearchParams();
    params.append('subject', subject);

    if (requestNumber) params.append('requestNumber', requestNumber);
    if (sessionId) params.append('sessionId', sessionId);
    if (fio) params.append('fio', fio);
    if (phoneNumber) params.append('phoneNumber', phoneNumber);
    if (email) params.append('email', email);
    if (requestUrl) params.append('requestUrl', requestUrl);

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

    console.log('Tilda data:', data);
    console.log('Calltouch status:', calltouchResponse.status);
    console.log('Calltouch response:', responseText);

    return res.status(200).json({
      status: 'ok',
      calltouchStatus: calltouchResponse.status,
    });
  } catch (error) {
    console.error('Webhook error:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}
