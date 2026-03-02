module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // SIMPLEST possible code - no async, no complex logic
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!client_id || !client_secret) {
        res.json({ albums: [] });
        return;
    }
    
    const auth = Buffer.from(client_id + ':' + client_secret).toString('base64');
    
    // Token request
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + auth
        },
        body: 'grant_type=client_credentials'
    })
    .then(r => r.json())
    .then(token => {
        // Single playlist request - Today's Top Hits
        fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbKDoHU1qeps8/tracks?limit=12', {
            headers: { 'Authorization': 'Bearer ' + token.access_token }
        })
        .then(r => r.json())
        .then(data => {
            const albums = [];
            for (let i = 0; i < data.items.length; i++) {
                const item = data.items[i];
                albums.push({
                    name: item.track.name,
                    artists: item.track.artists,
                    images: item.track.album.images,
                    external_urls: item.track.external_urls
                });
            }
            res.json({ albums: albums.slice(0, 12) });
        })
        .catch(() => res.json({ albums: [] }));
    })
    .catch(() => res.json({ albums: [] }));
};
