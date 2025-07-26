# Angular Role-Based System

This is a role-based access control system built with Angular and a mock backend using Express and JSON Server.

## 📦 Features

- Angular 20 with standalone API
- Role-based access (Super Admin, Manager, etc.)
- User management (list, add, delete)
- Mock backend with JWT authentication

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Prakashkhadka7/angular-role-based-system.git
cd angular-role-based-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App (Client + Mock Server)

```bash
npm run dev
```

This runs:
- Angular app at `http://localhost:4200`
- Mock API at `http://localhost:3001`

---

## 📂 Available Scripts

| Script         | Description                     |
|----------------|---------------------------------|
| `npm run dev`  | Start Angular + mock server     |
| `client-only`  | Run Angular app only            |
| `server-only`  | Run mock server only            |

---

## 📁 Project Structure

```
mock-server/       # Express + JSON Server setup
src/app/           # Angular source code
 └── auth/         # Authentication & guards
 └── core/         # Services & interceptors
 └── features/     # Feature modules like user-management,role-management
```

---

## 🔐 Login Info (Sample)

| Role        | Username     | Password     |
|-------------|--------------|--------------|
| Super Admin | superadmin   | admin123     |
| Manager     | manager      | manager123   |

---

## 🛠 Tech Stack

- Angular 20 (Standalone)
- Angular Material
- JSON Server + Express
- JWT for auth

---


