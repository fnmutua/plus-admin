# Phone Validation Update - International Phone Number Support

## Overview
This update modifies the login/registration system to accept phone numbers from countries beyond Kenya, while maintaining backward compatibility with Kenyan phone numbers.

## Changes Made

### 1. New Phone Validation Utility (`src/utils/phoneValidation.ts`)
- **`validateInternationalPhone()`**: Validates international phone numbers with country codes 1-4 digits and national numbers 6-15 digits
- **`validateKenyanPhone()`**: Maintains backward compatibility for Kenyan phone numbers
- **`formatPhoneForDisplay()`**: Formats phone numbers for consistent display
- **`extractCountryCode()`**: Extracts country code from phone numbers

### 2. Updated Registration Form (`src/views/Landing/Login/components/RegisterForm.vue`)
- Replaced Kenyan-only phone validation with international phone validation
- Updated phone field placeholder to show examples: `+254700000000 or +1234567890`
- Added phone number formatting before submission
- Fixed TypeScript type issues

### 3. Updated Contact Form (`src/views/Landing/Contact.vue`)
- Replaced Kenyan-only phone validation with international phone validation
- Updated phone field placeholder to show examples: `+254700000000 or +1234567890`
- Added phone number formatting before submission

### 4. Updated Grievance Forms
- **`src/views/Grievances/Open.vue`**: Updated phone validation for GRM staff
- **`src/views/Grievances/GrievanceDetails.vue`**: Updated phone validation for GRM staff

## Phone Number Formats Supported

### International Format
- **Pattern**: `+[country code][national number]` or `[country code][national number]`
- **Country Code**: 1-4 digits (e.g., +1 for US, +44 for UK, +254 for Kenya)
- **National Number**: 6-15 digits
- **Examples**:
  - `+1234567890` (US)
  - `+447911123456` (UK)
  - `+254700000000` (Kenya)
  - `+919876543210` (India)

### Kenyan Format (Backward Compatible)
- **Pattern**: `0[17]XXXXXXXX` or `+254[17]XXXXXXXX`
- **Examples**:
  - `0700000000` → automatically converted to `+254700000000`
  - `+254700000000` → accepted as-is

## Validation Rules

1. **Required**: Phone number must be provided
2. **Format**: Must follow international phone number pattern
3. **Length**: Country code (1-4 digits) + national number (6-15 digits)
4. **Characters**: Only digits and optional + prefix allowed
5. **Spacing**: Spaces, dashes, parentheses, and dots are automatically removed

## Benefits

1. **Global Accessibility**: Users from any country can register
2. **Backward Compatibility**: Existing Kenyan users continue to work
3. **Consistent Formatting**: All phone numbers are stored in international format
4. **Better UX**: Clear examples and helpful error messages
5. **Maintainable Code**: Centralized validation logic

## Usage Examples

### Registration
```typescript
// Valid phone numbers
"+1234567890"        // US
"+447911123456"      // UK  
"+254700000000"      // Kenya
"0700000000"         // Kenya (auto-converted to +254700000000)

// Invalid phone numbers
"12345"              // Too short
"+12345678901234567" // Too long
"abc123"             // Contains letters
```

### API Response
```typescript
{
  isValid: true,
  formattedNumber: "+254700000000",
  countryCode: "254",
  nationalNumber: "700000000"
}
```

## Migration Notes

- Existing Kenyan phone numbers in the database will continue to work
- New registrations will accept international numbers
- Phone numbers are automatically formatted to international format before storage
- No database schema changes required

## Testing

Test the following scenarios:
1. Kenyan numbers starting with 0 (should auto-convert to +254)
2. Kenyan numbers starting with +254
3. US numbers starting with +1
4. UK numbers starting with +44
5. Invalid formats (should show appropriate error messages)
6. Empty phone numbers (should show required error)
