module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    const auth = Buffer.from(client_id + ':' + client_secret).toString('base64');
    
    // 1. Get Spotify token
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
        if (!tokenData.access_token) {
            res.json({ albums: [] });
            return;
        }
        
        // 2. Get Today's Top Hits (35M+ followers)
        fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbKDoHU1qeps8/tracks?limit=12', {
            headers: {
                'Authorization': 'Bearer ' + tokenData.access_token
            }
        })
        .then(r => r.json())
        .then(data => {
            const albums = [];
            if (data.items && data.items.length > 0) {
                for (let i = 0; i < Math.min(12, data.items.length); i++) {
                    const item = data.items[i];
                    if (item.track) {
                        albums.push({
                            name: item.track.name || 'Unknown Track',
                            artists: item.track.artists || [{ name: 'Unknown Artist' }],
                            images: item.track.album ? item.track.album.images || [] : [],
                            external_urls: item.track.external_urls || { spotify: '#' }
                        });
                    }
                }
            }
            res.json({ albums });
        })
        .catch(() => res.json({ albums: [] }));
    })
    .catch(() => res.json({ albums: [] }));
};
