/**
 * International phone number validation utility
 * Supports various international formats including Kenya (+254)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  countryCode?: string;
  nationalNumber?: string;
  error?: string;
}

/**
 * Validates international phone numbers
 * @param phoneNumber - The phone number to validate
 * @returns PhoneValidationResult object with validation details
 */
export function validateInternationalPhone(phoneNumber: string): PhoneValidationResult {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  // Remove all whitespace, dashes, parentheses, and dots
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it's a valid international format
  // Pattern: +[country code][national number] or [country code][national number]
  const internationalPattern = /^(\+?)(\d{1,4})(\d{6,15})$/;
  const match = cleanNumber.match(internationalPattern);
  
  if (!match) {
    return {
      isValid: false,
      error: 'Please enter a valid international phone number'
    };
  }

  const [, plusSign, countryCode, nationalNumber] = match;
  
  // Validate country code length (1-4 digits)
  if (countryCode.length < 1 || countryCode.length > 4) {
    return {
      isValid: false,
      error: 'Invalid country code'
    };
  }
  
  // Validate national number length (6-15 digits)
  if (nationalNumber.length < 6 || nationalNumber.length > 15) {
    return {
      isValid: false,
      error: 'Phone number must be between 6 and 15 digits'
    };
  }
  
  // Format the number with + prefix
  const formattedNumber = plusSign === '+' ? cleanNumber : `+${cleanNumber}`;
  
  return {
    isValid: true,
    formattedNumber,
    countryCode,
    nationalNumber
  };
}

/**
 * Validates Kenyan phone numbers specifically (for backward compatibility)
 * @param phoneNumber - The phone number to validate
 * @returns PhoneValidationResult object with validation details
 */
export function validateKenyanPhone(phoneNumber: string): PhoneValidationResult {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  // Remove all whitespace, dashes, parentheses, and dots
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if number starts with +254 or 0
  if (!cleanNumber.startsWith('+254') && !cleanNumber.startsWith('0')) {
    return {
      isValid: false,
      error: 'Phone number must start with +254 or 0'
    };
  }

  // Convert to +254 format for validation
  let numberToValidate = cleanNumber;
  if (cleanNumber.startsWith('0')) {
    numberToValidate = '+254' + cleanNumber.slice(1);
  }

  // Check if the number is valid (should be +254 followed by 9 digits)
  if (!/^\+254[0-9]{9}$/.test(numberToValidate)) {
    return {
      isValid: false,
      error: 'Please enter a valid Kenyan phone number'
    };
  }

  return {
    isValid: true,
    formattedNumber: numberToValidate,
    countryCode: '254',
    nationalNumber: numberToValidate.slice(4)
  };
}

/**
 * Formats a phone number for display
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number string
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  // If it starts with +, it's already international
  if (cleanNumber.startsWith('+')) {
    return cleanNumber;
  }
  
  // If it starts with 0, assume it's Kenyan and format accordingly
  if (cleanNumber.startsWith('0')) {
    return `+254${cleanNumber.slice(1)}`;
  }
  
  // If it starts with 254, add + prefix
  if (cleanNumber.startsWith('254')) {
    return `+${cleanNumber}`;
  }
  
  // For other cases, add + prefix
  return `+${cleanNumber}`;
}

/**
 * Extracts country code from phone number
 * @param phoneNumber - The phone number
 * @returns Country code string or null
 */
export function extractCountryCode(phoneNumber: string): string | null {
  if (!phoneNumber) return null;
  
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  if (cleanNumber.startsWith('+')) {
    // International format: +[country code][national number]
    const match = cleanNumber.match(/^\+(\d{1,4})/);
    return match ? match[1] : null;
  }
  
  if (cleanNumber.startsWith('0')) {
    // Kenyan format starting with 0
    return '254';
  }
  
  if (cleanNumber.startsWith('254')) {
    // Kenyan format without +
    return '254';
  }
  
  return null;
}
