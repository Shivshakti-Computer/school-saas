// test-connection.mjs

const testURLs = [
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'http://0.0.0.0:8000',
]

async function testConnection(url) {
  console.log(`\n🔍 Testing: ${url}`)
  
  try {
    const response = await fetch(`${url}/api/health`, {
      signal: AbortSignal.timeout(5000)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Success! Documents: ${data.documents}`)
      return true
    } else {
      console.log(`❌ Failed with status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('Testing AI API connections...\n')
  console.log('AI API should be running on port 8000')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  for (const url of testURLs) {
    await testConnection(url)
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💡 Use the URL that shows ✅ Success')
}

main()