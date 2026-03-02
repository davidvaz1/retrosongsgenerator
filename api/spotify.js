module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // TEST TOKEN ENDPOINT ONLY
    const auth = Buffer.from(client_id + ':' + client_secret).toString('base64');
    
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + auth
        },
        body: 'grant_type=client_credentials'
    })
    .then(r => {
        const response = {
            status: r.status,
            statusText: r.statusText,
            ok: r.ok,
            headers: Object.fromEntries(r.headers.entries())
        };
        return r.text().then(text => ({ response, body: text }));
    })
    .then(({ response, body }) => {
        res.json({ 
            token_response: response,
            token_body: body,
            client_id_preview: client_id.substring(0, 8) + '...',
            client_secret_preview: client_secret.substring(0, 8) + '...'
        });
    })
    .catch(e => res.json({ error: e.message }));
};
