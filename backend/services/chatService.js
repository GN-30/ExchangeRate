const db = require('../db');

const getChatbotResponse = async (message, userId) => {
    const lowerMsg = message.toLowerCase();
    
    if (userId) {
        // Dynamic Context Engine based on actual PostgreSQL queries
        if (lowerMsg.includes('my') && lowerMsg.includes('trip')) {
            const trips = await db.query('SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3', [userId]);
            if (trips.rows.length === 0) return "You haven't planned any trips yet! Head over to the Plan Trip page to deploy your AI agent.";
            
            const destinations = trips.rows.map(t => t.destination_country).join(', ');
            return `You've got some great adventures logged! Your recent plans include: ${destinations}.`;
        }
        
        if (lowerMsg.includes('spend') || lowerMsg.includes('spent') || lowerMsg.includes('expense') || lowerMsg.includes('how much')) {
            const expenses = await db.query('SELECT SUM(amount_inr) as total FROM expenses WHERE user_id = $1', [userId]);
            const total = expenses.rows[0].total || 0;
            if (total === 0) return "Your expense log is currently empty! Use the Track Finances page to start recording your spending.";
            return `You have logged a total of ₹${Number(total).toLocaleString()} in actual expenses across your excursions!`;
        }
        
        if (lowerMsg.includes('highest') || lowerMsg.includes('most expensive')) {
            const max = await db.query('SELECT destination_country, budget_inr FROM trips WHERE user_id = $1 ORDER BY budget_inr DESC LIMIT 1', [userId]);
            if (max.rows.length > 0) {
                return `Your most ambitious project was your trip to ${max.rows[0].destination_country}, with an estimated budget of ₹${Number(max.rows[0].budget_inr).toLocaleString()}!`;
            }
        }
    }
    
    if (lowerMsg.includes('budget') || lowerMsg.includes('money')) {
        return "To keep a solid budget, my AI models suggest: 40% stay, 30% food, 20% travel, and 10% activities.";
    }
    
    if (lowerMsg.includes('card') || lowerMsg.includes('cash') || lowerMsg.includes('pay')) {
        return "Always keep 20% of your budget in local cash! A zero-markup Forex card (like Niyo or Scapia) handles the rest efficiently.";
    }
    
    if (lowerMsg.includes('weather') || lowerMsg.includes('when')) {
        return "Shoulder seasons (Spring/Fall) offer the best synthesis of perfect weather and cheaper flights globally.";
    }

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        return userId 
            ? "Hello Explorer! I'm wired directly into your database. Try asking: 'What are my recent trips?' or 'How much have I spent?'"
            : "Hello! I'm your AI Travel Assistant. Ask me about budget management, payment methods, or currency advice.";
    }

    return userId 
        ? "I can analyze your database! You can explicitly ask me 'What are my recent trips?', 'How much have I spent?', or 'What was my highest budget?'."
        : "I can help with travel budgeting, payment methods, and exchange rate advice. What would you like to know?";
};

module.exports = { getChatbotResponse };
