/**
 * Test file for phone validation utility
 * This demonstrates the functionality of the international phone validation
 */

import { 
  validateInternationalPhone, 
  validateKenyanPhone, 
  formatPhoneForDisplay, 
  extractCountryCode 
} from './phoneValidation'

// Test international phone validation
console.log('=== Testing International Phone Validation ===')

const testNumbers = [
  // Valid international numbers
  '+1234567890',        // US
  '+447911123456',      // UK
  '+254700000000',      // Kenya
  '+919876543210',      // India
  '+61412345678',       // Australia
  '1234567890',         // US without +
  '254700000000',       // Kenya without +
  
  // Valid Kenyan numbers (backward compatibility)
  '0700000000',         // Kenya starting with 0
  '254700000000',       // Kenya without +
  
  // Invalid numbers
  '12345',              // Too short
  '+12345678901234567', // Too long
  'abc123',             // Contains letters
  '+',                  // Only +
  '',                    // Empty
  '123',                // Too short
]

testNumbers.forEach(phone => {
  const result = validateInternationalPhone(phone)
  console.log(`"${phone}" -> ${result.isValid ? '✓ Valid' : '✗ Invalid'}`)
  if (result.isValid) {
    console.log(`  Formatted: ${result.formattedNumber}`)
    console.log(`  Country Code: ${result.countryCode}`)
    console.log(`  National Number: ${result.nationalNumber}`)
  } else {
    console.log(`  Error: ${result.error}`)
  }
  console.log('')
})

// Test Kenyan phone validation (backward compatibility)
console.log('=== Testing Kenyan Phone Validation (Backward Compatibility) ===')

const kenyanTestNumbers = [
  '+254700000000',      // Valid +254 format
  '0700000000',         // Valid 0 format
  '254700000000',       // Valid 254 format
  '+254800000000',      // Invalid (8 not allowed)
  '0800000000',         // Invalid (8 not allowed)
  '+25470000000',       // Invalid (too short)
  '+2547000000000',     // Invalid (too long)
]

kenyanTestNumbers.forEach(phone => {
  const result = validateKenyanPhone(phone)
  console.log(`"${phone}" -> ${result.isValid ? '✓ Valid Kenyan' : '✗ Invalid Kenyan'}`)
  if (result.isValid) {
    console.log(`  Formatted: ${result.formattedNumber}`)
    console.log(`  Country Code: ${result.countryCode}`)
    console.log(`  National Number: ${result.nationalNumber}`)
  } else {
    console.log(`  Error: ${result.error}`)
  }
  console.log('')
})

// Test phone formatting
console.log('=== Testing Phone Formatting ===')

const formatTestNumbers = [
  '+1234567890',        // Already formatted
  '1234567890',         // US without +
  '0700000000',         // Kenya starting with 0
  '254700000000',       // Kenya without +
  '+447911123456',      // UK already formatted
]

formatTestNumbers.forEach(phone => {
  const formatted = formatPhoneForDisplay(phone)
  console.log(`"${phone}" -> "${formatted}"`)
})

// Test country code extraction
console.log('=== Testing Country Code Extraction ===')

const extractTestNumbers = [
  '+1234567890',        // US
  '+447911123456',      // UK
  '+254700000000',      // Kenya
  '0700000000',         // Kenya starting with 0
  '254700000000',       // Kenya without +
]

extractTestNumbers.forEach(phone => {
  const countryCode = extractCountryCode(phone)
  console.log(`"${phone}" -> Country Code: ${countryCode || 'Not found'}`)
})

console.log('\n=== Test Complete ===')
console.log('This demonstrates that the phone validation utility supports:')
console.log('1. International phone numbers from any country')
console.log('2. Backward compatibility with Kenyan phone numbers')
console.log('3. Automatic formatting and country code extraction')
console.log('4. Comprehensive validation with helpful error messages')
