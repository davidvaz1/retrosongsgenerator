module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const debug = {
        timestamp: new Date().toISOString(),
        has_spotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
        has_youtube: !!process.env.YOUTUBE_API_KEY,
        spotify_id_exists: !!process.env.SPOTIFY_CLIENT_ID,
        spotify_secret_exists: !!process.env.SPOTIFY_CLIENT_SECRET
    };

    const spotify_id = process.env.SPOTIFY_CLIENT_ID;
    const spotify_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const youtube_key = process.env.YOUTUBE_API_KEY;

    if (spotify_id && spotify_secret) {
        debug.attempting = 'Spotify';
        const auth = Buffer.from(spotify_id + ':' + spotify_secret).toString('base64');

        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + auth
            },
            body: 'grant_type=client_credentials'
        })
        .then(r => {
            debug.token_status = r.status;
            return r.json();
        })
        .then(tokenData => {
            debug.token_received = !!tokenData.access_token;
            debug.token_error = tokenData.error_description || null;
            
            if (!tokenData.access_token) {
                debug.spotify_fail_reason = 'No token';
                return tryYouTube();
            }

            const token = tokenData.access_token;

            const fetchPage = (offset) =>
                fetch(`https://api.spotify.com/v1/search?q=year:1960-1999&type=track&limit=50&offset=${offset}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => {
                    debug[`search${offset}_status`] = r.status;
                    return r.json();
                });

            return Promise.all([fetchPage(0), fetchPage(50)])
                .then(([page1, page2]) => {
                    debug.spotify_page1_items = page1.tracks?.items?.length || 0;
                    debug.spotify_page2_items = page2.tracks?.items?.length || 0;
                    
                    if (!page1.tracks?.items || page1.tracks.items.length === 0) {
                        debug.spotify_fail_reason = 'Empty search results';
                        return tryYouTube();
                    }

                    const combined = [...(page1.tracks.items || []), ...(page2.tracks?.items || [])];
                    const albums = combined.map(track => ({
                        name: track.name,
                        artists: track.artists,
                        images: track.album.images,
                        external_urls: track.external_urls,
                        album: track.album.name
                    })).slice(0, 100);

                    res.json({ albums, source: 'spotify', debug });
                })
                .catch(err => {
                    debug.spotify_error = err.message;
                    tryYouTube();
                });
        })
        .catch(err => {
            debug.spotify_pipeline_error = err.message;
            tryYouTube();
        });
    } else {
        debug.no_spotify_creds = true;
        tryYouTube();
    }

    function tryYouTube() {
        debug.youtube_attempt = true;
        if (!youtube_key) {
            debug.no_youtube_key = true;
            return res.json({
                albums: [],
                source: 'none',
                debug,
                message: '⚠️ No music source available. Please check your API keys.'
            });
        }

        const ytBase = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=retro+classic+music&type=video&videoCategoryId=10&order=viewCount&key=${youtube_key}`;

        fetch(ytBase)
            .then(r => {
                debug.youtube_status = r.status;
                return r.json();
            })
            .then(page1 => {
                debug.youtube_page1_items = page1.items?.length || 0;
                debug.youtube_error = page1.error?.message || null;
                
                if (!page1.items || page1.items.length === 0) {
                    return res.json({
                        albums: [],
                        source: 'youtube-empty',
                        debug,
                        message: '⚠️ YouTube returned no results.'
                    });
                }

                const page2Fetch = page1.nextPageToken
                    ? fetch(`${ytBase}&pageToken=${page1.nextPageToken}`).then(r => {
                        debug.youtube_page2_status = r.status;
                        return r.json();
                    })
                    : Promise.resolve({ items: [] });

                return page2Fetch.then(page2 => {
                    debug.youtube_page2_items = page2.items?.length || 0;
                    const combined = [...page1.items, ...(page2.items || [])];

                    const albums = combined.map(item => ({
                        name: item.snippet.title.split(' - ')[0] || item.snippet.title,
                        artists: [{ name: item.snippet.channelTitle }],
                        images: [{
                            url: item.snippet.thumbnails?.medium?.url
                              || item.snippet.thumbnails?.default?.url
                              || ''
                        }],
                        external_urls: {
                            youtube: `https://youtube.com/watch?v=${item.id?.videoId || ''}`
                        },
                        album: 'Single'
                    })).filter(item => item.images[0]?.url).slice(0, 100);

                    res.json({
                        albums,
                        source: 'youtube',
                        debug,
                        message: '✅ YouTube retro music results.'
                    });
                });
            })
            .catch(err => {
                debug.youtube_error = err.message;
                res.json({
                    albums: [],
                    source: 'error',
                    debug,
                    message: '⚠️ All music sources failed.'
                });
            });
    }
};
