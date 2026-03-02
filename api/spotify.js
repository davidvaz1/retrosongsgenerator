module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST only' });
    }

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { client_id, client_secret } = body;
    if (!client_id || !client_secret) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
    })
    .then(tokenRes => tokenRes.json())
    .then(tokenData => {
        if (!tokenData.access_token) throw new Error('Token failed');
        
        return fetch('https://api.spotify.com/v1/browse/new-releases?limit=20', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
    })
    .then(releasesRes => releasesRes.json())
    .then(data => {
        const albums = data.albums.items.map(a => ({
            name: a.name,
            artists: a.artists,
            images: a.images,
            external_urls: a.external_urls
        }));
        res.json({ albums });
    })
    .catch(e => {
        console.error(e);
        res.status(500).json({ error: e.message });
    });
};
