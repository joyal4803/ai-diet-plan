// server.js
require('dotenv').config();
console.log("🔐 Using API Key:", OPENROUTER_API_KEY ? "Loaded ✅" : "❌ Not Loaded");

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors());
app.use(express.json());



// Replace with your actual OpenRouter API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// POST endpoint to generate diet plan
app.post('/api/generate-diet-plan', async (req, res) => {
    const { weight, height, age, gymDays, cost, goal, dietaryPreference } = req.body;

    // Compose the prompt for OpenAI
    const prompt = `
    You are a professional dietitian who specializes in Kerala-style diets.
    
    Generate a **3-day Kerala-style meal plan** for a person with the following information:
    
    - Weight: ${weight} kg
    - Height: ${height} cm
    - Age: ${age} years
    - Gym Days per Week: ${gymDays}
    - Goal: ${goal}
    - Budget: ${cost} (Low / Medium / High)
    - Dietary Preference: ${dietaryPreference}
    
    ---
    
    🎯 **Nutrition Goals**:
    - Calculate Daily Calorie Target
    - Calculate Daily Protein (use 2g per kg of body weight)
    - Macro split: 40% Carbs, 30% Protein, 30% Fat
    
    ---
    
    📌 **Rules**:
    1. **Protein intake must meet the calculated requirement** (e.g., 150g+ for 75 kg).
    2. **Do NOT reduce protein for low budget** – only change food type.
    3. Meals should be simple Kerala-style:
       - Only include **rice + curry or fry** (no exotic foods)
       - Snacks can be simple: peanuts, banana, chakka, guava, boiled eggs, or milk
    4. **Dietary Preference Rules**:
       - **Vegetarian**: Only dairy, pulses, nuts, seeds, soya. No egg/meat/fish.
       - **Eggitarian**: Vegetarian + eggs, dairy. No meat or fish.
       - **Non-Vegetarian**: All foods allowed (eggs, meat, fish, legumes, dairy).
    5. **Budget Rules**:
       - Low: soya, milk, eggs (if allowed), legumes, sardines in low never ever include mutton,prawns etc
       - Medium: add chicken, paneer, banana, nuts
       - High: add beef, mutton, cashew, paneer, chicken breast
    
    ---
    
    📅 Create plan for **3 days**:
    Each day should have:
    
    **Day X**
    
    | Meal              | Food Item               | Portion           | Calories | Protein | Carbs | Fat |
    |-------------------|--------------------------|-------------------|----------|---------|--------|------|
    | Breakfast         |                          |                   |          |         |        |      |
    | Mid-Morning Snack |                          |                   |          |         |        |      |
    | Lunch             |                          |                   |          |         |        |      |
    | Evening Snack     |                          |                   |          |         |        |      |
    | Dinner            |                          |                   |          |         |        |      |
    
    **Daily Summary:** Protein: ___g | Carbs: ___g | Fat: ___g
    
    ---
    
    ✅ Markdown only. No JSON.  
    ✅ Keep meals clear, short, and practical.  
    ✅ Must complete all **3 days (Day 1, Day 2, Day 3)**.  
    ✅ Use bold headings for each day: **Day 1**, **Day 2**, **Day 3**.
    
    Begin with **Day 1**.
    `;
    

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "openai/gpt-3.5-turbo-0613",
                messages: [
                    { role: "system", content: "You are a helpful diet assistant." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 800
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Parse the response from OpenRouter
        const aiMessage = response.data.choices[0].message.content;
        let dietPlan;
        try {
            dietPlan = JSON.parse(aiMessage);
        } catch {
            dietPlan = { rawResponse: aiMessage };
        }

        res.json(dietPlan);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate diet plan.' });
    }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
