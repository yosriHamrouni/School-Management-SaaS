# 🎓 Academic Management Platform

<p align="center">
  <strong>Intelligent SaaS platform for school management</strong>
</p>

<p align="center">
  A complete web platform designed to centralize academic, administrative and pedagogical management within educational institutions.
</p>

<p align="center">

![Laravel](https://img.shields.io/badge/Laravel-10.x-FF2D20?logo=laravel\&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?logo=php\&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react\&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript\&logoColor=white)
![Inertia.js](https://img.shields.io/badge/Inertia.js-Bridge-9553E9)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql\&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python\&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss\&logoColor=white)

</p>

---

## 📌 Overview

**Academic Management Platform** is a full-stack web application developed as part of a Final-Year Project (PFE).

The platform aims to provide educational institutions with a centralized solution for managing academic and administrative activities while offering dedicated interfaces for different user roles.

The system follows a **multi-tenant architecture**, allowing multiple educational institutions to use the same platform while keeping their data logically isolated.

The project also introduces intelligent features, including an **explainable student risk detection module** based on academic and attendance data, combining a rule-based engine with an experimental Machine Learning integration.

---

## 🎯 Objectives

The main objectives of the project were to:

* Centralize academic and administrative data.
* Provide role-based access to different users.
* Ensure strict data isolation between institutions.
* Simplify day-to-day school management.
* Provide dashboards and academic reporting.
* Automate PDF and Excel report generation.
* Improve communication between school actors.
* Exploit academic data to identify students who may require additional support.
* Build a maintainable and scalable architecture.

---

## 👥 User Roles

The platform supports several actors with dedicated permissions and interfaces:

| Role                 | Main responsibilities                                            |
| -------------------- | ---------------------------------------------------------------- |
| 🛡️ Platform Admin   | Manage and supervise educational institutions                    |
| 🏫 Institution Admin | Manage users, academic structure and school data                 |
| 👨‍🏫 Teacher        | Manage classes, grades, attendance, schedules and assignments    |
| 🎓 Student           | Access schedules, assignments and available academic information |
| 👨‍👩‍👧 Parent      | Monitor information related to their child                       |
| 🤖 AI Services       | Analyze academic data and provide intelligent assistance         |

---

## ✨ Main Features

### 🔐 Authentication & Authorization

* Secure authentication
* Role-Based Access Control (RBAC)
* Protected routes
* Role-based redirection
* Server-side validation
* Permission management

### 🏢 Multi-Tenant Management

* Institution management
* Institution activation/deactivation
* Data isolation by institution
* Institution-scoped users and academic data
* Tenant-aware authorization

### 👥 User Management

* User CRUD operations
* Role assignment
* Profile management
* Association with an institution
* Server-side validation

### 📚 Academic Management

* Academic years
* Levels
* Classes
* Subjects
* Teachers
* Students
* Parents
* Teacher/class assignments

### 📅 Schedule Management

* Interactive calendar
* Class schedules
* Teacher schedules
* Schedule conflict detection
* Schedule filtering

### 📝 Grades & Evaluations

* Evaluation management
* Grade entry
* Grade organization by class and subject
* Academic data reuse for reporting and risk analysis

### 🟢 Attendance Management

* Attendance recording
* Present / absent / late statuses
* Attendance history
* Academic follow-up
* Data integration with the risk detection module

### 📖 Assignments

* Assignment creation
* Assignment tracking
* Student access to assignments
* Submission management

### 📊 Academic Reporting

* Academic dashboards
* Statistics and indicators
* Performance analysis
* Class and subject analysis
* Teacher-related statistics
* PDF exports
* Excel exports

### 💬 Communication

* Internal messaging
* Notifications
* Interaction history

### 💰 Finance Module

A partial financial module was implemented as a foundation for future extensions:

* Fee types
* Invoices
* Payments
* Basic payment tracking

### 🤖 Intelligent Student Risk Detection

The platform includes an explainable student risk detection module.

The analysis uses academic and attendance indicators such as:

* General average
* Number of absences
* Number of late arrivals
* Number of subjects with low performance
* Performance trends

The intelligent module combines:

**Rule-Based Engine → ML Prediction → Fallback**

The rule-based engine provides an interpretable risk score and explanatory reasons.

An experimental Machine Learning integration is available through a Python service. If the ML model or Python execution is unavailable, the system automatically falls back to the rule-based analysis.

This approach ensures that an ML integration failure does not interrupt the main application.

### 🧠 Academic Assistant

The platform also includes a secured academic assistant designed to answer questions using a context limited to the data accessible to the authenticated user.

The assistant supports:

* Role-aware access
* Restricted academic context
* Interaction history
* Rule-based responses
* Optional local AI provider integration

---

## 🏗️ Architecture

The application follows a modern client-server architecture:

```text
                        ┌─────────────────────┐
                        │       Browser       │
                        │   React + TypeScript│
                        └──────────┬──────────┘
                                   │
                                   │ Inertia.js
                                   ▼
                        ┌─────────────────────┐
                        │       Laravel       │
                        │      Backend        │
                        ├─────────────────────┤
                        │ Controllers         │
                        │ Middleware          │
                        │ Form Requests       │
                        │ Services            │
                        │ Eloquent Models     │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌──────────────────┐          ┌──────────────────┐
          │   PostgreSQL     │          │   Python / ML    │
          │    Database      │          │     Service      │
          └──────────────────┘          └──────────────────┘
                                                   │
                                                   ▼
                                         Risk Prediction Model
```

### Application layers

**Frontend**

* React
* TypeScript
* Inertia.js
* Tailwind CSS

**Backend**

* Laravel
* PHP
* Eloquent ORM
* Middleware
* Form Requests
* Business Services

**Database**

* PostgreSQL

**Intelligent Services**

* Python
* Machine Learning
* Rule-based analysis
* Fallback mechanism

---

## 🧠 AI / Machine Learning Pipeline

The student risk detection pipeline follows several steps:

```text
Student Academic Data
        │
        ▼
┌──────────────────────┐
│ Data Extraction      │
│ Grades / Attendance  │
│ Delays / Subjects    │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Feature Engineering  │
│ Average              │
│ Absences             │
│ Delays               │
│ Difficult Subjects   │
│ Performance Trend    │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Rule-Based Engine    │
│ Explainable Score    │
│ Risk Reasons         │
└──────────┬───────────┘
           │
           ▼
     ML Available?
       /       \
     YES        NO
      │          │
      ▼          │
 Python / ML     │
 Prediction      │
      │          │
      └────┬─────┘
           ▼
┌──────────────────────┐
│ Final Risk Analysis  │
│ Score + Risk Level   │
│ + Explanations       │
└──────────────────────┘
```

The Machine Learning component is considered **experimental**, as its effectiveness depends on the quantity and quality of available historical data.

The rule-based engine therefore remains the functional reference and guarantees service continuity.

---

## 🗃️ Main Data Model

The platform is structured around several core entities:

```text
User
 ├── Role
 ├── Establishment
 └── Profile
      ├── Student
      ├── Teacher
      └── Parent

Establishment
 ├── Academic Years
 ├── Levels
 ├── Classes
 ├── Subjects
 └── Users

Academic Data
 ├── Schedules
 ├── Evaluations
 ├── Grades
 ├── Attendance
 ├── Assignments
 └── Submissions

Communication
 ├── Messages
 └── Notifications

Intelligence
 ├── Student Risk Analysis
 └── Academic Assistant

Finance
 ├── Fee Types
 ├── Invoices
 └── Payments
```

---

## 🖼️ Screenshots

> Screenshots of the main interfaces are available in the `/screenshots` directory.

### 🔐 Authentication

![Login](screenshots/login.png)

### 📊 Administrator Dashboard

![Dashboard](screenshots/dashboard.png)

### 👥 User & Role Management

![Users](screenshots/users.png)

### 🏫 Establishment Management

![Establishments](screenshots/establishments.png)

### 📅 Schedule Management

![Schedules](screenshots/schedules.png)

### 📝 Grade Management

![Grades](screenshots/grades.png)

### 🟢 Attendance Management

![Attendance](screenshots/attendance.png)

### 📊 Academic Reporting

![Reporting](screenshots/reporting.png)

### 🤖 Student Risk Detection

![Risk Detection](screenshots/risk-detection.png)

### 🧠 Academic Assistant

![Academic Assistant](screenshots/academic-assistant.png)

---

## 🛠️ Technology Stack

### Backend

* **Laravel 10**
* **PHP**
* **Eloquent ORM**
* **Laravel Fortify**

### Frontend

* **React 18**
* **TypeScript**
* **Inertia.js**
* **Tailwind CSS**
* **FullCalendar React**

### Database

* **PostgreSQL**

### AI / ML

* **Python**
* **scikit-learn**
* Rule-based analysis
* Experimental ML prediction
* Automatic fallback

### Testing

* **Pest**
* **PHPUnit**

### Reporting & Export

* **DomPDF**
* **Laravel Excel**

### Development & Project Management

* **Git**
* **GitHub**
* **Taiga**

### Local AI

* **Ollama** — optional local provider for the academic assistant

---

## 🧪 Testing

The application was validated through both manual and automated testing.

The testing strategy covers:

* Authentication
* Role-based authorization
* Multi-tenant data isolation
* User management
* Grade management
* Attendance management
* Messaging
* Notifications
* PDF/Excel exports
* AI risk analysis
* ML fallback mechanism
* Responsive interfaces

Automated tests were implemented using **Pest/PHPUnit** for critical application behaviors and access rules.

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd academic-management-platform
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Install frontend dependencies

```bash
npm install
```

### 4. Configure the environment

```bash
cp .env.example .env
php artisan key:generate
```

Configure PostgreSQL in `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=your_database
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

### 5. Run migrations and seeders

```bash
php artisan migrate --seed
```

### 6. Start the backend

```bash
php artisan serve
```

### 7. Start the frontend development server

```bash
npm run dev
```

The application should now be available at:

```text
http://127.0.0.1:8000
```

---

## 📂 Project Structure

```text
academic-management-platform/
│
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   │
│   ├── Models/
│   └── Services/
│
├── database/
│   ├── migrations/
│   └── seeders/
│
├── resources/
│   └── js/
│       ├── Components/
│       ├── Pages/
│       └── Layouts/
│
├── ml/
│   ├── models/
│   └── scripts/
│
├── routes/
│
├── tests/
│
├── screenshots/
│
├── public/
│
└── README.md
```

---

## 🔒 Security & Data Isolation

Security was considered as a core aspect of the platform.

The application implements:

* Authentication
* Role-Based Access Control
* Protected routes
* Server-side validation
* Middleware-based authorization
* Tenant-aware data filtering
* Restricted access to academic information
* User-specific academic context for the assistant

The multi-tenant architecture ensures that users interact only with data belonging to their authorized institution.

---

## 📈 Project Status

### ✅ Completed

* [x] Authentication
* [x] Role-Based Access Control
* [x] Multi-tenant architecture
* [x] Institution management
* [x] User and role management
* [x] Academic years
* [x] Levels and classes
* [x] Subjects
* [x] Teacher and student management
* [x] Schedule management
* [x] Evaluations and grades
* [x] Attendance management
* [x] Assignments and submissions
* [x] Teacher portal
* [x] Student portal
* [x] Parent portal
* [x] Academic reporting
* [x] PDF / Excel exports
* [x] Internal messaging
* [x] Notifications
* [x] Partial finance module
* [x] Student risk detection
* [x] Rule-based risk engine
* [x] Experimental ML integration
* [x] ML fallback mechanism
* [x] Academic assistant
* [x] Automated tests

---

## 🚀 Future Improvements

Although the main project scope has been completed, several improvements could extend the platform:

* 🔹 Improve the ML model using a larger historical dataset.
* 🔹 Evaluate the ML model using standardized performance metrics.
* 🔹 Introduce a secure RAG architecture for the academic assistant.
* 🔹 Add real-time notifications.
* 🔹 Extend the financial module with advanced dashboards and payment integration.
* 🔹 Develop a mobile application or PWA.
* 🔹 Increase automated test coverage.
* 🔹 Prepare a production-ready cloud deployment architecture.

---

## 🎓 Academic Context

This project was developed as part of a **Projet de Fin d’Études (PFE)** during the **2025–2026 academic year**.

The project focused on the complete software development lifecycle:

```text
Requirements
     ↓
Functional Analysis
     ↓
Technical Analysis
     ↓
System Design
     ↓
Development
     ↓
AI / ML Integration
     ↓
Testing
     ↓
Validation
```

The project involved the design and implementation of a complete school management platform while addressing real-world concerns such as **security, multi-tenancy, maintainability, scalability and intelligent data analysis**.

---

## 👨‍💻 Author

**Yosri Hamrouni**

Full-Stack Developer | Laravel • React • TypeScript • PostgreSQL • Python

Developed as part of a Final-Year Project (PFE), 2025–2026.

---

## 📄 License

This project was developed for **academic and educational purposes**.
