CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: In a real environment, you might want to create a trigger to auto-update updated_at

-- Seed an initial banner based on what's currently hardcoded in the frontend
INSERT INTO banners (title, image_url, link, is_active, display_order)
VALUES (
    'Deal of the Day: Exotic Fruits',
    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    '/shop',
    true,
    0
) ON CONFLICT DO NOTHING;
