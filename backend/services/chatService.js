const getChatbotResponse = async (message) => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('budget') || lowerMsg.includes('money')) {
        return "To keep a good budget, allocate 40% for stay, 30% for food, 20% for travel, and 10% for activities.";
    }
    
    if (lowerMsg.includes('card') || lowerMsg.includes('cash') || lowerMsg.includes('pay')) {
        return "It's always best to carry 20% of your budget in local cash, and keep the rest on a Forex card for safety and better exchange rates.";
    }
    
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        return "Hello! I'm your AI Travel Assistant. Ask me about budget management, payment methods, or currency advice.";
    }

    if (lowerMsg.includes('weather') || lowerMsg.includes('when')) {
        return "Always check the best time to visit your destination. Generally, shoulder seasons (Spring/Fall) offer better prices and fewer crowds.";
    }

    return "I can help with travel budgeting, payment methods, and exchange rate advice. What would you like to know?";
};

module.exports = { getChatbotResponse };
