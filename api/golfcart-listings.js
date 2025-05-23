export default async function handler(req, res) {
  const clientId = 'WestCapL-GolfCart-PRD-ff04600b9-577103ed';
  const clientSecret = 'PRD-f04600b914a6-c74e-43c1-a342-aa43';
  const campaignId = req.query.campaignId || '5339111183';
  const customId = req.query.customid || 'golfcartshop';
  const searchTerm = req.query.query || 'Golf Cart';
  const categoryId = req.query.categoryId || '181476'; // ✅ NOW DYNAMIC
  const offset = parseInt(req.query.offset) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || null;
  const sort = req.query.sort || 'ENDING_SOONEST';
  const limit = 20;
  const fetchLimit = 100;

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

    const searchURL = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}&category_ids=${categoryId}&filter=${filter}&sort=${sort}&limit=${fetchLimit}&offset=0`;

    const response = await fetch(searchURL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    const data = await response.json();
    let items = data.itemSummaries || [];

    if (maxPrice) {
      items = items.filter(item => {
        const price = parseFloat(item?.price?.value || 0);
        return !isNaN(price) && price <= maxPrice;
      });
    }

    if (sort === 'PRICE_ASCENDING') {
      items.sort((a, b) => {
        const priceA = parseFloat(a?.price?.value || 0);
        const priceB = parseFloat(b?.price?.value || 0);
        return priceA - priceB;
      });
    }

    const paginatedItems = items.slice(offset, offset + limit);

    const html = `
      <html>
        <head>
          <style>
            body {
              margin: 0;
              font-family: 'Assistant', sans-serif;
            }
            .ebay-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
              gap: 24px;
              margin: 40px 0;
              padding: 0 10px;
            }
            .ebay-card {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              background-color: #fff;
              text-align: left;
              padding: 16px;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              min-height: 340px;
            }
            .ebay-card img {
              width: 100%;
              height: 180px;
              object-fit: cover;
              border-radius: 8px;
              margin-bottom: 12px;
            }
            .ebay-card h4 {
              font-size: 16px;
              margin: 0 0 8px;
              min-height: 3.6em;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            .ebay-card p {
              font-weight: bold;
              font-size: 16px;
              color: #10b981;
              margin: 0 0 12px;
            }
            .button {
              background: #000;
              color: #fff;
              padding: 10px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
              text-align: center;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="ebay-grid">
            ${paginatedItems.map(item => {
              const title = item.title?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
              const formattedPrice = `$${Number(item.price.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              const separator = item.itemWebUrl.includes('?') ? '&' : '?';
              const affiliateLink = `${item.itemWebUrl}${separator}mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${campaignId}&customid=${customId}&toolid=10001`;

              return `
                <div class="ebay-card">
                  <img src="${item.image?.imageUrl}" alt="${title}" />
                  <h4>${title}</h4>
                  <p>${formattedPrice}</p>
                  <a href="${affiliateLink}" target="_blank" class="button">View on eBay</a>
                </div>
              `;
            }).join('')}
          </div>
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.parent.postMessage(
                  { type: 'setIframeHeight', height: document.body.scrollHeight },
                  '*'
                );
              }, 100);
            });
          </script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).send(`<pre>Server error: ${err.message}</pre>`);
  }
}
