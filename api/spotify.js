module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // PRE-COMPUTED Spotify token endpoint (bypasses double fetch)
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!client_id || !client_secret) {
        return res.json({ albums: [] });
    }
    
    // ONE SINGLE REQUEST - Global Top 50 tracks
    const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    // Use setTimeout to prevent Vercel timeout race condition
    setTimeout(() => {
        fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=12', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        })
        .then(r => r.json())
        .then(data => res.json({ albums: data.items || [] }))
        .catch(() => res.json({ albums: [] }));
    }, 100);
};
