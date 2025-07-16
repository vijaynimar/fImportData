const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
const {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  REDIRECT_URI,
} = process.env;

// In-memory store for demo (replace with DB/session in production)
let userAccessToken = null;

// 1. Redirect to Facebook login
app.get('/login/facebook', (req, res) => {
  const scope = 'public_profile,email,user_photos,user_videos';
  const fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${scope}&response_type=code`;

  res.redirect(fbLoginUrl);
});

// 2. Handle callback and store access token
app.get('/api/auth/facebook/callback', async (req, res) => {
    // console.log("line 29");
  const code = req.query.code;
console.log('Received code:', code);
  try {
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v19.0/oauth/access_token`,
      {
        params: {
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        },
      }
    );

    userAccessToken = tokenResponse.data.access_token;

    res.json({ message: 'Access token saved successfully ✅',token: userAccessToken });
  } catch (err) {
    console.error('Error exchanging token:', err.response?.data || err);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

//b 3. Separate media endpoint (photos & videos)
app.get('/api/facebook/media', async (req, res) => {
  const {token}=req.body
//   console.log(token);
  let userAccessToken = token
  try {
    const [photosRes, videosRes] = await Promise.all([
      axios.get('https://graph.facebook.com/me/photos', {
        params: {
          type: 'uploaded',
          fields: 'id,source,name,created_time',
          access_token: userAccessToken,
        },
      }),
      axios.get('https://graph.facebook.com/me/videos', {
        params: {
          fields: 'id,source,description,created_time',
          access_token: userAccessToken,
        },
      }),
    ]);

    res.json({
      message: 'User media fetched ✅',
      photos: photosRes.data.data,
      videos: videosRes.data.data,
    });
  } catch (err) {
    console.error('Error fetching media:', err.response?.data || err);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
