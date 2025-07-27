# User Matching Feature for CSV Transaction Imports

## Overview

The CSV transaction import feature now supports automatic user assignment based on first and last names included in the CSV file. When an admin imports transactions, the system can automatically assign them to the appropriate users within the company.

## How It Works

1. **Name Extraction**: The system looks for `First Name` and `Last Name` columns in your CSV file
2. **User Matching**: Names are matched against existing users in your company (case-insensitive)
3. **Assignment**: Matched transactions are assigned to the found user; unmatched transactions go to the admin

## Supported Column Names

The system recognizes various column name formats:

### First Name Columns
- `First Name`
- `FirstName`
- `first_name`
- `Employee First Name`
- `User First Name`
- `Name` (when containing "First Last" format)

### Last Name Columns
- `Last Name`
- `LastName`
- `last_name`
- `Employee Last Name`
- `User Last Name`
- `Surname`

## CSV Format Example

```csv
Transaction Date,Description,Amount,Category,First Name,Last Name
07/22/2025,STARBUCKS STORE #12345,-4.50,Food & Drink,Alex,Paetznick
07/21/2025,AMAZON.COM PURCHASE,-29.99,Shopping,John,Smith
07/20/2025,SHELL GAS STATION,-45.00,Gas,Alex,Paetznick
07/19/2025,TARGET STORE #1234,-15.75,Shopping,,
```

## Import Results

After import, you'll see:

### Summary Statistics
- **Matched to Users**: Number of transactions assigned to specific users
- **No Match Found**: Transactions with names that don't match any users
- **Assigned to Admin**: Transactions without names or failed matches

### Detailed Assignment Log
- Row-by-row breakdown showing which user each transaction was assigned to
- Status indicators for successful matches, no matches, and errors

## Benefits

1. **Automatic Attribution**: Transactions are automatically assigned to the correct users
2. **Time Saving**: No manual reassignment needed after import
3. **Audit Trail**: Clear visibility into how transactions were assigned
4. **Fallback Safety**: Unmatched transactions still get imported and assigned to admin

## Requirements

- Admin privileges required to import CSV files
- Users must exist in the system before import
- Names in CSV must match user accounts exactly (case-insensitive)
- Users must be active members of the company

## Troubleshooting

**Q: Why weren't my transactions matched to users?**
- Check that the user accounts exist in your company
- Verify the first/last names in CSV match the user profiles exactly
- Ensure users are active (not disabled) in the system

**Q: Can I reassign transactions after import?**
- Currently, transaction ownership is set during import
- Future versions may include reassignment functionality

**Q: What happens to unmatched transactions?**
- They are assigned to the admin user who performed the import
- They remain visible and can be used normally in the system 