async function testAuth() {
  const email = 'test_login_' + Date.now() + '@example.com';
  const password = 'mypassword123';
  
  try {
    console.log('1. Registering user...');
    const regRes = await fetch('http://127.0.0.1:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Login User',
        email: email,
        password: password,
        role: 'parent'
      })
    });
    
    if (!regRes.ok) {
        console.error('Registration failed:', regRes.status, await regRes.text());
        return;
    }
    
    const regData = await regRes.json();
    console.log('Registration success:', regData.user.email);
    
    console.log('\n2. Logging in...');
    const loginRes = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    if (!loginRes.ok) {
        console.error('Login failed:', loginRes.status, await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    console.log('Login success! Token received:', !!loginData.token);
    
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testAuth();
