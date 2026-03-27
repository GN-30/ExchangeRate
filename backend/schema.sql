CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    destination_country TEXT NOT NULL,
    destinations JSONB, -- For multi-country trips
    days INTEGER NOT NULL,
    budget_inr DECIMAL NOT NULL,
    travel_type TEXT NOT NULL,
    converted_budget DECIMAL NOT NULL,
    currency_code TEXT NOT NULL,
    exchange_rate DECIMAL NOT NULL,
    breakdown JSONB NOT NULL,
    suggestions JSONB NOT NULL,
    itinerary JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount_inr DECIMAL NOT NULL,
    amount_local DECIMAL NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    currency_code TEXT NOT NULL,
    target_rate DECIMAL NOT NULL,
    condition TEXT NOT NULL, -- 'above' or 'below'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
