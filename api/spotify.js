module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // TIER 1: Spotify New Releases
    if (client_id && client_secret) {
        const auth = Buffer.from(client_id + ':' + client_secret).toString('base64');
        
        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Authorization': 'Basic ' + auth 
            },
            body: 'grant_type=client_credentials'
        })
        .then(r => r.json())
        .then(tokenData => {
            const token = tokenData.access_token;
            fetch('https://api.spotify.com/v1/browse/new-releases?limit=12&country=US', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
                const albums = data.albums.items.map(item => ({
                    name: item.name,
                    artists: item.artists,
                    images: item.images,
                    external_urls: item.external_urls
                }));
                if (albums.length > 0) return res.json({ albums });
                throw new Error('Empty Spotify');
            })
            .catch(() => tryYouTubeFallback(res));
        })
        .catch(() => tryYouTubeFallback(res));
    } else {
        tryYouTubeFallback(res);
    }
    
    // TIER 2: YouTube Music Charts (No API key)
    function tryYouTubeFallback(res) {
        // Use public YouTube Music chart endpoint
        fetch('https://ytmusicapi.com/charts?type=trending&limit=12', {
            method: 'GET'
        })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
            const albums = (data.charts || []).slice(0, 12).map(item => ({
                name: item.title.split(' - ')[0],
                artists: [{ name: item.artist || 'Various Artists' }],
                images: [{ url: item.thumbnail || '' }],
                external_urls: { youtube: item.url || '' }
            })).filter(item => item.name && item.images[0]?.url);
            
            if (albums.length > 0) {
                res.json({ albums });
            } else {
                res.json({ albums: [] });
            }
        })
        .catch(() => {
            // Graceful empty response
            res.json({ albums: [] });
        });
    }
};
