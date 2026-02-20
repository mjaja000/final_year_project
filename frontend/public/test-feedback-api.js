/**
 * Quick Test - Open this in browser console to test feedback API
 */

// Test data
const testPayload = {
  routeId: 1,
  vehicleId: 1,
  feedbackType: 'Complaint',
  comment: 'Test feedback from browser console'
};

console.log('%c✓ FEEDBACK API TEST STARTING', 'color: green; font-weight: bold; font-size: 14px');
console.log('API URL:', window.location.origin + '/api/feedback');
console.log('Payload:', testPayload);

fetch('http://localhost:5000/api/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
  .then(res => {
    console.log('%c✓ Response received', 'color: green; font-weight: bold');
    console.log('Status:', res.status, res.statusText);
    return res.json();
  })
  .then(data => {
    console.log('%c✓ API SUCCESS!', 'color: green; font-weight: bold; font-size: 14px');
    console.log('Response:', data);
    alert('✓ Feedback API is working! Check console for details');
  })
  .catch(err => {
    console.error('%c✗ API FAILED', 'color: red; font-weight: bold; font-size: 14px');
    console.error('Error:', err);
    alert('✗ Feedback API failed. Check console for error details');
  });
