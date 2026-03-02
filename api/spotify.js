module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!client_id || !client_secret) {
        return res.json({ albums: [] });
    }
    
    const auth = Buffer.from(client_id + ':' + client_secret).toString('base64');
    
    // Get token
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
        
        // TRY 3 BULLETPROOF ENDPOINTS (in order)
        const endpoints = [
            'https://api.spotify.com/v1/playlists/37i9dQZEVXbKDoHU1qeps8/tracks?limit=12',  // Today's Top Hits
            'https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=12',  // Global Top 50  
            'https://api.spotify.com/v1/browse/new-releases?limit=12'  // New Releases
        ];
        
        tryEndpoint(0, token, endpoints);
        
        function tryEndpoint(index, token, endpoints) {
            if (index >= endpoints.length) {
                return res.json({ albums: [] });
            }
            
            fetch(endpoints[index], {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(r => {
                if (!r.ok) throw new Error(r.status);
                return r.json();
            })
            .then(data => {
                let albums = [];
                
                // Handle different response formats
                if (endpoints[index].includes('new-releases')) {
                    albums = data.albums.items.slice(0, 12).map(item => ({
                        name: item.name,
                        artists: item.artists,
                        images: item.images,
                        external_urls: item.external_urls
                    }));
                } else {
                    albums = data.items.slice(0, 12).map(item => ({
                        name: item.track?.name || item.album?.name || 'Unknown',
                        artists: item.track?.artists || item.album?.artists || [],
                        images: item.track?.album?.images || item.album?.images || [],
                        external_urls: item.track?.external_urls || item.album?.external_urls || {}
                    }));
                }
                
                if (albums.length > 0) {
                    res.json({ albums });
                } else {
                    tryEndpoint(index + 1, token, endpoints);
                }
            })
            .catch(() => tryEndpoint(index + 1, token, endpoints));
        }
    })
    .catch(() => res.json({ albums: [] }));
};
