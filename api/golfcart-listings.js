export default async function handler(req, res) {
  const clientId = 'WestCapL-GolfCart-PRD-ff04600b9-577103ed';
  const clientSecret = 'PRD-f04600b914a6-c74e-43c1-a342-aa43';
  const campaignId = req.query.campaignId || '5339111183';
  const customId = req.query.customid || 'golfcartshop';
  const searchTerm = req.query.query || 'Golf Cart';
  const categoryId = '181476';
  const offset = parseInt(req.query.offset || '0');

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    if (!token) throw new Error("No access token received");

    const filter = [
      'itemLocationCountry:US',
      'conditionIds:{1000|3000}'
    ].join(',');

    const searchURL = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}&category_ids=${categoryId}&filter=${filter}&sort=ENDING_SOONEST&limit=20&offset=${offset}`;

    const response = await fetch(searchURL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    const data = await response.json();
    const items = data.itemSummaries || [];

    const html = `
      ${items.map(item => {
        const title = item.title?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        const formattedPrice = `$${Number(item.price.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        return `
          <div class=\"ebay-card\">
            <img src=\"${item.image?.imageUrl}\" alt=\"${title}\" />
            <h4>${title}</h4>
            <p>${formattedPrice}</p>
            <a href=\"${item.itemWebUrl}?mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${campaignId}&customid=${customId}&toolid=10001\" target=\"_blank\" class=\"button\">View on eBay</a>
          </div>
        `;
      }).join('')}
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).send(html);

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).send(`<pre>Server error: ${err.message}</pre>`);
  }
}
