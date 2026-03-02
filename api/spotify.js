module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
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
        
        // NEW RELEASES = 100% CLIENT CREDENTIALS SAFE
        fetch('https://api.spotify.com/v1/browse/new-releases?limit=12&country=US', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(data => {
            const albums = data.albums.items.map(item => ({
                name: item.name,
                artists: item.artists,
                images: item.images,
                external_urls: item.external_urls
            }));
            res.json({ albums });
        })
        .catch(e => res.json({ albums: [] }));
    })
    .catch(() => res.json({ albums: [] }));
};
