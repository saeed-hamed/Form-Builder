-- Remove Type column from Lookups (multi-select removed, all lookups are single-select)
ALTER TABLE Lookups DROP COLUMN Type;
