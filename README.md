# Hinahon-Catc

---

## 🔑 Core Requirements Recap

1. **Authentication**

   * Use **Microsoft login (school-issued accounts)**.
   * Students and faculty sign in using their university email.

2. **User Flow**

   * After login → user clicks *“How do you feel?”* button → chooses an emoji.
   * Two paths:

     * **Online consultation** → Booking page → Choose date, time, counselor → Wait for confirmation email + video link.
     * **Articles** → Redirect to emotion-specific resources.

3. **Counselor Dashboard**

   * View incoming requests (accept/reject).
   * Manage/edit availability.
   * View history (accepted/rejected).

4. **Admin Dashboard**

   * Manage user accounts (CRUD).
   * Manage article contents (editable text + optional images).

---

## 🛠️ Tech Approach with **Bolt + Replit AI**

Since your goal is to use **Bolt** (no-code/low-code + AI-driven builder) and **Replit AI** (code autocompletion, debugging, hosting), here’s a practical approach:

---

### 1. **Authentication**

* Use **Microsoft Azure AD OAuth2 / MSAL** (Microsoft Authentication Library).
* **Bolt**: You can scaffold UI screens for login, then connect with **Azure AD login API**.
* **Replit AI**: Help you integrate the MSAL SDK in backend (Node.js/Express).

👉 This ensures **only school emails** can log in.

---

### 2. **Frontend Flow**

* **Bolt** excels at UI mockups → you already have designs, so feed them into Bolt to auto-generate pages:

  * `Login → Emoji Selection → Online Consultation OR Articles`.
* Use **state management** (React Context or Redux if needed).
* **UI stack**: React + Tailwind CSS (Bolt is strong here).
* **Emoji Selection**:

  * Simple component: a set of emojis mapped to emotional states.
  * Redirect logic handled in frontend.

---

### 3. **Booking System**

* Store **consultation requests** in database.
* **Flow**:

  1. User submits request → store in DB as *pending*.
  2. Counselor gets dashboard notification → Accept/Reject.
  3. If accepted → trigger **email notification** with video link.

     * Could integrate **Daily.co** or **MS Teams/Zoom API** for video.
* **Bolt**: Use it to generate UI for booking form, counselor selection, and calendar view.
* **Replit AI**: Assist with backend logic (Express.js endpoints, MongoDB schema, CRUD).

---

### 4. **Counselor Dashboard**

* Components needed:

  * Pending Requests (with Accept/Reject buttons).
  * Manage Availability (calendar UI).
  * Consultation History (table with accepted/rejected).
* **Bolt**: Scaffold dashboard UI.
* **Replit AI**: Handle API endpoints + DB queries.

---

### 5. **Admin Dashboard**

* CRUD for **users** and **articles**.
* Articles:

  * Better to use **editable text with image uploads** (instead of only static images).
  * Store in MongoDB (`title, content, imageURL, emotionTag`).
* **Bolt**: Auto-generate admin table UIs and article editor page.
* **Replit AI**: Backend + rich text editor integration (e.g., Quill.js, TinyMCE).

---

### 6. **Backend (with Replit AI)**

* **Stack**: Node.js + Express.js + MongoDB Atlas.
* Models:

  * `User (role: student/counselor/admin)`
  * `Consultation (status: pending/accepted/rejected, date, time, counselorId, studentId)`
  * `Article (emotionTag, title, content, imageUrl)`
  * `Availability (counselorId, scheduleSlots)`
* **Replit AI** can:

  * Generate schema boilerplates.
  * Create REST APIs quickly (`/bookings`, `/articles`, `/users`, `/availability`).
  * Add JWT/session handling on top of Microsoft login.

---

### 7. **Hosting & Workflow**

* **Replit** → Great for development + quick deployments.
* **Bolt** → Perfect for **scaffolding** UI quickly from your mockup designs.
* Final setup:

  * Frontend (Bolt → export React project).
  * Backend (Replit with Node/Express).
  * Database (MongoDB Atlas).
  * Auth (Microsoft AD).
  * Video Conferencing (Daily.co API or Teams).

---

## 🚀 Step-by-Step Execution Plan

1. **Auth Setup First**
   Implement Microsoft login → restrict to school emails.
2. **Frontend Pages with Bolt**
   Build `Login → Emoji → Consultation/Articles`.
3. **Database Models with Replit AI**
   Define `User, Consultation, Article, Availability`.
4. **Booking Flow**
   User booking → Counselor dashboard → Email confirmations.
5. **Admin Panel**
   Manage users + articles.
6. **Video Integration**
   Add Daily.co or MS Teams links into confirmation emails.

---

✅ **Bolt** = Your **UI builder** (rapid prototyping).
✅ **Replit AI** = Your **backend assistant** (DB, APIs, auth, email, video integration).

---
