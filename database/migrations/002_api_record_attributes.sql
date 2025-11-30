-- ============================================================================
-- Migration: 002_api_record_attributes
-- Description: Add M2M table for non-numeric record attributes
-- ============================================================================

-- Create api_record_attributes table for storing string/JSON/array data
-- This complements api_record_metrics which stores numeric values only
CREATE TABLE IF NOT EXISTS public.api_record_attributes (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  record_id UUID NOT NULL,
  attribute_name VARCHAR(100) NOT NULL,
  attribute_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT api_record_attributes_pkey PRIMARY KEY (id),
  CONSTRAINT api_record_attributes_record_id_name_key UNIQUE (record_id, attribute_name),
  CONSTRAINT api_record_attributes_record_id_fkey FOREIGN KEY (record_id) 
    REFERENCES api_records (id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_attributes_record ON public.api_record_attributes USING btree (record_id);
CREATE INDEX IF NOT EXISTS idx_attributes_name ON public.api_record_attributes USING btree (attribute_name);

-- GIN index for JSONB queries (e.g., searching within attribute values)
CREATE INDEX IF NOT EXISTS idx_attributes_value ON public.api_record_attributes USING gin (attribute_value);

-- Add comment for documentation
COMMENT ON TABLE public.api_record_attributes IS 'M2M table for non-numeric record attributes (strings, arrays, objects). Use api_record_metrics for numeric values.';
