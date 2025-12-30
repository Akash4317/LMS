# 🎓 Learning Management System (LMS) – MERN Stack

A **full-stack, role-based Learning Management System (LMS)** built using the **MERN stack**, designed to simulate a **real-world education platform** used by institutes, teachers, students, and parents.

This project focuses on **scalable architecture, clean RBAC implementation, and production-grade backend design**, making it suitable as a **portfolio project for software engineers**.

---

## ✨ Key Highlights

- Multi-role system (**Super Admin, Admin/Teacher, Student, Parent**)
- Secure **JWT-based authentication & authorization**
- **Role-Based Access Control (RBAC)** enforced on backend & frontend
- Modular, scalable **feature-based architecture**
- Realistic LMS workflows (courses, syllabus, lectures, attendance, assignments)
- Clean UI dashboards per role
- Built with **performance, security, and maintainability in mind**

---

## 🧠 User Roles

### Super Admin
- Manage institutes
- Platform-level visibility
- User & institute oversight

### Admin / Teacher
- Create & manage courses
- Design syllabus and curriculum
- Upload recorded lectures
- Schedule live classes
- Mark attendance
- Create & grade assignments

### Student
- Enroll in courses
- Access recorded lectures
- Join live classes
- Submit assignments
- Track attendance & progress

### Parent
- Monitor linked student’s:
  - Attendance
  - Assignments
  - Course progress  
- Read-only access

---

## 🛠 Tech Stack

### Frontend
- React.js (Vite)
- TypeScript
- Tailwind CSS
- React Router
- Redux Toolkit / Zustand
- TanStack Query

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (Access & Refresh Tokens)
- bcrypt
- Multer
- Cloudinary / AWS S3
- Socket.io

---

## 📦 Core Features

- 🔐 Authentication & Authorization
- 🏫 Institute Management
- 📚 Course & Syllabus Builder
- 🎥 Recorded Lecture Uploads
- 🧑‍🏫 Live Class Scheduling
- 📋 Attendance Management
- 📝 Assignments & Submissions
- 👨‍👩‍👧 Parent Monitoring Dashboard
- 🔔 Real-time Notifications (Socket.io)

---

## 🧱 Architecture Overview

### Backend
- Feature-based modular structure
- RESTful APIs
- RBAC middleware
- Centralized error handling
- Secure file upload abstraction
- MongoDB indexing for performance

### Frontend
- Role-based routing
- Protected routes
- Modular components
- Clean state management
- API caching using React Query

---

## 📁 Project Structure
```
/client
└── src
├── components
├── pages
├── features
├── hooks
├── routes
└── services

/server
└── src
├── modules
├── models
├── controllers
├── routes
├── middlewares
├── utils
└── config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB
- Cloudinary / AWS S3 account (for media uploads)

---

### Backend Setup

```bash
cd lms-server
npm install
npm run dev
```

### create a .env file
```
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
```

### setup
```
cd client / server
npm install
npm run dev
```

## 🔐 Security Practices

- Password hashing using **bcrypt**
- Token-based authentication using **JWT**
- Role-based API guards (**RBAC**)
- Secure file upload handling
- Environment-based configuration using `.env`

---

## 📈 Why This Project?

This LMS was built to demonstrate:

- Real-world **RBAC** implementation
- Clean and scalable **backend architecture**
- Well-structured and scalable **MongoDB schema design**
- Thoughtful **separation of concerns**
- Practical **MERN stack expertise**

It reflects how production applications are **designed, not just built**.

---

## 🔮 Future Enhancements

- Quiz & exam engine
- Certificate generation
- Payment integration
- Advanced progress analytics
- AI-based learning recommendations

---

## 👨‍💻 Author

**Akash Yadav**  
Full-Stack Developer (MERN)  
Focused on building scalable, real-world web applications.

---

⭐ If you find this project useful, feel free to star the repo!

