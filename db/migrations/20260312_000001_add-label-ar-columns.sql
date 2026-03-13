-- Migration: Add Arabic label columns to Fields and LookupValues
-- Date: 2026-03-12
-- Purpose: Support bilingual (EN/AR) form content

ALTER TABLE Fields
    ADD LabelAr NVARCHAR(255) NULL;

ALTER TABLE LookupValues
    ADD ValueAr NVARCHAR(255) NULL;
