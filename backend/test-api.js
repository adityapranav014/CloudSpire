import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
let cookies = '';

async function runTests() {
  console.log('\n--- API TESTS ---');

  // Test 1: Health Check
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Test 1 (Health): PASS - ${JSON.stringify(res.data)}`);
  } catch (err) {
    console.log(`❌ Test 1 (Health): FAIL - ${err.message}`);
  }

  // Test 2: Register
  let token = null;
  try {
    const uniqueEmail = `test_${Date.now()}@cloudpulse.com`;
    const res = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      name: "Test User",
      email: uniqueEmail,
      password: "Test@123456",
      companyName: "Test Corp"
    });
    
    const setCookie = res.headers['set-cookie'];
    if (setCookie) {
      cookies = setCookie[0].split(';')[0];
    }
    const hasTokenInBody = !!res.data.token;
    
    console.log(`✅ Test 2 (Register): PASS - Status ${res.status}, orgId: ${res.data.data.user.orgId}, teamId: ${res.data.data.user.teamId}, Cookie Set: ${!!cookies}, Token in Body: ${hasTokenInBody}`);
  } catch (err) {
    console.log(`❌ Test 2 (Register): FAIL - ${err.response?.data?.message || err.message}`);
  }

  // Test 3: Get Me
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Cookie: cookies }
    });
    console.log(`✅ Test 3 (Get Me): PASS - orgId: ${res.data.data.user.orgId._id || res.data.data.user.orgId}, teamId: ${res.data.data.user.teamId._id || res.data.data.user.teamId}, role: ${res.data.data.user.role}, Has Password: ${!!res.data.data.user.password}`);
  } catch (err) {
    console.log(`❌ Test 3 (Get Me): FAIL - ${err.response?.data?.message || err.message}`);
  }

  // Test 4: Dashboard Summary
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/dashboard/summary`, {
      headers: { Cookie: cookies }
    });
    console.log(`✅ Test 4 (Dashboard): PASS - totalMonthSpend: ${res.data.data?.totalMonthSpend}, Narrative: ${!!res.data.data?.aiNarrative}`);
  } catch (err) {
    console.log(`❌ Test 4 (Dashboard): FAIL - ${err.response?.data?.message || err.message}`);
  }

  // Test 5: Alerts
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/alerts`, {
      headers: { Cookie: cookies }
    });
    console.log(`✅ Test 5 (Alerts): PASS - Count: ${res.data.data?.length}`);
  } catch (err) {
    console.log(`❌ Test 5 (Alerts): FAIL - ${err.response?.data?.message || err.message}`);
  }

  // Test 6: Live Metrics (Using websocket or HTTP? Instructions say GET /api/v1/metrics/live)
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/metrics/live`, {
      headers: { Cookie: cookies }
    });
    console.log(`✅ Test 6 (Live Metrics): PASS - CPU: ${res.data.data?.cpu}`);
  } catch (err) {
    console.log(`❌ Test 6 (Live Metrics): FAIL - ${err.response?.data?.message || err.message}`);
  }

  // Test 7: Logout
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/logout`, {}, {
      headers: { Cookie: cookies }
    });
    console.log(`✅ Test 7 (Logout): PASS - Status ${res.status}`);
  } catch (err) {
    console.log(`❌ Test 7 (Logout): FAIL - ${err.response?.data?.message || err.message}`);
  }
}

runTests();
