# Student Portal MVP Architecture

Perfect — let’s build a **working Student Portal MVP (React)** with:

* Dashboard
* Submit Report
* Upload Logbook
* View Feedback
* Navigation

This will be a **simple but functional frontend** you can run immediately.

---

## 📁 Folder Structure

```text
frontend/
│── src/
│   │── pages/
│   │   ├── Dashboard.js
│   │   ├── SubmitReport.js
│   │   ├── UploadLogbook.js
│   │   ├── Feedback.js
│   │
│   │── components/
│   │   ├── Navbar.js
│   │
│   │── App.js
│   │── index.js
│
│── package.json
```

---

## 1️⃣ Install Required Packages

Run:

```bash
npm install react-router-dom
```

---

## 2️⃣ App.js (Main Routing)

```javascript
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import SubmitReport from "./pages/SubmitReport";
import UploadLogbook from "./pages/UploadLogbook";
import Feedback from "./pages/Feedback";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/submit-report" element={<SubmitReport />} />
        <Route path="/upload-logbook" element={<UploadLogbook />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 3️⃣ Navbar.js

```javascript
import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#333" }}>
      <Link to="/" style={{ color: "#fff", marginRight: "10px" }}>Dashboard</Link>
      <Link to="/submit-report" style={{ color: "#fff", marginRight: "10px" }}>Submit Report</Link>
      <Link to="/upload-logbook" style={{ color: "#fff", marginRight: "10px" }}>Logbook</Link>
      <Link to="/feedback" style={{ color: "#fff" }}>Feedback</Link>
    </nav>
  );
}

export default Navbar;
```

---

## 4️⃣ Dashboard.js

```javascript
import React from "react";

function Dashboard() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, Student 👋</h2>
      <p>Status: Ongoing</p>

      <div>
        <button onClick={() => window.location.href="/submit-report"}>
          Submit Report
        </button>

        <button onClick={() => window.location.href="/upload-logbook"}>
          Upload Logbook
        </button>

        <button onClick={() => window.location.href="/feedback"}>
          View Feedback
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
```

---

## 5️⃣ SubmitReport.js

```javascript
import React, { useState } from "react";

function SubmitReport() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Title:", title);
    console.log("File:", file);

    alert("Report submitted successfully (MVP)");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Submit Report</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Report Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <br /><br />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <br /><br />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default SubmitReport;
```

---

## 6️⃣ UploadLogbook.js

```javascript
import React, { useState } from "react";

function UploadLogbook() {
  const [week, setWeek] = useState("");
  const [file, setFile] = useState(null);

  const handleUpload = (e) => {
    e.preventDefault();

    console.log("Week:", week);
    console.log("File:", file);

    alert("Logbook uploaded (MVP)");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Logbook</h2>

      <form onSubmit={handleUpload}>
        <input
          type="number"
          placeholder="Week Number"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          required
        />
        <br /><br />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <br /><br />

        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default UploadLogbook;
```

---

## 7️⃣ Feedback.js

```javascript
import React from "react";

function Feedback() {
  const feedbacks = [
    { id: 1, comment: "Good work, improve formatting." },
    { id: 2, comment: "Add more details to your report." }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Supervisor Feedback</h2>

      {feedbacks.map((f) => (
        <div key={f.id} style={{ marginBottom: "10px" }}>
          <p>{f.comment}</p>
        </div>
      ))}
    </div>
  );
}

export default Feedback;
```

---

## ▶️ Run Your Project

```bash
npm start
```

---

## 🚀 What You Have Now

✔ Dashboard
✔ Report submission (frontend)
✔ Logbook upload
✔ Feedback display
✔ Navigation

👉 This is a **complete Student MVP frontend**

---

## 🔥 NEXT STEP (VERY IMPORTANT)

Now you should:

1. Connect this to a backend (Node.js / Express)
2. Store uploads (Cloudinary / Firebase / local server)
3. Deploy it (Vercel)

---

## If you want next, I can

* 🔌 Connect this to a backend (FULL working system)
* 🌐 Show you how to deploy it live
* 🎨 Upgrade the UI to look professional

Just say: **“connect backend”** or **“deploy it”** 🚀
