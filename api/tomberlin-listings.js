export default async function handler(req, res) {
  console.log("🔧 Serverless function started...");

  const clientId = 'WestCapL-GolfCart-PRD-ff04600b9-577103ed';
  const clientSecret = 'PRD-f04600b914a6-c74e-43c1-a342-aa43';
  const campaignId = req.query.campaignId || '5339111183';
  const customId = req.query.customid || 'tomberlingolfcarts';
  const searchTerm = req.query.query || '"Tomberlin Golf Cart"';
  const categoryId = '181476'; // Golf Carts

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    console.log("🔑 Requesting access token from eBay...");

    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    const tokenData = await tokenRes.json();
    console.log("🔐 Token response:", tokenData);

    const token = tokenData.access_token;
    if (!token) {
      throw new Error("No access token received — full response: " + JSON.stringify(tokenData, null, 2));
    }

    console.log("✅ Token received. Now fetching listings...");

    const filter = [
      'buyingOptions:{FIXED_PRICE}',
      'itemLocationCountry:US',
      'conditionIds:{1000|3000}'
    ].join(',');

    const searchURL = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}&category_ids=${categoryId}&filter=${filter}&sort=ENDING_SOONEST&limit=20`;

    const response = await fetch(searchURL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    const data = await response.json();
    console.log("📦 Listing data:", JSON.stringify(data, null, 2));

    const items = data.itemSummaries || [];

    if (items.length === 0) {
      res.status(200).send("<p>No listings found. Please check back soon.</p>");
      return;
    }

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

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).send(`<pre>Server error: ${err.message}</pre>`);
  }
}
