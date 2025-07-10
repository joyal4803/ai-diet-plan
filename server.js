// server.js
require('dotenv').config();


const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors());
app.use(express.json());



// Replace with your actual OpenRouter API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
console.log("🔐 Using API Key:", OPENROUTER_API_KEY ? "Loaded ✅" : "❌ Not Loaded");

// POST endpoint to generate diet plan
app.post('/api/generate-diet-plan', async (req, res) => {
    const { weight, height, age, gymDays, cost, goal, dietaryPreference } = req.body;

    // Compose the prompt for OpenAI
    const prompt = `You are a certified dietitian specializing in Kerala-style meal plans.

    Generate a personalized **2-day Kerala-style meal plan** for a user based on this information:
    
    - Weight: ${weight} kg
    - Height: ${height} cm
    - Age: ${age} years
    - Gym Days per Week: ${gymDays}
    - Goal: ${goal} (Weight Loss / Muscle Gain / Maintenance)
    - Budget: ${cost} (Low / Medium / High)
    - Dietary Preference: ${dietaryPreference}
    
    ---
    
    🎯 **Nutrition Goals**:
    - Use **2g of protein per kg of body weight**
      - For example, 75kg = 150g protein/day minimum
    
    - Calculate Total Daily Calories
    - Ensure daily protein >= required target (strict rule)
    
    ---
    
    📌 **Rules**:
    1. **Protein amount must NOT go below the 2g/kg requirement**, even for low budgets.
    2. Keep food Kerala-style and affordable.
    3. Meals must be:
       - Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner
       - Examples: rice + curry, dosa + chutney, puttu + kadala, chappathi, bananas, boiled eggs, peanuts
    4. **Dietary Preference Rules**:
       - Vegetarian: pulses, milk, paneer, soya, nuts (no eggs/meat/fish)
       - Eggitarian: vegetarian + eggs (no meat/fish).add more eggs to complete protein goal
       - Non-Vegetarian: all foods allowed and add more eggs to complete protein goal
    5. **Budget Rules**:
       - Low: soya, legumes, sardines, eggs, milk, peanuts
       - Medium: chicken, paneer, banana, curd, dry fruits
       - High: chicken breast, beef, mutton, cashew, paneer, fish
    
    ---
    
    📅 Create plan for **2 days**:
    
    Format strictly like this:
    first give total calorie intake total protein goal per day
    🔸 Total Calories: XXXX kcal  
    🔸 Protein: XXg | Carbs: XXg | Fat: XXg
    
    
    **Day 1**

    
    🍽️ **Breakfast**  
    - [Item]  
    - Calories: ___ |portion__ | Protein: ___g | Carbs: ___g | Fat: ___g  
    
    🍌 **Mid-Morning Snack**  
    ...
    
    🍛 **Lunch**  
    ...
    
    ☕ **Evening Snack**  
    ...
    
    🌙 **Dinner**  
    ...
    
    🔁 **Daily Summary**:  
    Calories: ___ kcal  
    Protein: ___g | Carbs: ___g | Fat: ___g
    \`\`\`
    
    ✅ Repeat for **Day 2**  
    ✅ No table format  
    ✅ Meals must be practical and realistic for a Kerala household.  
    ✅ Highlight each day with **bold headings**: **Day 1**, **Day 2**, **Day 3**
    first ensure proper calorie intake and give enough protein requriments use your brain.you are not giving enough protein give more and more protein and iincrease way more total calories also.think like a nutritionist dont be an idiot
    want more protein and total calories increase it.give more i need more protein and total calorie.total protein per day is not still enough i need more give more.add more eggs to complete protein goal .give minimum of 5 eggs per day for eggeterian and non vegiterian.dont give mutton and chicken biriyani to low budget and add more number of eggs as it is low cost
    add more eggs instead of going for expensive.give quantity for everything even for rice
    Start now with **Day 1**.
    make sure till **Daily Summary**:  
    Calories: ___ kcal  
    Protein: ___g | portion:__ |Carbs: ___g | Fat: ___g
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
