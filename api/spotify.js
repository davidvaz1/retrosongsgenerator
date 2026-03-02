// api/spotify.js - CORRECT Vercel format
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    
    let body;
    try {
        body = JSON.parse(req.body);
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    
    const { client_id, client_secret } = body;
    if (!client_id || !client_secret) return res.status(400).json({ error: 'Missing credentials' });
    
    try {
        // Spotify token
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
            },
            body: 'grant_type=client_credentials'
        });
        
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token failed');
        
        // New releases
        const releasesRes = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=20', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        
        const data = await releasesRes.json();
        if (!releasesRes.ok) throw new Error(data.error?.message || 'API failed');
        
        const albums = data.albums.items.map(a => ({
            name: a.name,
            artists: a.artists,
            images: a.images,
            external_urls: a.external_urls
        }));
        
        res.json({ albums });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
