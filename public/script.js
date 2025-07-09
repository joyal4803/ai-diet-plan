document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dietForm');
    const dietPlanContainer = document.getElementById('dietPlan');
    const generateBtn = document.getElementById('generateBtn');
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    const downloadDietBtn = document.getElementById('downloadDietBtn');
    
    // Store current diet plan and user info for PDF download
    let currentDietPlan = null;
    let currentUserInfo = null;

    if (downloadDietBtn) {
        downloadDietBtn.style.display = 'block';
        downloadDietBtn.disabled = true;
    }
    
    // Add event listener for PDF download
    if (downloadDietBtn) {
        downloadDietBtn.addEventListener('click', downloadDietPDF);
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable download button on new submission
        if (downloadDietBtn) downloadDietBtn.disabled = true;
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            weight: parseFloat(formData.get('weight')),
            height: parseFloat(formData.get('height')),
            age: parseInt(formData.get('age')),
            gymDays: parseInt(formData.get('gymDays')),
            cost: formData.get('cost'),
            goal: formData.get('goal'),
            dietaryPreference: formData.get('dietaryPreference')
        };
        
        // Store user info for PDF download
        currentUserInfo = data;

        // Show loading state
        setLoadingState(true);

        try {
            const response = await fetch('https://ai-diet-plan.onrender.com/api/generate-diet-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                currentDietPlan = result;
                displayDietPlan(result);
            } else {
                showError(result.error || 'Failed to generate diet plan');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please try again.');
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(isLoading) {
        if (isLoading) {
            generateBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            generateBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        }
    }

    function showError(message) {
        // Remove has-diet class to disable scrolling
        const dietContent = document.querySelector('.diet-content');
        if (dietContent) {
            dietContent.classList.remove('has-diet');
        }
        
        dietPlanContainer.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${message}
            </div>
        `;
        if (downloadDietBtn) downloadDietBtn.disabled = true;
    }

    function displayDietPlan(dietPlan) {
        // Add has-diet class to enable scrolling
        const dietContent = document.querySelector('.diet-content');
        if (dietContent) {
            dietContent.classList.add('has-diet');
        }
        
        // Check if we have a structured response or raw response
        if (dietPlan.rawResponse) {
            // Handle raw response as Markdown
            dietPlanContainer.innerHTML = marked.parse(dietPlan.rawResponse);
            
            // Enable download button for raw response
            if (downloadDietBtn) {
                downloadDietBtn.style.display = 'block';
                downloadDietBtn.disabled = false;
            }
            return;
        }

        let html = '<div class="diet-plan active">';

        // Summary Section
        if (dietPlan.dailyCalories || dietPlan.macros) {
            html += `
                <div class="summary-section">
                    <h3>Daily Summary</h3>
                    <div class="calorie-info">
                        ${dietPlan.dailyCalories ? `<div class="calorie-item"><strong>Daily Calories:</strong> ${dietPlan.dailyCalories}</div>` : ''}
                    </div>
                    ${dietPlan.macros ? `
                        <div class="macro-breakdown">
                            <div class="macro-item">
                                <div class="macro-value">${dietPlan.macros.protein}</div>
                                <div>Protein</div>
                            </div>
                            <div class="macro-item">
                                <div class="macro-value">${dietPlan.macros.carbs}</div>
                                <div>Carbs</div>
                            </div>
                            <div class="macro-item">
                                <div class="macro-value">${dietPlan.macros.fats}</div>
                                <div>Fats</div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Weekly Plan
        if (dietPlan.weeklyPlan && dietPlan.weeklyPlan.length > 0) {
            dietPlan.weeklyPlan.forEach(day => {
                html += `
                    <div class="diet-day">
                        <h3 class="diet-day-heading">${day.day}</h3>
                        ${day.meals ? day.meals.map(meal => `
                            <div class="meal">
                                <h4>${meal.name}</h4>
                                ${meal.foods ? meal.foods.map(food => `<p>• ${food}</p>`).join('') : ''}
                                ${meal.calories ? `<div class="meal-calories">${meal.calories} calories</div>` : ''}
                                ${meal.macros ? `
                                    <div style="margin-top: 8px; font-size: 0.9rem; color: #666;">
                                        P: ${meal.macros.protein} | C: ${meal.macros.carbs} | F: ${meal.macros.fats}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('') : ''}
                    </div>
                `;
            });
        }

        // Shopping List
        if (dietPlan.shoppingList) {
            html += `
                <div class="shopping-section">
                    <h3>Shopping List</h3>
                    <div class="budget-tabs">
                        <div class="budget-tab active" data-budget="low">Low Budget</div>
                        <div class="budget-tab" data-budget="medium">Medium Budget</div>
                        <div class="budget-tab" data-budget="high">High Budget</div>
                    </div>
                    <div class="shopping-list">
                        <ul id="shoppingList">
                            ${dietPlan.shoppingList.low ? dietPlan.shoppingList.low.map(item => `<li>${item}</li>`).join('') : ''}
                        </ul>
                    </div>
                </div>
            `;
        }

        // Tips Section
        if (Array.isArray(dietPlan.tips) && dietPlan.tips.length > 0) {
            html += `
                <div class="tips-section">
                    <h3>Tips & Recommendations</h3>
                    <ul class="tips-list">
                        ${dietPlan.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else if (typeof dietPlan.tips === 'string' && dietPlan.tips.trim() !== '') {
            html += `
                <div class="tips-section">
                    <h3>Tips & Recommendations</h3>
                    <ul class="tips-list">
                        <li>${dietPlan.tips}</li>
                    </ul>
                </div>
            `;
        }

        html += '</div>';
        dietPlanContainer.innerHTML = html;

        // Show download button when plan is displayed
        if (downloadDietBtn) {
            downloadDietBtn.style.display = 'block';
            downloadDietBtn.disabled = false;
        }

        // Add event listeners for budget tabs
        if (dietPlan.shoppingList) {
            setupBudgetTabs(dietPlan.shoppingList);
        }
    }

    function setupBudgetTabs(shoppingList) {
        const tabs = document.querySelectorAll('.budget-tab');
        const shoppingListUl = document.getElementById('shoppingList');

        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                this.classList.add('active');

                // Update shopping list
                const budget = this.getAttribute('data-budget');
                const items = shoppingList[budget] || [];
                shoppingListUl.innerHTML = items.map(item => `<li>${item}</li>`).join('');
            });
        });
    }
    
    // Utility to remove all non-ASCII (emoji/unicode) characters
    function removeNonASCII(str) {
        return str.replace(/[^\x00-\x7F]/g, "");
    }

    // PDF Download Function
    async function downloadDietPDF() {
        if (!currentDietPlan) {
            alert('No diet plan available to download');
            return;
        }
        
        let originalText;
        try {
            // Show loading state on download button
            originalText = downloadDietBtn.textContent;
            downloadDietBtn.textContent = 'Generating PDF...';
            downloadDietBtn.disabled = true;
            
            // Get the current diet plan content as text
            let dietText = '';
            
            if (currentDietPlan.rawResponse) {
                dietText = currentDietPlan.rawResponse;
            } else {
                dietText = dietPlanContainer.innerText || dietPlanContainer.textContent;
            }
            if (!dietText || dietText.trim() === '') {
                dietText = JSON.stringify(currentDietPlan, null, 2);
            }
            dietText = removeNonASCII(dietText);
            
            // Create PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFont('helvetica');
            doc.setFontSize(16);
            doc.setTextColor(102, 126, 234);
            doc.text('Personalized Diet Plan', 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.setTextColor(102, 102, 102);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
            if (currentUserInfo) {
                doc.setFontSize(12);
                doc.setTextColor(102, 126, 234);
                doc.text('Your Information', 20, 45);
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(`Weight: ${currentUserInfo.weight} kg`, 20, 55);
                doc.text(`Height: ${currentUserInfo.height} cm`, 20, 62);
                doc.text(`Age: ${currentUserInfo.age} years`, 20, 69);
                doc.text(`Gym Days: ${currentUserInfo.gymDays} days per week`, 20, 76);
                doc.text(`Budget: ${currentUserInfo.cost}`, 20, 83);
                doc.text(`Goal: ${currentUserInfo.goal}`, 20, 90);
                doc.text(`Dietary Preference: ${currentUserInfo.dietaryPreference}`, 20, 97);
            }
            doc.setFontSize(12);
            doc.setTextColor(102, 126, 234);
            doc.text('Diet Plan', 20, currentUserInfo ? 107 : 50);
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            const pageWidth = 170;
            const startY = currentUserInfo ? 117 : 60;
            let currentY = startY;
            const lines = doc.splitTextToSize(dietText, pageWidth);
            for (let i = 0; i < lines.length; i++) {
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.text(lines[i], 20, currentY);
                currentY += 6;
            }
            doc.setFontSize(8);
            doc.setTextColor(102, 102, 102);
            doc.text('Generated by AI Diet Plan Generator', 105, 280, { align: 'center' });
            doc.text('Specialized in South Indian (Kerala) Cuisine', 105, 285, { align: 'center' });

            // --- Mobile download fix ---
            function isIOS() {
                return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            }
            const fileName = `diet-plan-${Date.now()}.pdf`;
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            if (isIOS()) {
                // iOS workaround: open PDF in new tab
                window.open(blobUrl, '_blank');
            } else {
                // Use anchor element for download (works on Android and most browsers)
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                }, 100);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            // Restore download button
            if (originalText) {
                downloadDietBtn.textContent = originalText;
                downloadDietBtn.disabled = false;
            }
        }
    }
}); 
