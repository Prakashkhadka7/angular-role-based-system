const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Read database
const getDB = () => {
  const dbPath = path.join(__dirname, 'mock-server', 'db.json');
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

const saveDB = (data) => {
  const dbPath = path.join(__dirname, 'mock-server', 'db.json');
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Auth endpoints
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.username === username && u.password === password && u.isActive);
  
  if (user) {
    const role = db.roles.find(r => r.id === user.roleId);
    const permissions = db.permissions.filter(permission => role.permissions.find(rolePermission => rolePermission.id === permission.id));
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        role: role,
        permissions: permissions
      }
    });
  } else {
    res.status(401).json({
      message: 'Invalid username or password'
    });
  }
});

app.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Users endpoints
app.get('/users', (req, res) => {
  const db = getDB();
  const usersWithRoles = db.users.map(user => {
    const role = db.roles.find(r => r.id === user.roleId);
    return { ...user, role };
  });
  res.json(usersWithRoles);
});

app.get('/api/users', (req, res) => {
  const db = getDB();
  const usersWithRoles = db.users.map(user => {
    const role = db.roles.find(r => r.id === user.roleId);
    return { ...user, role };
  });
  res.json(usersWithRoles);
});

app.get('/users/:id', (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    const role = db.roles.find(r => r.id === user.roleId);
    const permissions = role ? db.permissions.filter(p => role.permissions.includes(p.id)) : [];
    res.json({ ...user, role, permissions });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.post('/users', (req, res) => {
  const db = getDB();
  const newUser = {
    id: Math.max(...db.users.map(u => u.id)) + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    isActive: true,
    isSuperAdmin: false
  };
  
  db.users.push(newUser);
  saveDB(db);
  
  const role = db.roles.find(r => r.id === newUser.roleId);
  res.status(201).json({ ...newUser, role });
});

app.put('/users/:id', (req, res) => {
  const db = getDB();
  const userId = parseInt(req.params.id);
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    db.users[userIndex] = { ...db.users[userIndex], ...req.body, id: userId };
    saveDB(db);
    
    const role = db.roles.find(r => r.id === db.users[userIndex].roleId);
    res.json({ ...db.users[userIndex], role });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.delete('/users/:id', (req, res) => {
  const db = getDB();
  const userId = parseInt(req.params.id);
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    if (db.users[userIndex].isSuperAdmin) {
      return res.status(400).json({ message: 'Cannot delete super admin user' });
    }
    
    db.users.splice(userIndex, 1);
    saveDB(db);
    res.json({ message: 'User deleted successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Roles endpoints
app.get('/roles', (req, res) => {
  const db = getDB();
  const rolesWithDetails = db.roles.map(role => {
    const userCount = db.users.filter(u => u.roleId === role.id).length;
    const permissions = db.permissions.filter(p => role.permissions.includes(p.id));
    return {
      ...role,
      userCount,
      permissionCount: permissions.length,
      permissionDetails: permissions
    };
  });
  res.json(rolesWithDetails);
});

app.get('/api/roles', (req, res) => {
  const db = getDB();
  const rolesWithDetails = db.roles.map(role => {
    const userCount = db.users.filter(u => u.roleId === role.id).length;
    const permissions = db.permissions.filter(p => role.permissions.includes(p.id));
    return {
      ...role,
      userCount,
      permissionCount: permissions.length,
      permissionDetails: permissions
    };
  });
  res.json(rolesWithDetails);
});

app.post('/roles', (req, res) => {
  const db = getDB();
  const newRole = {
    id: Math.max(...db.roles.map(r => r.id)) + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    isSystem: false
  };
  
  db.roles.push(newRole);
  saveDB(db);
  
  const permissions = db.permissions.filter(p => newRole.permissions.includes(p.id));
  res.status(201).json({
    ...newRole,
    userCount: 0,
    permissionCount: permissions.length,
    permissionDetails: permissions
  });
});

// Permissions endpoints
app.get('/permissions', (req, res) => {
  const db = getDB();
  res.json(db.permissions);
});

app.get('/api/permissions', (req, res) => {
  const db = getDB();
  res.json(db.permissions);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mock RBAC API Server',
    endpoints: [
      'POST /auth/login',
      'POST /auth/logout',
      'GET /users',
      'GET /roles', 
      'GET /permissions'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /auth/login');
  console.log('- GET /users, /roles, /permissions');
  console.log('- Full CRUD operations supported');
});