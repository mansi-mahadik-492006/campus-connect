// ============================================
// CAMPUSCONNECT AI AGENT - app.js
// ============================================

// 🔑 PASTE YOUR GEMINI API KEY HERE
const GEMINI_API_KEY = "AIzaSyAozTZeVuREabfSSCWtmQjxp3AsVvNKlCA";

// Student context for personalized AI responses
const STUDENT_CONTEXT = `
You are CampusConnect, an intelligent onboarding assistant for TCET (Thakur College of Engineering and Technology), Mumbai.

Student Profile:
- Name: Mansi
- Branch: Computer Engineering
- Roll No: CE2024001
- Type: Hostel Student
- Onboarding Progress: 65% complete
- Completed: Document submission, ID card collection
- Pending: Fee payment (URGENT - 2 days left), course registration, hostel allocation, LMS setup, mentor assignment

You are an INTELLIGENT ONBOARDING AGENT with 5 specialized sub-agents:
1. Document Agent: Validates documents, creates checklists
2. Financial Agent: Fee payment, scholarships, financial aid
3. Academic Agent: Course registration, timetable, LMS
4. Hostel Agent: Room allocation, hostel rules, roommate preferences
5. Mentor Agent: Faculty mentors, senior peer connections

College Information:
- Fee payment portal: tcet.ac.in/fees
- LMS: lms.tcet.ac.in
- Course registration: erp.tcet.ac.in
- Hostel form: tcet.ac.in/hostel
- Helpdesk: 022-6740-8888

Documents Required (General):
- 10th & 12th Marksheets (originals + 4 copies)
- Aadhar Card (original + 2 copies)
- Caste Certificate (if applicable)
- Income Certificate (for scholarship)
- Passport size photos (10 copies)
- LC/TC from previous school
- Medical fitness certificate

Scholarship Criteria:
- Government scholarships: Family income below 8 lakhs/year
- Merit scholarship: >85% in 12th
- SC/ST/OBC: Additional government schemes available

Hostel Rules:
- Check-in time: 8 AM - 8 PM on working days
- Monthly fees: ₹8,000 (single) or ₹6,000 (shared)
- Requires hostel form, medical certificate, and parent consent

IMPORTANT BEHAVIOR RULES:
- Always be warm, encouraging, and supportive
- Detect if student seems confused or stressed and offer extra help
- If student asks same thing repeatedly, suggest connecting with counselor
- Proactively mention upcoming deadlines
- Give step-by-step instructions when explaining processes
- Keep responses concise but complete
- Use emojis naturally to be friendly
- Always mention which "agent" is helping (e.g., "💰 Financial Agent here!")
`;

let messageCount = {};
let questionFrequency = {};

// Page Navigation
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + pageName).classList.add('active');
  event.target.classList.add('active');
}

// Open chat with a pre-filled question
function openChat(question) {
  showPage('chat');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-btn')[1].classList.add('active');
  setTimeout(() => {
    document.getElementById('chatInput').value = question;
    sendMessage();
  }, 300);
}

// Quick question buttons
function sendQuick(question) {
  document.getElementById('chatInput').value = question;
  sendMessage();
}

// Complete a task (demo)
function completeTask(checkbox, taskType) {
  if (checkbox.checked) {
    showToast('🎉 Task completed! +50 XP earned!');
    checkbox.parentElement.classList.add('done');
    checkbox.parentElement.querySelector('label').style.textDecoration = 'line-through';
  }
}

// Toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Sentiment / confusion detection
function detectSentiment(text) {
  const stressWords = ['confused', 'stressed', 'lost', 'overwhelmed', 'don\'t understand', 'help me', 'frustrated', 'anxious', 'worried', 'scared'];
  const lowerText = text.toLowerCase();
  return stressWords.some(word => lowerText.includes(word));
}

// Track repeated questions
function trackQuestion(text) {
  const key = text.toLowerCase().substring(0, 30);
  questionFrequency[key] = (questionFrequency[key] || 0) + 1;
  return questionFrequency[key];
}

// Add message to chat UI
function addMessage(text, sender) {
  const chatMessages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `message ${sender}`;

  if (sender === 'bot') {
    div.innerHTML = `
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble">${text}</div>
    `;
  } else {
    div.innerHTML = `
      <div class="msg-bubble">${text}</div>
      <div class="msg-avatar">👤</div>
    `;
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Main send message function
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const userText = input.value.trim();
  if (!userText) return;

  input.value = '';

  // Add user message
  addMessage(userText, 'user');

  // Show typing indicator
  const typingEl = document.getElementById('typingIndicator');
  typingEl.style.display = 'flex';

  // Track repeated questions (sentiment detection feature)
  const frequency = trackQuestion(userText);
  const isStressed = detectSentiment(userText);

  // If repeated 3 times or stressed → add escalation note
  let extraContext = '';
  if (frequency >= 3) {
    extraContext = '\n\nNOTE: Student has asked about this topic multiple times. Gently suggest connecting with a human counselor.';
  }
  if (isStressed) {
    extraContext += '\n\nNOTE: Student seems stressed or confused. Be extra warm and supportive. Offer to connect with a counselor.';
  }

  try {
    // Check if API key is set
    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      // Demo mode — use pre-written responses
      typingEl.style.display = 'none';
      const demoResponse = getDemoResponse(userText);
      addMessage(demoResponse, 'bot');
      return;
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: STUDENT_CONTEXT + extraContext + '\n\nStudent message: ' + userText + '\n\nRespond in a helpful, friendly way. Use HTML formatting like <strong> for important points. Keep response under 200 words.'
            }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
        })
      }
    );

    const data = await response.json();
    typingEl.style.display = 'none';

    if (data.candidates && data.candidates[0]) {
      const botReply = data.candidates[0].content.parts[0].text;
      addMessage(botReply, 'bot');
    } else {
      addMessage('Sorry, I had trouble connecting. Please try again! 🔄', 'bot');
    }

  } catch (error) {
    typingEl.style.display = 'none';
    // Fallback to demo responses
    const demoResponse = getDemoResponse(userText);
    addMessage(demoResponse, 'bot');
  }

  // Proactive reminder if fee-related
  if (userText.toLowerCase().includes('fee') || userText.toLowerCase().includes('payment')) {
    setTimeout(() => {
      showToast('⚡ Reminder: Fee payment deadline is Feb 20!');
    }, 2000);
  }
}

// Demo responses for when API key is not set
function getDemoResponse(text) {
  const t = text.toLowerCase();

  if (t.includes('document') || t.includes('marksheet') || t.includes('certificate')) {
    return `📄 <strong>Document Agent here!</strong><br><br>
    For Computer Engineering admission, you need:<br>
    1. 10th & 12th Marksheets (originals + 4 copies)<br>
    2. Aadhar Card (original + 2 copies)<br>
    3. Caste Certificate (if applicable)<br>
    4. 10 passport-size photos<br>
    5. LC/TC from previous school<br>
    6. Medical fitness certificate<br><br>
    ✅ You've already submitted your documents! You're good. 🎉`;
  }

  if (t.includes('fee') || t.includes('payment') || t.includes('tuition')) {
    return `💰 <strong>Financial Agent here!</strong><br><br>
    Your fee payment is <strong>due in 2 days (Feb 20)!</strong> 🚨<br><br>
    <strong>Steps to pay online:</strong><br>
    1. Go to <strong>tcet.ac.in/fees</strong><br>
    2. Login with Roll No: CE2024001<br>
    3. Select "First Year Tuition Fee"<br>
    4. Pay via UPI, Net Banking, or Card<br>
    5. Download the receipt immediately<br><br>
    Amount: ₹1,20,000 (or check your admission letter)<br>
    ⚠️ Late payment = ₹500/day penalty. Pay today!`;
  }

  if (t.includes('hostel') || t.includes('room') || t.includes('allocation')) {
    return `🏠 <strong>Hostel Agent here!</strong><br><br>
    As a hostel student, here's what you need to do:<br><br>
    1. Fill the <strong>Hostel Preference Form</strong> at tcet.ac.in/hostel (due Feb 28)<br>
    2. Select room type: Single (₹8,000/month) or Shared (₹6,000/month)<br>
    3. Upload: Medical certificate + Parent consent form<br>
    4. Mention roommate preferences if any<br><br>
    Room allocation happens in order of form submission.<br>
    <strong>Tip:</strong> Submit early for better room choices! 🏆`;
  }

  if (t.includes('course') || t.includes('registration') || t.includes('timetable')) {
    return `📚 <strong>Academic Agent here!</strong><br><br>
    Course registration for Sem 1 is due <strong>Feb 25</strong>.<br><br>
    <strong>Steps:</strong><br>
    1. Login to <strong>erp.tcet.ac.in</strong><br>
    2. Go to Academic → Course Registration<br>
    3. Your courses are pre-assigned for Sem 1 (CE branch)<br>
    4. Confirm registration and submit<br><br>
    <strong>Sem 1 subjects include:</strong> Engineering Maths, Physics, C Programming, Engineering Drawing, Communication Skills<br><br>
    Timetable will be visible after registration ✅`;
  }

  if (t.includes('lms') || t.includes('moodle') || t.includes('online')) {
    return `💻 <strong>Academic Agent here!</strong><br><br>
    LMS (Learning Management System) setup:<br><br>
    1. Go to <strong>lms.tcet.ac.in</strong><br>
    2. Click "First-time Login"<br>
    3. Username: your roll number (CE2024001)<br>
    4. Password: your date of birth (DDMMYYYY)<br>
    5. Enroll in your Sem 1 courses<br><br>
    LMS has: lecture notes, assignments, video lectures & announcements.<br>
    <strong>Complete LMS setup by Mar 1!</strong> 📅`;
  }

  if (t.includes('scholarship') || t.includes('financial aid') || t.includes('income')) {
    return `💰 <strong>Financial Agent here!</strong><br><br>
    Scholarship options available:<br><br>
    🎓 <strong>Government Scholarships:</strong> Family income < ₹8 lakhs/year<br>
    📊 <strong>Merit Scholarship:</strong> >85% in 12th std<br>
    🏛️ <strong>SC/ST/OBC:</strong> Additional state government schemes<br><br>
    <strong>Apply at:</strong> mahadbt.maharashtra.gov.in<br>
    <strong>Documents needed:</strong> Income certificate, caste certificate, bank passbook, marksheets<br><br>
    Deadline: Usually 30 days after admission. Apply ASAP! ⚡`;
  }

  if (t.includes('mentor') || t.includes('senior') || t.includes('peer') || t.includes('connect')) {
    return `🤝 <strong>Mentor Agent here!</strong><br><br>
    We'll connect you with:<br><br>
    👨‍🏫 <strong>Faculty Mentor:</strong> Prof. assigned from CE department — you'll meet in Week 2<br>
    👩‍🎓 <strong>Senior Peer Mentor:</strong> A 3rd year CE student who'll guide you<br>
    🏘️ <strong>Study Group:</strong> Batch WhatsApp group will be shared after course registration<br><br>
    Want me to send a connection request to a senior mentor from Computer Engineering? Just say <strong>"Yes, connect me"</strong> 😊`;
  }

  if (t.includes('confused') || t.includes('stressed') || t.includes('overwhelmed') || t.includes('help')) {
    return `💙 <strong>I hear you, Mansi!</strong><br><br>
    It's completely normal to feel overwhelmed during onboarding — you're handling a lot at once!<br><br>
    Let me make it simple. Your <strong>3 most important tasks RIGHT NOW</strong> are:<br>
    1. 🔴 Pay fee by <strong>Feb 20</strong> (2 days!)<br>
    2. 🟡 Register courses by <strong>Feb 25</strong><br>
    3. 🟡 Fill hostel form by <strong>Feb 28</strong><br><br>
    Everything else can wait. Want me to walk you through any of these step-by-step?<br><br>
    Also, our counselor <strong>Ms. Sharma</strong> is available at ext. 4521 if you need human support. You've got this! 💪`;
  }

  return `🤖 <strong>CampusConnect Agent here!</strong><br><br>
  I can help you with: documents, fee payment, course registration, hostel allocation, LMS setup, scholarships, and mentoring.<br><br>
  Your current priority: <strong>Fee payment is due in 2 days!</strong> 🚨<br><br>
  What would you like to know more about?`;
}

// Keyboard shortcut
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.getElementById('chatInput') && document.getElementById('chatInput').blur();
  }
});

// Initialize — show proactive alert on load
window.addEventListener('load', () => {
  setTimeout(() => {
    showToast('🚨 Proactive Alert: Fee payment due in 2 days!');
  }, 2000);
});