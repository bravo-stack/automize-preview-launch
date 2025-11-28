-- Seed Omnisend API sources
INSERT INTO api_sources (provider, endpoint_name, data_category)
VALUES
    ('omnisend', 'contacts', 'contacts'),
    ('omnisend', 'products', 'products'),
    ('omnisend', 'campaigns', 'campaigns'),
    ('omnisend', 'orders', 'orders'),
    ('omnisend', 'automations', 'automations')
ON CONFLICT (provider, endpoint_name) DO NOTHING;
