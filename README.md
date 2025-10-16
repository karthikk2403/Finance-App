# 💰 Expense Tracker MVP

A full-featured **Expense Tracker Web Application** built with **React 18**, **Node.js (Express)**, and **MongoDB** — designed for tracking personal expenses, generating reports, and analyzing spending patterns.

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

