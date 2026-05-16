    let viewedDate = new Date();
    let profile = JSON.parse(localStorage.getItem('calx_v7_profile')) || { weight: 85, height: 175, age: 25, goal: 500, life: 1.2 };
    let journey = JSON.parse(localStorage.getItem('calx_v7_journey')) || { totalNeeded: 0, targetDate: null, startWeight: 85, startDate: new Date().toISOString() };
    let logs = JSON.parse(localStorage.getItem('calx_v7_logs')) || [];

    function showPage(pId, el) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('page-'+pId).classList.add('active');
        el.classList.add('active');
        if(pId === 'add') renderLogs();
    }

   function changeDate(days) {
    let tempDate = new Date(viewedDate);
    tempDate.setDate(tempDate.getDate() + days);
    
    // Block future dates
    // if (tempDate > new Date()) return;

    viewedDate = tempDate;
    const today = new Date().toLocaleDateString();
    const current = viewedDate.toLocaleDateString();
    
    document.getElementById('display-date').innerText = (today === current) ? "Today" : current;
    
    // Handle Forward Button state
    const forwardBtn = document.getElementById('btn-forward');
    if (today === current) {
        forwardBtn.style.opacity = "0.2";
        forwardBtn.style.pointerEvents = "none";
    } else {
        forwardBtn.style.opacity = "1";
        forwardBtn.style.pointerEvents = "auto";
    }

    renderLogs();
    updateEngine();
}

    function jumpToDate(val) {
    if(!val) return;
    let tempDate = new Date(val);
    
    // Block future dates
    if (tempDate > new Date()) {
        alert("Cannot select future dates");
        return;
    }
    
    viewedDate = tempDate;
    changeDate(0); // This triggers the button disable logic automatically
}

// Add this line at the very bottom of your <script> to grey out future dates in the calendar
document.getElementById('date-jump').max = new Date().toISOString().split("T")[0];

    function saveTarget() {
        journey = { totalNeeded: parseFloat(document.getElementById('p-lose').value) * 7700, targetDate: document.getElementById('p-date').value, startWeight: profile.weight, startDate: new Date().toISOString() };
        localStorage.setItem('calx_v7_journey', JSON.stringify(journey));
        updateEngine();
    }

    function saveProfile() {
        profile = { weight: parseFloat(document.getElementById('p-weight').value), height: parseFloat(document.getElementById('p-height').value), age: parseFloat(document.getElementById('p-age').value), goal: parseFloat(document.getElementById('p-goal').value), life: parseFloat(document.getElementById('p-life').value) };
        localStorage.setItem('calx_v7_profile', JSON.stringify(profile));
        updateEngine();
    }
    // Syncs the dropdown selection to the text box
function syncWorkoutName(sel) {
    const nameInput = document.getElementById('work-name');
    if (sel.value !== "custom") {
        nameInput.value = sel.options[sel.selectedIndex].text;
    }
    calcLiveWorkout();
}

// Calculates calories in real-time as you type
function calcLiveWorkout() {
    const met = document.getElementById('work-met').value;
    const mins = parseFloat(document.getElementById('work-mins').value) || 0;
    const kcalInput = document.getElementById('work-kcal-input');
    const preview = document.getElementById('live-burn-preview');

    if (met !== "custom") {
        // Standard MET formula: (MET * 3.5 * weight_kg) / 200 * mins
        const burn = Math.floor((parseFloat(met) * 3.5 * profile.weight) / 200 * mins);
        kcalInput.value = burn > 0 ? burn : "";
        preview.innerText = burn > 0 ? `Estimated Burn: ${burn} kcal` : "";
    } else {
        preview.innerText = "Manual entry mode";
    }
}

// Updated AddLog to handle the new fields
function addLog(type) {
    let kcal, name;
    
    if (type === 'food') {
        kcal = parseFloat(document.getElementById('food-kcal').value);
        name = document.getElementById('food-name').value || "Food";
    } else {
        // Use the value from the manual calorie input field
        kcal = parseFloat(document.getElementById('work-kcal-input').value);
        name = document.getElementById('work-name').value || "Workout";
    }

    if (!kcal || kcal <= 0) return;

    logs.push({ 
        type, 
        name, 
        kcal, 
        id: Date.now(), 
        date: viewedDate.toISOString() 
    });

    localStorage.setItem('calx_v7_logs', JSON.stringify(logs));
    
    // Clear inputs
    if(type === 'workout') {
        document.getElementById('work-mins').value = "";
        document.getElementById('work-kcal-input').value = "";
        document.getElementById('live-burn-preview').innerText = "";
    }
    
    renderLogs();
    updateEngine();
}

   

    function deleteLog(id) {
        logs = logs.filter(l => l.id !== id);
        localStorage.setItem('calx_v7_logs', JSON.stringify(logs));
        renderLogs();
        updateEngine();
    }

    function renderLogs() {
        const cont = document.getElementById('history-list');
        const currentStr = viewedDate.toLocaleDateString();
        document.getElementById('logs-title').innerText = currentStr === new Date().toLocaleDateString() ? "Today's Logs" : "Logs for " + currentStr;
        const filtered = logs.filter(l => new Date(l.date).toLocaleDateString() === currentStr);
        cont.innerHTML = filtered.length ? '' : '<div style="padding:20px; text-align:center; color:#64748b; font-size:0.8rem">No entries for this date</div>';
        filtered.slice().reverse().forEach(l => {
            cont.innerHTML += `<div class="log-item"><div><small style="color:var(--primary);text-transform:uppercase">${l.type}</small><br><b>${l.name}</b></div><div style="display:flex;align-items:center"><span style="font-weight:800;color:${l.type=='food'?'#94a3b8':'var(--success)'}">${l.type=='food'?'+':'-'}${l.kcal}</span><button class="del-btn" onclick="deleteLog(${l.id})">×</button></div></div>`;
        });
    }

  function updateEngine() {
    const now = new Date();
    const bmr = ((9 * profile.weight) + (5.25 * profile.height) - (5 * profile.age) + 5) * profile.life;
    const isToday = viewedDate.toLocaleDateString() === now.toLocaleDateString();
    
    // 1. DAILY STATS (This remains dynamic based on the date you are viewing)
    let restingBurn = isToday ? (bmr / 86400) * ((now - new Date().setHours(0,0,0,0)) / 1000) : bmr;
    const vStr = viewedDate.toLocaleDateString();
    const vLogs = logs.filter(l => new Date(l.date).toLocaleDateString() === vStr);
    const food = vLogs.filter(l => l.type === 'food').reduce((s, l) => s + l.kcal, 0);
    const work = vLogs.filter(l => l.type === 'workout').reduce((s, l) => s + l.kcal, 0);
    const dailyNet = (restingBurn + work) - food;
    const gap = dailyNet - profile.goal;

    // 2. STATIC JOURNEY STATS (Fixed to actual "now", ignoring history navigation)
    const startChallenge = new Date(journey.startDate);
    const targetDate = new Date(journey.targetDate);
    
    // Total deficit earned from start until the actual current second
    const realDeficitToNow = ((bmr / 86400) * (Math.abs(now - startChallenge) / 1000)) + 
        logs.filter(l => new Date(l.date) <= now)
            .reduce((s, l) => s + (l.type === 'workout' ? l.kcal : -l.kcal), 0);

    const journeyRemaining = journey.totalNeeded - realDeficitToNow;
    const actualDaysLeft = Math.ceil((targetDate - now) / 86400000);
    const dailyTargetNeeded = actualDaysLeft > 0 ? (journeyRemaining / actualDaysLeft) : 0;
    const currentExpectedWeight = journey.startWeight - (realDeficitToNow / 7700);

    // 3. UPDATE UI
    // Dynamic Top Section (Changes with history)
    document.getElementById('net-val').innerText = Math.floor(dailyNet);
    document.getElementById('rest-burn').innerText = Math.floor(restingBurn);
    document.getElementById('work-burn').innerText = work;
    document.getElementById('intake-total').innerText = food;
    document.getElementById('goal-gap').innerText = Math.floor(gap);
    
    // Static Middle Section (Always shows live journey status)
    document.getElementById('journey-val').innerText = Math.floor(journeyRemaining) + " kcal";
    document.getElementById('days-left').innerText = actualDaysLeft > 0 ? actualDaysLeft : "0";
    document.getElementById('daily-req').innerText = dailyTargetNeeded > 0 ? Math.floor(dailyTargetNeeded) + " /d" : "--";
    document.getElementById('expected-weight').innerText = currentExpectedWeight.toFixed(3) + " kg";
    
    document.getElementById('bmr-tag').innerText = `BMR: ${Math.floor(bmr)} kcal/day`;

    // Needle Logic
    let ang = 90 + (gap * 0.15); 
    ang = Math.max(0, Math.min(180, ang));
    document.getElementById('needle-group').style.transform = `rotate(${ang}deg)`;
    const sd = document.getElementById('status-desc');
    sd.innerText = gap > 0 ? "DEFICIT REACHED" : "INCREASE BURN";
    sd.style.color = gap > 0 ? "#38bdf8" : "#ef4444";
}
    document.getElementById('p-weight').value = profile.weight;
    document.getElementById('p-height').value = profile.height;
    document.getElementById('p-age').value = profile.age;
    document.getElementById('p-goal').value = profile.goal;
    document.getElementById('p-life').value = profile.life;
    setInterval(updateEngine, 1000);
    updateEngine();