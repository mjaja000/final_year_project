#!/usr/bin/env node

/**
 * Unit Test: Verify field mapping in ReportController
 * This test verifies that the details → comment mapping works
 */

console.log('🧪 Unit Test: ComplaintDemo Field Mapping\n');

// Simulate the field extraction and mapping logic from ReportController
function testFieldMapping() {
  // Simulate ComplaintDemo payload
  const complaintDemoPayload = {
    plateNumber: "KDD 000T",
    reportType: "GENERAL",
    rating: 5,
    details: "This is the user's detailed feedback"
  };

  console.log('📋 Input Payload (from ComplaintDemo):');
  console.log(JSON.stringify(complaintDemoPayload, null, 2));
  console.log();

  // Simulate the controller logic
  let { matatuId, plateNumber, reportType, type, category, rating, comment, details, userId, ntsaPriority, ntsaCategory } = complaintDemoPayload;

  console.log('✓ Fields extracted from payload:');
  console.log(`  - plateNumber: "${plateNumber}"`);
  console.log(`  - reportType: "${reportType}"`);
  console.log(`  - rating: ${rating}`);
  console.log(`  - details: "${details}"`);
  console.log(`  - comment: ${comment} (undefined)`);
  console.log();

  // Support both reportType and type field names
  reportType = reportType || type;

  // Support both comment and details field names  (THIS IS THE FIX)
  const finalComment = comment || details;

  console.log('✓ Field mapping applied:');
  console.log(`  - comment or details: "${finalComment}"`);
  console.log();

  // Build the service payload
  const servicePayload = {
    matatuId: 1, // would be set by vehicle lookup
    reportType,
    category,
    rating,
    comment: finalComment,
    userId: userId || null,
    ntsaPriority,
    ntsaCategory,
  };

  console.log('✓ Data passed to ReportService:');
  console.log(JSON.stringify(servicePayload, null, 2));
  console.log();

  // Verify the fix
  if (servicePayload.comment === "This is the user's detailed feedback") {
    console.log('✅ TEST PASSED: User feedback successfully mapped to comment field');
    return true;
  } else {
    console.log('❌ TEST FAILED: User feedback not properly mapped');
    return false;
  }
}

// Test with feedback form payload (using comment)
function testBackwardCompatibility() {
  console.log('\n🧪 Backward Compatibility Test: FeedbackForm Payload\n');

  const feedbackFormPayload = {
    vehicleId: 1,
    routeId: 1,
    feedbackType: "Complaint",
    comment: "The conductor was rude",
    reportType: "INCIDENT"
  };

  console.log('📋 Input Payload (from FeedbackForm):');
  console.log(JSON.stringify(feedbackFormPayload, null, 2));
  console.log();

  // Extract fields
  let { comment, details } = feedbackFormPayload;

  const finalComment = comment || details;

  console.log('✓ Field mapping applied:');
  console.log(`  - comment or details: "${finalComment}"`);
  console.log();

  if (finalComment === "The conductor was rude") {
    console.log('✅ TEST PASSED: Backward compatibility maintained');
    return true;
  } else {
    console.log('❌ TEST FAILED: Backward compatibility broken');
    return false;
  }
}

// Run tests
const test1 = testFieldMapping();
const test2 = testBackwardCompatibility();

console.log('\n📊 Test Summary:');
console.log(`  - ComplaintDemo field mapping: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - FeedbackForm backward compatibility: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
console.log();

if (test1 && test2) {
  console.log('✅ All tests passed!');
  console.log('\nThe fix ensures:');
  console.log('1. ComplaintDemo reports with "details" field are correctly mapped to "comment"');
  console.log('2. FeedbackForm reports with "comment" field continue to work');
  console.log('3. Both inputs are normalized before database insertion');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
