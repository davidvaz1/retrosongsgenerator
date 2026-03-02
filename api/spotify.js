module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // TIER 1: Spotify (if credentials exist)
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
            
            // Spotify Categories (Client Credentials SAFE)
            fetch('https://api.spotify.com/v1/browse/categories/pop/tracks?limit=12', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
                const albums = data.tracks.items.map(item => ({
                    name: item.name,
                    artists: item.artists,
                    images: item.album.images,
                    external_urls: item.external_urls
                }));
                res.json({ albums });
            })
            .catch(() => youtubeFallback(res));
        })
        .catch(() => youtubeFallback(res));
    } else {
        youtubeFallback(res);
    }
    
    // TIER 2: YouTube Trending Music (Public API)
    function youtubeFallback(res) {
        // YouTube Data API v3 - Trending Music Videos
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=music&type=video&videoCategoryId=10&order=viewCount&key=${process.env.YOUTUBE_API_KEY || ''}`)
        .then(r => r.json())
        .then(data => {
            const albums = data.items.map(item => ({
                name: item.snippet.title.split(' - ')[0] || item.snippet.title,
                artists: [{ name: item.snippet.title.split(' - ')[1] || 'Artist' }],
                images: [{ url: item.snippet.thumbnails.medium.url }],
                external_urls: { youtube: `https://youtube.com/watch?v=${item.id.videoId}` }
            }));
            res.json({ albums });
        })
        .catch(() => res.json({ albums: [] }));
    }
};
