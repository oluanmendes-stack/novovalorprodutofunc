#!/usr/bin/env node

const BASE_URL = "http://localhost:8080";
const TEST_CODE = "ODM-DE0062C";

async function testEndpoint(path, description) {
  console.log(`\n📝 Testing: ${description}`);
  console.log(`   Path: ${path}`);
  console.log(`   URL: ${BASE_URL}${path}`);

  try {
    const response = await fetch(`${BASE_URL}${path}`);
    const data = await response.json();

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log(`   ✅ SUCCESS`);
      return true;
    } else {
      console.log(`   ❌ FAILED`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("API ENDPOINT TESTS");
  console.log("=".repeat(60));

  // Test 1: Health check
  await testEndpoint(`/api/ping`, "Health Check");

  // Test 2: Image endpoint with test code
  await testEndpoint(
    `/api/images/${encodeURIComponent(TEST_CODE)}`,
    `Find images for ${TEST_CODE}`
  );

  // Test 3: Catalog endpoint with test code
  await testEndpoint(
    `/api/catalogo/${encodeURIComponent(TEST_CODE)}`,
    `Find catalog for ${TEST_CODE}`
  );

  // Test 4: Test with lowercase
  await testEndpoint(
    `/api/images/${encodeURIComponent(TEST_CODE.toLowerCase())}`,
    `Find images for ${TEST_CODE.toLowerCase()} (lowercase)`
  );

  // Test 5: Test with uppercase
  await testEndpoint(
    `/api/images/${encodeURIComponent(TEST_CODE.toUpperCase())}`,
    `Find images for ${TEST_CODE.toUpperCase()} (uppercase)`
  );

  // Test 6: Test with code without special characters
  const cleanCode = TEST_CODE.replace(/[^a-zA-Z0-9]/g, "");
  await testEndpoint(
    `/api/images/${encodeURIComponent(cleanCode)}`,
    `Find images for ${cleanCode} (no special chars)`
  );

  console.log("\n" + "=".repeat(60));
  console.log("Tests completed!");
  console.log("=".repeat(60) + "\n");
}

runTests().catch(console.error);
