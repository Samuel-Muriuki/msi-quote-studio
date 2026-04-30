-- Seed: real Marking Systems product catalog, materials, industries.
-- Data sourced from markingsystems.com public product categories.

-- =====================================================================
-- Products (~16 rows)
-- =====================================================================
insert into products (category, name, description, base_price_per_sq_in, setup_fee, min_qty) values
  ('nameplate',           'Aluminum Anodized Nameplate',     'Industry standard for OEM equipment identification.',                  0.085,  75.00, 25),
  ('nameplate',           'Stainless Steel Nameplate',       'Corrosion-resistant nameplate for harsh environments.',                0.140,  95.00, 25),
  ('nameplate',           'Polycarbonate Nameplate',         'Cost-effective indoor identification.',                                0.045,  50.00, 50),
  ('overlay',             'Digital Print Overlay',           'Full-colour digital graphics for short-run interfaces.',               0.055,  60.00, 25),
  ('overlay',             'Screen Print Overlay',            'Higher setup, lower per-unit cost; ideal at volume.',                  0.040,  85.00, 100),
  ('overlay',             'Capacitive Touch Overlay',        'Touch-sensitive overlay for capacitive interfaces.',                   0.180, 250.00, 50),
  ('info_label',          'UL Label - Standard',             'Underwriters Laboratories certified information label.',               0.065,  40.00, 100),
  ('info_label',          'CSA Label - Standard',            'Canadian Standards Association certified information label.',         0.065,  40.00, 100),
  ('info_label',          'Warning & Caution Label',         'Safety messaging label for compliance.',                               0.050,  35.00, 100),
  ('info_label',          'Industrial Information Label',    'General-purpose product information label.',                           0.040,  30.00, 100),
  ('membrane_switch',     '4-Button Membrane Switch',        'Tactile or non-tactile 4-button user interface.',                      0.220, 350.00, 25),
  ('membrane_switch',     'LED Backlit Membrane Switch',     'LED backlit membrane switch for low-light environments.',              0.310, 475.00, 25),
  ('die_cut_gasket',      'Custom Die-Cut Gasket',           'Custom-shaped gasket for sealing applications.',                       0.075, 200.00, 50),
  ('die_cut_gasket',      'Vibration Dampening Pad',         'Cushioning pad for vibration-sensitive assemblies.',                   0.060, 175.00, 50),
  ('emi_rfi',             'EMI/RFI Shielding Gasket',        'Electromagnetic / radio-frequency interference shielding gasket.',     0.150, 300.00, 25),
  ('thermal_management',  'Thermal Management Pad',          'Heat-dissipation pad for thermally-stressed components.',              0.110, 225.00, 25);

-- =====================================================================
-- Materials (~14 rows)
-- =====================================================================
insert into materials (type, name, description, cost_per_sq_in, durability_score) values
  ('substrate',     'Aluminum 0.020"',                'Anodised aluminium substrate, 0.020" gauge.',                              0.022,  9),
  ('substrate',     'Stainless Steel 0.025"',         'Brushed stainless steel substrate, 0.025" gauge.',                         0.045, 10),
  ('substrate',     'Polycarbonate 0.010"',           'Clear polycarbonate, 0.010" thickness.',                                   0.008,  6),
  ('substrate',     'Polyester (Mylar) 0.005"',       'White Mylar polyester, 0.005" thickness.',                                 0.005,  7),
  ('substrate',     'Vinyl 0.004"',                   'Calendered vinyl substrate, 0.004" thickness.',                            0.003,  4),
  ('substrate',     'Polyimide 0.003"',               'High-temperature polyimide, 0.003" thickness.',                            0.018,  9),
  ('adhesive',      '3M 467MP Acrylic',               'High-performance acrylic adhesive (3M 467MP).',                            0.006,  8),
  ('adhesive',      '3M 9485PC High-Tack',            'High-tack double-coated tape (3M 9485PC).',                                0.008,  9),
  ('adhesive',      '3M 300LSE Low Surface Energy',   'Low-surface-energy adhesive (3M 300LSE) for plastics.',                    0.012, 10),
  ('adhesive',      'Standard Permanent Acrylic',     'General-purpose permanent acrylic adhesive.',                              0.004,  6),
  ('overlaminate',  'Polyester Overlaminate Gloss',   'Glossy polyester overlaminate.',                                           0.007,  7),
  ('overlaminate',  'Polyester Overlaminate Matte',   'Matte polyester overlaminate.',                                            0.007,  7),
  ('overlaminate',  'UV-Resistant Overlaminate',      'UV-stabilised overlaminate for outdoor exposure.',                         0.012,  9),
  ('overlaminate',  'Anti-Microbial Overlaminate',    'Anti-microbial overlaminate for healthcare and food applications.',        0.018,  8);

-- =====================================================================
-- Industries (8 rows) — drives certification premium multiplier
-- =====================================================================
insert into industries (name, certification_premium, required_certifications, description) values
  ('Aerospace',              1.450, ARRAY['AS9100', 'ITAR', 'ISO 9001'],     'Highest precision, heavy documentation.'),
  ('Medical',                1.400, ARRAY['ISO 13485', 'FDA', 'ISO 9001'],   'Regulated medical device identification labels.'),
  ('Military & Government',  1.500, ARRAY['ITAR', 'MIL-SPEC', 'ISO 9001'],   'Defense applications with stringent traceability.'),
  ('Oil & Gas',              1.300, ARRAY['API', 'NACE', 'ISO 9001'],        'Harsh-environment durability requirements.'),
  ('Telecommunications',     1.150, ARRAY['UL', 'CSA', 'ISO 9001'],          'Network and infrastructure equipment ID.'),
  ('Food & Beverage',        1.200, ARRAY['NSF', 'FDA', 'ISO 9001'],         'Food-safe materials and traceability.'),
  ('Marine',                 1.250, ARRAY['USCG', 'ABS', 'ISO 9001'],        'Salt-water durability and corrosion resistance.'),
  ('Industrial / OEM',       1.000, ARRAY['UL', 'ISO 9001'],                 'Standard industrial baseline (no premium).')
on conflict (name) do nothing;
