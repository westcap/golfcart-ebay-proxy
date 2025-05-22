export default async function handler(req, res) {
  const campaignId = req.query.campaignId || '5339111183';
  const customId = req.query.customid || 'tomberlingolfcarts';
  const searchTerm = req.query.query || 'Tomberlin Golf Cart';
  const categoryId = '181476'; // Golf Carts
  const EBAY_APP_ID = 'WestCapL-GolfCart-PRD-ff04600b9-577103ed'; // Your App ID (not Client Secret)

  try {
    const endpoint = 'https://svcs.ebay.com/services/search/FindingService/v1';

    const params = new URLSearchParams({
      'OPERATION-NAME': 'findItemsAdvanced',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': EBAY_APP_ID,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': searchTerm,
      'categoryId': categoryId,
      'itemFilter(0).name': 'Condition',
      'itemFilter(0).value(0)': '1000', // New
      'itemFilter(0).value(1)': '3000', // Used
      'sortOrder': 'EndTimeSoonest',
      'paginationInput.entriesPerPage': '20'
    });

    const response = await fetch(`${endpoint}?${params.toString()}`);
    const data = await response.json();

    const items = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item || [];

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
            <a href="${item.viewItemURL[0]}?mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${campaignId}&customid=${customId}&toolid=10001" target="_blank" style="text-decoration: none; color: inherit;">
              <img src="${item.galleryURL?.[0]}" alt="${item.title?.[0]}" />
              <h4>${item.title?.[0]}</h4>
              <p>${item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__} ${item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId']}</p>
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
