require('dotenv').config();

console.log('🔍 Checking Login Configuration:\n');
console.log('✓ JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✓' : '❌ MISSING');
console.log('✓ JWT_EXPIRE:', process.env.JWT_EXPIRE || '7d (default)');
console.log('✓ Database configured:', process.env.PGHOST ? 'YES' : 'NO');
console.log('\n📝 Common Login Failure Reasons:');
console.log('1. Wrong email/password format in request');
console.log('2. Server not running');
console.log('3. CORS issues (check browser console)');
console.log('4. JWT_SECRET not set');
console.log('\n🔧 To test login:');
console.log('1. Start server: npm start');
console.log('2. Test with: node test-login-api.js');
console.log('3. Or use curl:');
console.log('   curl -X POST http://localhost:5000/api/auth/login \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"email":"admin@matatuconnect.test","password":"Admin@Matatu2024!"}\'');
