export default async function handler(req, res) {
  if (req.method === 'POST') {
    const data = req.body;

    console.log('Tilda data:', data);

    res.status(200).json({ status: 'ok' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
