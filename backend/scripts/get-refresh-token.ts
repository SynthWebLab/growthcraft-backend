import 'tsconfig-paths/register';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import url from 'url';

dotenv.config({ path: path.join(__dirname, '../.env') });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = 'http://localhost:9999/oauth2callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/calendar'],
});

console.log('\n=== Google OAuth2 Refresh Token Generator ===\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Sign in with your Google account and grant access.');
console.log('3. You will be redirected — the token will be captured automatically.\n');
console.log('Waiting for authorization callback on http://localhost:9999 ...\n');

const server = http.createServer(async (req, res) => {
  const queryObject = url.parse(req.url!, true).query;
  const code = queryObject.code as string;

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Error: No authorization code received</h1>');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ SUCCESS! Here are your tokens:\n');
    console.log('Access Token:', tokens.access_token?.substring(0, 30) + '...');
    console.log('\n🔑 REFRESH TOKEN (copy this to your .env):');
    console.log(tokens.refresh_token);
    console.log('\nPaste it into GOOGLE_REFRESH_TOKEN= in your .env file.');

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>✅ Authorization Successful!</h1>
      <h3>Refresh Token:</h3>
      <textarea style="width:100%;height:100px;font-family:monospace;">${tokens.refresh_token}</textarea>
      <p>Copy the refresh token above and paste it into <code>GOOGLE_REFRESH_TOKEN=</code> in your backend <code>.env</code> file.</p>
      <p>You can close this window now.</p>
    `);
  } catch (err: any) {
    console.error('Error exchanging code for tokens:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>Error</h1><pre>${err.message}</pre>`);
  }

  server.close();
});

server.listen(9999);
