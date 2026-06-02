# QuestHub 🎯

QuestHub is a modern, minimalist smart quiz platform designed for interactive learning and group play. Featuring a sleek monochrome UI, real-time buzzer rounds, and comprehensive analytics, QuestHub makes knowledge sharing engaging and efficient.

## ✨ Features

- **Minimalist Design**: A clean, monochrome light-mode UI for distraction-free learning.
- **Interactive Quiz Modes**: 
  - **Standard Mode**: Classic quiz experience with instant feedback.
  - **Buzzer Mode**: Real-time group play with live synchronization.
- **Admin Dashboard**: Comprehensive control over subjects, quizzes, and user management.
- **Analytics & Performance**: Track user performance with beautiful charts powered by Recharts.
- **Real-time Synchronization**: Powered by Socket.io for seamless multiplayer modules.
- **Secure Authentication**: JWT-based authentication system.

## 🚀 Tech Stack

### Frontend
- **React 19**
- **Vite** (Build Tool)
- **React Router 7** (Routing)
- **Recharts** (Data Visualization)
- **Socket.io Client** (Real-time features)
- **Axios** (API communication)

### Backend
- **Node.js & Express**
- **MongoDB & Mongoose** (Database)
- **Socket.io** (WebSocket Server)
- **JSON Web Tokens (JWT)** (Security)
- **Bcryptjs** (Password hashing)

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB account (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/Questhub.git
cd Questhub
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the environment variables needed:
   ```env
   PORT=8080
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:5173
   ```
4. Seed the database (optional):
   ```bash
   npm run seed
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:8080/api
   VITE_SOCKET_URL=http://localhost:8080
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📸 Screenshots

*(Add your screenshots here)*

## 📄 License
This project is licensed under the MIT License.

## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

---
Built with ❤️ by [Your Name/Team]
