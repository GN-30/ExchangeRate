CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    destination_country TEXT NOT NULL,
    days INTEGER NOT NULL,
    budget_inr DECIMAL NOT NULL,
    travel_type TEXT NOT NULL,
    converted_budget DECIMAL NOT NULL,
    currency_code TEXT NOT NULL,
    exchange_rate DECIMAL NOT NULL,
    breakdown JSONB NOT NULL,
    suggestions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
