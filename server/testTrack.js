const mongoose = require('mongoose');
require('dotenv').config();
const http = require('http');

async function testTrack() {
  // Test the /api/resources/track endpoint directly
  const body = JSON.stringify({
    studentId: '69c6800ecc4e7b305da60a9e',
    resourceName: 'Test Resource',
    resourceType: 'video'
  });

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/resources/track',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.write(body);
  req.end();
}

testTrack();
