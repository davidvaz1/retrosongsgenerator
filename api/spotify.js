module.exports = (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    console.log('Function invoked');
    
    // Check environment variables
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    console.log('Client ID exists:', !!client_id);
    console.log('Client Secret exists:', !!client_secret);
    
    if (!client_id || !client_secret) {
        console.error('Missing env vars');
        res.status(500).json({ error: 'Server missing Spotify credentials - check Vercel Environment Variables' });
        return;
    }

    // Spotify OAuth token
    const authString = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authString}`
        },
        body: 'grant_type=client_credentials'
    })
    .then(r => {
        console.log('Token response status:', r.status);
        if (!r.ok) throw new Error(`Token failed: ${r.status}`);
        return r.json();
    })
    .then(tokenData => {
        console.log('Token received');
        if (!tokenData.access_token) throw new Error('No token in response');
        
        // Fetch new releases
        return fetch('https://api.spotify.com/v1/browse/new-releases?limit=20', {
            headers: { 
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
            }
        });
    })
    .then(r => {
        console.log('Releases response status:', r.status);
        if (!r.ok) throw new Error(`Releases failed: ${r.status}`);
        return r.json();
    })
    .then(data => {
        console.log('Releases data keys:', Object.keys(data));
        
        const albums = (data.albums?.items || []).slice(0, 12).map(album => ({
            name: album.name || 'Unknown Album',
            artists: album.artists || [{ name: 'Unknown Artist' }],
            images: album.images || [],
            external_urls: album.external_urls || { spotify: '#' }
        }));
        
        console.log(`Returning ${albums.length} albums`);
        res.json({ albums });
    })
    .catch(err => {
        console.error('FULL ERROR:', err.message);
        res.status(500).json({ error: `Spotify API failed: ${err.message}` });
    });
};
