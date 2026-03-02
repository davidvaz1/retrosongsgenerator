module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // TRY 1: Authenticated Global Top 50 (BEST data)
    if (client_id && client_secret) {
        const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
        
        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: 'grant_type=client_credentials'
        })
        .then(r => r.json())
        .then(token => {
            fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=12', {
                headers: { 'Authorization': `Bearer ${token.access_token}` }
            })
            .then(r => r.json())
            .then(data => {
                const albums = data.items.map(item => ({
                    name: item.track.name,
                    artists: item.track.artists,
                    images: item.track.album.images,
                    external_urls: item.track.external_urls
                }));
                res.json({ albums });
            })
            .catch(() => viral50Fallback(res));
        })
        .catch(() => viral50Fallback(res));
    } else {
        // TRY 2: Viral 50 Failsafe (Public)
        viral50Fallback(res);
    }
};

function viral50Fallback(res) {
    fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbKIHJIU0bdQs/tracks?limit=12', {
        headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Global100/1.0'
        }
    })
    .then(r => r.json())
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
}
