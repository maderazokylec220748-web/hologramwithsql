async function testLlama() {
  try {
    console.log('🤖 Testing Llama speed with optimizations...\n');
    
    // Helper function for POST requests
    async function askLlama(question) {
      const start = Date.now();
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, language: 'en' })
      });
      const data = await response.json();
      const duration = Date.now() - start;
      return { reply: data.reply || data, duration };
    }
    
    // Test 1: Enrollment question (the slow one)
    console.log('📝 Test 1: Asking about enrollment (the slow query)...');
    const res1 = await askLlama('What are the enrollment requirements at WIS?');
    console.log(`✅ Response time: ${res1.duration}ms`);
    console.log(`Answer: ${res1.reply.substring(0, 150)}...`);
    console.log('\n---\n');
    
    // Test 2: Second enrollment question (should be faster)
    console.log('📝 Test 2: Another enrollment question (should be faster)...');
    const res2 = await askLlama('How do I apply to Westmead?');
    console.log(`✅ Response time: ${res2.duration}ms`);
    console.log(`Answer: ${res2.reply.substring(0, 150)}...`);
    console.log('\n---\n');
    
    // Test 3: General question
    console.log('📝 Test 3: General question...');
    const res3 = await askLlama('Tell me about WIS');
    console.log(`✅ Response time: ${res3.duration}ms`);
    console.log(`Answer: ${res3.reply.substring(0, 150)}...`);
    
    console.log('\n✅ All tests complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLlama();
