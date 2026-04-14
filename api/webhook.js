export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const data = req.body || {};

    const getFirst = (...keys) => {
      for (const key of keys) {
        if (data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== '') {
          return String(data[key]).trim();
        }
      }
      return '';
    };

    const fio = getFirst('Name', 'name');
    let phoneNumber = getFirst('Phone', 'phone', 'phone number');
    const email = getFirst('Email', 'email', 'e-mail');
    const sessionId = getFirst('ct_session_id', 'sessionId', 'session_id');
    const requestNumber = getFirst('tranid', 'tranId', 'requestNumber');
    const formId = getFirst('formid', 'formId');

    phoneNumber = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('8')) {
      phoneNumber = '7' + phoneNumber.slice(1);
    }

    const subject = formId ? `Tilda form ${formId}` : 'Tilda form';
    const requestUrl = req.headers.referer || '';

    const parseTildaUtmFromCookies = (cookieString = '') => {
      const result = {
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_content: '',
        utm_term: '',
      };

      if (!cookieString) return result;

      const match = cookieString.match(/(?:^|;\s*)TILDAUTM=([^;]+)/);
      if (!match || !match[1]) return result;

      let decoded = match[1];
      try {
        decoded = decodeURIComponent(decoded);
      } catch (e) {}

      decoded = decoded.replace(/amp;/g, '');

      const parts = decoded.split('|||');
      for (const part of parts) {
        const [rawKey, rawValue] = part.split('=');
        if (!rawKey || rawValue === undefined) continue;

        const key = rawKey.trim();
        const value = rawValue.trim();

        if (Object.prototype.hasOwnProperty.call(result, key)) {
          result[key] = value;
        }
      }

      return result;
    };

    const utm = parseTildaUtmFromCookies(data.COOKIES || '');

    const params = new URLSearchParams();

    if (subject) params.append('subject', subject);
    if (requestNumber) params.append('requestNumber', requestNumber);
    if (sessionId) params.append('sessionId', sessionId);
    if (fio) params.append('fio', fio);
    if (phoneNumber) params.append('phoneNumber', phoneNumber);
    if (email) params.append('email', email);
    if (requestUrl) params.append('requestUrl', requestUrl);

    if (utm.utm_source) params.append('customField[utm_source]', utm.utm_source);
    if (utm.utm_medium) params.append('customField[utm_medium]', utm.utm_medium);
    if (utm.utm_campaign) params.append('customField[utm_campaign]', utm.utm_campaign);
    if (utm.utm_content) params.append('customField[utm_content]', utm.utm_content);
    if (utm.utm_term) params.append('customField[utm_term]', utm.utm_term);

    console.log('STEP 1: webhook hit');
    console.log('STEP 2: raw Tilda data:', JSON.stringify(data));
    console.log('STEP 3: extracted values:', JSON.stringify({
      fio,
      phoneNumber,
      email,
      sessionId,
      requestNumber,
      formId,
      requestUrl,
      utm
    }));
    console.log('STEP 4: params to Calltouch:', params.toString());

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

    console.log('STEP 5: Calltouch status:', calltouchResponse.status);
    console.log('STEP 6: Calltouch response:', responseText);

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
