require('dotenv').config();

async function testLoginAPI() {
  const port = process.env.PORT || 5000;
  const baseURL = `http://localhost:${port}`;
  
  console.log('🧪 Testing Login API...');
  console.log('  Server:', baseURL);
  
  const credentials = {
    email: 'admin@matatuconnect.test',
    password: 'Admin@Matatu2024!'
  };
  
  console.log('\n📤 Sending login request...');
  console.log('  Email:', credentials.email);
  console.log('  Password:', credentials.password);
  
  try {
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    
    console.log('\n📥 Response:');
    console.log('  Status:', response.status, response.statusText);
    console.log('  Body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('  Token:', data.token ? 'Generated' : 'Missing');
      console.log('  User:', data.user ? data.user.name : 'N/A');
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log('  Error:', data.message);
    }
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n⚠️ Make sure the server is running:');
    console.log('  npm start');
    console.log('  or');
    console.log('  node server.js');
  }
}

testLoginAPI();
