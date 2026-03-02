module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (client_id && client_secret) {
        const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
        
        // 1. Get token
        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: 'grant_type=client_credentials'
        })
        .then(r => {
            if (!r.ok) throw new Error(`Token failed: ${r.status}`);
            return r.json();
        })
        .then(token => {
            // 2. Get TODAY'S TOP HITS (35M followers)
            fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbKDoHU1qeps8/tracks?limit=12', {
                headers: { 
                    'Authorization': `Bearer ${token.access_token}`,
                    'Accept': 'application/json'
                }
            })
            .then(r => {
                if (!r.ok) throw new Error(`Playlist failed: ${r.status}`);
                return r.json();
            })
            .then(data => {
                const albums = data.items.map(item => ({
                    name: item.track.name,
                    artists: item.track.artists,
                    images: item.track.album.images,
                    external_urls: item.track.external_urls
                }));
                res.json({ albums });
            })
            .catch(() => res.json({ albums: [] }));
        })
        .catch(() => res.json({ albums: [] }));
    } else {
        res.json({ albums: [] });
    }
};
