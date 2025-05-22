export default async function handler(req, res) {
  const clientId = 'WestCapL-GolfCart-PRD-ff04600b9-577103ed';
  const clientSecret = '23fb20dbd-2860-4fa6-96da-e02e47cd88b4';
  const campaignId = req.query.campaignId || '5339111183';
  const searchTerm = req.query.query || 'Tomberlin Golf Cart';
  const customId = req.query.customid || 'tomberlingolfcarts';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  const filter = 'categoryIds:181476,conditions:{NEW,USED,OPEN_BOX}';
  const response = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}&filter=${filter}&limit=8`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
  });

  const data = await response.json();
  const items = data.itemSummaries || [];

  const html = items.map(item => `
    <div style="border:1px solid #ccc; padding:10px; background:#fff; text-align:center; margin-bottom:10px;">
      <a href="${item.itemWebUrl}?mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${campaignId}&customid=${customId}&toolid=10001" target="_blank" style="text-decoration:none; color:#000;">
        <img src="${item.image?.imageUrl}" alt="${item.title}" style="max-width:100%; height:auto;" />
        <h4 style="font-size:16px; margin:10px 0;">${item.title}</h4>
        <p style="font-weight:bold;">${item.price.value} ${item.price.currency}</p>
      </a>
    </div>
  `).join('');

  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  res.status(200).send(html);
}
