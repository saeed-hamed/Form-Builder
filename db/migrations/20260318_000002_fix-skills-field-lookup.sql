-- Fix Skills multi_select field (FieldId=11) missing LookupId — was saved as NULL
-- due to a bug where lookupId was only kept for 'list' type, not 'multi_select'
UPDATE Fields SET LookupId = 3 WHERE FieldId = 11 AND FieldType = 'multi_select' AND LookupId IS NULL;
