module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    const auth = Buffer.from(client_id + ':' + client_secret).toString('base64');
    
    // 1. Get token (WORKING - confirmed)
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
        const token = tokenData.access_token; // Confirmed working
        
        // 2. Get playlist - CORRECT endpoint + headers
        fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbKDoHU1qeps8/tracks?limit=12', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(r => {
            // CRITICAL: Check status before json()
            if (!r.ok) {
                throw new Error('Playlist failed: ' + r.status);
            }
            return r.json();
        })
        .then(data => {
            // SAFEGUARD: Check data structure
            if (!data.items || data.items.length === 0) {
                res.json({ albums: [] });
                return;
            }
            
            const albums = data.items.slice(0, 12).map(item => ({
                name: item.track.name,
                artists: item.track.artists,
                images: item.track.album.images,
                external_urls: item.track.external_urls
            }));
            
            res.json({ albums });
        })
        .catch(e => {
            // Playlist failed → try different playlist
            fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=12', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
                const albums = data.items ? data.items.slice(0, 12).map(item => ({
                    name: item.track.name,
                    artists: item.track.artists,
                    images: item.track.album.images,
                    external_urls: item.track.external_urls
                })) : [];
                res.json({ albums });
            })
            .catch(() => res.json({ albums: [] }));
        });
    })
    .catch(() => res.json({ albums: [] }));
};
