async function testLogin() {
  try {
    const loginRes = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teshi@gmail.com',
        password: '1234'
      })
    });
    
    console.log('Status Code:', loginRes.status);
    console.log('Response:', await loginRes.text());
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testLogin();
