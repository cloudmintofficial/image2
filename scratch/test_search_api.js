const fetch = require('node-fetch');

async function testSearch() {
  const query = 'AFB';
  const url = `http://localhost:3000/api/components/search?q=${query}`;
  console.log(`Searching for: ${query} at ${url}`);
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      console.log('Results:', JSON.stringify(data, null, 2));
    } else {
      console.error('Error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

testSearch();
