# 💰 Expense Tracker MVP

A full-featured **Expense Tracker Web Application** built with **React 18**, **Node.js (Express)**, and **MongoDB** — designed for tracking personal expenses, generating reports, and analyzing spending patterns.

---

## 📝 Project Description

The **Expense Tracker MVP** is a full-stack web application designed to help users efficiently **manage, analyze, and visualize their personal expenses**. Built using **React 18**, **Node.js**, and **MongoDB**, it delivers a seamless and secure expense-tracking experience with **JWT authentication**, **Excel-like CRUD operations**, and **PDF export functionality**.

Users can add, edit, and delete expenses, view **monthly summaries**, and compare spending trends between months. The system automatically calculates **totals, averages, and percentage changes**, providing a clear financial overview.

A polished **glassmorphism UI** with responsive design ensures an elegant and intuitive experience across devices.  
All core functionalities work flawlessly, though chart visualization is temporarily affected due to **React 18 and Recharts compatibility issues**, which are currently under resolution.

This project demonstrates strong proficiency in **frontend development, backend integration, and data visualization**, showcasing the ability to build production-grade, user-centric analytical tools.

---

## 🚀 Features Overview

✅ **Authentication & Security**
- JWT-based register / login
- Protected routes for user data
- Secure password hashing with bcrypt

✅ **Expense Management**
- Excel-like expense sheet for each month  
- Full CRUD operations (Add, Edit, Delete)
- Category-wise grouping & filtering

✅ **Analytics & Reporting**
- Month-to-month expense comparison
- Automatic percentage difference calculation
- Export to PDF with full expense breakdown
- Stats cards showing totals, averages, and count

✅ **UI / UX**
- Responsive glassmorphism design  
- Smooth transitions & polished layout  
- Cormorant Garamond typography  
- Dark / light friendly styling

✅ **Performance**
- Modular REST API with 15 fully functional endpoints  
- Optimized state management with React Hooks  
- Error-handled backend with async/await

---

## 📊 Known Issue: Chart Rendering (React 18 × Recharts 3.2.1)

The **chart containers and data load correctly**, but **Recharts SVG elements fail to render** because of a compatibility issue between React 18’s concurrent rendering and Recharts v3.2.1.

### 🔍 Investigation Summary
- DOM containers and chart titles (e.g. *Expense Distribution*, *Daily Trend*) appear.
- No visual SVG output from `<PieChart>`, `<BarChart>`, or `<LineChart>`.
- Confirmed reproducible in both dev & build modes.

### 🧪 Work-in-Progress Fix Options
1. Ensure charts render **client-side only** (lazy import inside `useEffect`).
2. **Downgrade** Recharts to `v2.12.3`.
3. **Migrate** to an alternative such as:
   - [`react-chartjs-2`](https://www.npmjs.com/package/react-chartjs-2)
   - [`Nivo`](https://nivo.rocks/)
   - [`ECharts for React`](https://github.com/hustcc/echarts-for-react)

> All other functionality — including CRUD operations, authentication, PDF export, and comparisons — works flawlessly.

---

## 🧰 Tech Stack

| Layer | Technology |
|:------|:------------|
| **Frontend** | React 18, TailwindCSS, Axios, Recharts (→ to be replaced) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (JSON Web Token), bcrypt |
| **PDF Export** | jsPDF, html2canvas |
| **Deployment** | Vercel / Render (optional) |

---

## 📦 Folder Structure

```

expense-tracker/
├── client/              # React front end
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── server/              # Express back end
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── server.js
└── README.md

````

---

## ⚡ Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/expense-tracker-mvp.git
cd expense-tracker-mvp
````

### 2️⃣ Install Dependencies

```bash
# Install client & server packages
cd client && npm install
cd ../server && npm install
```

### 3️⃣ Environment Variables

Create a `.env` file in `/server`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 4️⃣ Run the App

```bash
# Start backend
cd server && npm start

# In a new terminal: start frontend
cd client && npm run dev
```

The app runs on `http://localhost:5173` (Vite) and connects to `http://localhost:5000` API.

---

## 🧾 PDF Export Preview

* Generates a **detailed breakdown** of expenses by category
* Includes totals, averages, and date-range summaries
* Clean layout suitable for download or printing

---

## 🧠 Future Enhancements

* ✅ Fix chart rendering (React 18 compatibility)
* 💡 AI-powered “Spending Insights” recommendations
* 📈 Budget goals & monthly savings tracking
* ☁️ Cloud storage for uploaded receipts
* 🔔 Email notifications for overspending

---

## 📸 Screenshots

|             Dashboard            |           Comparison View          |          PDF Export         |
| :------------------------------: | :--------------------------------: | :-------------------------: |
| ![Dashboard](docs/dashboard.png) | ![Comparison](docs/comparison.png) | ![PDF](docs/pdf-export.png) |

---

## 🧑‍💻 Author

**Junnuri Mohan Karthikeya**
📧 [junnurimohankarthikeya@gmail.com](mailto:junnurimohankarthikeya@gmail.com)
🔗 [LinkedIn](https://www.linkedin.com/in/karthikeya-mohan-6a8141261/) • [GitHub](https://github.com/karthikk2403)

---

## 🪪 License

This project is licensed under the **MIT License** – free for personal and commercial use.

---

### ⭐ If you like this project, give it a star on GitHub — it helps me grow as a developer!

```

---

Would you like me to **add badges (React, Node, MongoDB, License, Deployment, etc.)** at the top for a more **professional GitHub visual look**?
```
