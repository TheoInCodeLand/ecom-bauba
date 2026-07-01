-- 015: Create store settings
CREATE TABLE IF NOT EXISTS store_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT,
    label       VARCHAR(255),
    category    VARCHAR(50),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default store settings
INSERT INTO store_settings (key, value, label, category) VALUES
    ('store_name',                  'Maison Luxe',                          'Store Name',                       'general'),
    ('store_tagline',               'Curated Luxury. Delivered.',           'Store Tagline',                    'general'),
    ('contact_email',               'hello@maisonluxe.co.za',              'Contact Email',                    'general'),
    ('contact_phone',               '+27 11 000 0000',                     'Contact Phone',                    'general'),
    ('store_address',               'Sandton, Johannesburg, South Africa',  'Store Address',                    'general'),
    ('shipping_base_cost',          '150',                                  'Base Shipping Cost (ZAR)',          'shipping'),
    ('free_shipping_threshold',     '2500',                                 'Free Shipping Threshold (ZAR)',     'shipping'),
    ('announcement_banner_text',    'Free shipping on orders over R2,500', 'Announcement Banner Text',         'marketing'),
    ('announcement_banner_active',  'true',                                 'Announcement Banner Active',       'marketing'),
    ('maintenance_mode',            'false',                                'Maintenance Mode',                 'system'),
    ('maintenance_message',         'We are back shortly.',                 'Maintenance Message',              'system'),
    ('currency',                    'ZAR',                                  'Currency',                         'general'),
    ('vat_number',                  '',                                     'VAT Number',                       'legal'),
    ('company_registration',        '',                                     'Company Registration',             'legal'),
    ('social_instagram',            '',                                     'Instagram URL',                    'social'),
    ('social_facebook',             '',                                     'Facebook URL',                     'social'),
    ('social_pinterest',            '',                                     'Pinterest URL',                    'social'),
    ('social_tiktok',               '',                                     'TikTok URL',                       'social'),
    ('returns_policy_days',         '30',                                   'Returns Window (Days)',             'policies'),
    ('loyalty_points_per_rand',     '1',                                    'Loyalty Points per ZAR',           'loyalty'),
    ('seo_title',                   'Maison Luxe | Curated Luxury Fashion', 'Default SEO Title',               'seo'),
    ('seo_description',             'Shop authentic luxury bags, clothing, shoes and jewellery at Maison Luxe. Free shipping over R2,500.', 'Default SEO Description', 'seo')
ON CONFLICT (key) DO NOTHING;
