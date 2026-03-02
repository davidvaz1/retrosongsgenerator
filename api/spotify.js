module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // DEBUG: Show what we have
    const client_id = process.env.SPOTIFY_CLIENT_ID || 'MISSING';
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET || 'MISSING';
    
    res.json({ 
        debug: true,
        client_id_exists: !!process.env.SPOTIFY_CLIENT_ID,
        client_secret_exists: !!process.env.SPOTIFY_CLIENT_SECRET,
        client_id_preview: client_id.substring(0, 8) + '...',
        client_secret_preview: client_secret.substring(0, 8) + '...'
    });
};
