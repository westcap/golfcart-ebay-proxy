export default async function handler(req, res) {
  const clientId = 'WestCapL-GolfCart-PRD-ff04600b9-577103ed';
  const clientSecret = 'PRD-f04600b914a6-c74e-43c1-a342-aa43';
  const campaignId = req.query.campaignId || '5339111183';
  const customId = req.query.customid || 'tomberlingolfcarts';
  const searchTerm = req.query.query || 'Tomberlin';
  const categoryId = '181476';

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

    const searchURL = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}&category_ids=${categoryId}&filter=${filter}&sort=ENDING_SOONEST&limit=100`;

    const response = await fetch(searchURL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    const data = await response.json();
    const items = data.itemSummaries || [];

    if (items.length === 0) {
      res.status(200).send("<p>No listings found. Please check back soon.</p>");
      return;
    }

    const html = `
      <style>
        .ebay-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .ebay-card {
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 15px;
          background: #fff;
          text-align: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
        }
        .ebay-card:hover {
          transform: translateY(-3px);
        }
        .ebay-card img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .ebay-card h4 {
          font-size: 16px;
          margin: 10px 0;
        }
        .ebay-card p {
          font-weight: bold;
          color: #222;
          font-size: 15px;
        }
        @media (max-width: 600px) {
          .ebay-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="ebay-grid">
        ${items.map(item => `
          <div class="ebay-card">
            <a href="${item.itemWebUrl}?mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${campaignId}&customid=${customId}&toolid=10001" target="_blank" style="text-decoration: none; color: inherit;">
              <img src="${item.image?.imageUrl}" alt="${item.title}" />
              <h4>${item.title}</h4>
              <p>${item.price.value} ${item.price.currency}</p>
            </a>
          </div>
        `).join('')}
      </div>
    `;

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).send(html);

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).send(`<pre>Server error: ${err.message}</pre>`);
  }
}
