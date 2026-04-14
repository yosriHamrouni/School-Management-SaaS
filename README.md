# 🎓 Academic Management Platform

![Laravel](https://img.shields.io/badge/Laravel-10.x-red?logo=laravel)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql)
![Inertia.js](https://img.shields.io/badge/Inertia.js-Bridge-purple)
![License](https://img.shields.io/badge/License-Academic-lightgrey)

---

## 📌 Description

This application is an academic management platform built with **Laravel**, **Inertia.js**, and **React**.
It allows managing institutions, users, and roles within a multi-actor system.

The project provides a scalable foundation for building a complete educational platform.

---

## 🖼️ Screenshots

> 📌 Add your screenshots in a `/screenshots` folder in your project

### 🔐 Authentication

![Login](screenshots/login.png)

### 📊 Dashboard

![Dashboard](screenshots/dashboard.png)

### 👥 Users Management

![Users](screenshots/users.png)

### 🏫 Establishments Management

![Establishments](screenshots/establishments.png)

---

## 🧱 Architecture

```text
            ┌───────────────────────┐
            │      Frontend         │
            │   React + Inertia     │
            └──────────┬────────────┘
                       │
                       ▼
            ┌───────────────────────┐
            │       Backend         │
            │       Laravel         │
            │ Controllers / Logic   │
            └──────────┬────────────┘
                       │
                       ▼
            ┌───────────────────────┐
            │      Database         │
            │     PostgreSQL        │
            └───────────────────────┘
```

---

## 🚀 Technologies Used

### Backend

* Laravel
* PHP
* PostgreSQL

### Frontend

* React (with Inertia.js)
* TypeScript
* Tailwind CSS

### Other

* Inertia.js (Laravel ↔ React bridge)
* RBAC (Role-Based Access Control)

---

## 🔐 Core Features

### 👥 User Management

* Full CRUD for users
* Role assignment
* Association with an establishment
* Data validation

### 🏫 Establishment Management

* Full CRUD for establishments
* Activate / deactivate establishments
* Search and pagination

### 🔑 Roles & Permissions (RBAC)

* Role creation and management
* Permission assignment
* Role-based middleware access control

### 📊 Role-Based Dashboards

* Platform Admin Dashboard
* Teacher Dashboard
* Student Dashboard

### 🔒 Security

* Authentication
* Role-based authorization
* Protected routes

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd project-name
```

### 2. Install dependencies

```bash
composer install
npm install
```

### 3. Environment setup

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

---

### 4. Run migrations and seeders

```bash
php artisan migrate --seed
```

---

### 5. Start the application

```bash
php artisan serve
npm run dev
```

---

## 📂 Project Structure

```text
app/
 ├── Models/
 ├── Http/
 │    ├── Controllers/
 │    ├── Middleware/
 │    ├── Requests/
resources/js/
 ├── Pages/
 ├── Components/
database/
 ├── migrations/
 ├── seeders/
```

---

## 📈 Project Status

✔ Authentication
✔ RBAC (roles & permissions)
✔ User management
✔ Establishment management
✔ Dashboards

🔜 Next Steps:

* Academic structure (levels, classes, subjects)
* Grades & evaluations
* Notifications
* AI features

---

## 👨‍💻 Author

Developed as part of a final-year internship project (PFE).

---

## 📄 License

Academic use only.
