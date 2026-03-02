module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!client_id || !client_secret) {
        return res.json({ albums: [] });
    }
    
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
        
        // CLIENT CREDENTIALS SAFE ENDPOINTS ONLY
        fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=1', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
            // Get first featured playlist → get its tracks
            const playlistId = data.playlists.items[0].id;
            return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=12`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
        })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
            const albums = data.items.map(item => ({
                name: item.track.name,
                artists: item.track.artists,
                images: item.track.album.images,
                external_urls: item.track.external_urls
            }));
            res.json({ albums });
        })
        .catch(() => {
            // FINAL FALLBACK: New Releases (100% works)
            fetch('https://api.spotify.com/v1/browse/new-releases?limit=12', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(r => r.json())
            .then(data => {
                const albums = data.albums.items.map(item => ({
                    name: item.name,
                    artists: item.artists,
                    images: item.images,
                    external_urls: item.external_urls
                }));
                res.json({ albums });
            })
            .catch(() => res.json({ albums: [] }));
        });
    })
    .catch(() => res.json({ albums: [] }));
};
