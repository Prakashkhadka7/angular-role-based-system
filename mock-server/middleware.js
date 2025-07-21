const fs = require('fs');
const path = require('path');

module.exports = (req, res, next) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  // Get database
  const dbPath = path.join(__dirname, 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Auth endpoints
  if (req.url === '/auth/login' && req.method === 'POST') {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username && u.password === password && u.isActive);
    
    if (user) {
      const role = db.roles.find(r => r.id === user.roleId);
      const permissions = db.permissions.filter(p => role.permissions.includes(p.id));
      
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
        success: false,
        message: 'Invalid username or password'
      });
    }
    return;
  }

  // Logout endpoint
  if (req.url === '/auth/logout' && req.method === 'POST') {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    return;
  }

  // Refresh token endpoint
  if (req.url === '/auth/refresh' && req.method === 'POST') {
    res.json({
      success: true,
      token: 'mock-jwt-token-refreshed-' + Date.now()
    });
    return;
  }

  // Check username availability
  if (req.url.startsWith('/api/users/check-username/') && req.method === 'GET') {
    const username = req.url.split('/').pop();
    const exists = db.users.some(u => u.username === username);
    res.json({
      available: !exists,
      username: username
    });
    return;
  }

  // Get user with role and permissions
  if (req.url.match(/^\/api\/users\/\d+$/) && req.method === 'GET') {
    const userId = parseInt(req.url.split('/').pop());
    const user = db.users.find(u => u.id === userId);
    
    if (user) {
      const role = db.roles.find(r => r.id === user.roleId);
      const permissions = role ? db.permissions.filter(p => role.permissions.includes(p.id)) : [];
      
      res.json({
        ...user,
        role: role,
        permissions: permissions
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
    return;
  }

  // Get all users with roles
  if (req.url === '/api/users' && req.method === 'GET') {
    const usersWithRoles = db.users.map(user => {
      const role = db.roles.find(r => r.id === user.roleId);
      return {
        ...user,
        role: role
      };
    });
    res.json(usersWithRoles);
    return;
  }

  // Create user
  if (req.url === '/api/users' && req.method === 'POST') {
    const newUser = {
      id: Math.max(...db.users.map(u => u.id)) + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      isActive: true,
      isSuperAdmin: false
    };
    
    db.users.push(newUser);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    const role = db.roles.find(r => r.id === newUser.roleId);
    res.status(201).json({
      ...newUser,
      role: role
    });
    return;
  }

  // Update user
  if (req.url.match(/^\/api\/users\/\d+$/) && req.method === 'PUT') {
    const userId = parseInt(req.url.split('/').pop());
    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      db.users[userIndex] = {
        ...db.users[userIndex],
        ...req.body,
        id: userId // Ensure ID doesn't change
      };
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      
      const role = db.roles.find(r => r.id === db.users[userIndex].roleId);
      res.json({
        ...db.users[userIndex],
        role: role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
    return;
  }

  // Delete user
  if (req.url.match(/^\/api\/users\/\d+$/) && req.method === 'DELETE') {
    const userId = parseInt(req.url.split('/').pop());
    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      if (db.users[userIndex].isSuperAdmin) {
        res.status(400).json({ message: 'Cannot delete super admin user' });
        return;
      }
      
      db.users.splice(userIndex, 1);
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
    return;
  }

  // Get role with permissions
  if (req.url.match(/^\/api\/roles\/\d+$/) && req.method === 'GET') {
    const roleId = parseInt(req.url.split('/').pop());
    const role = db.roles.find(r => r.id === roleId);
    
    if (role) {
      const permissions = db.permissions.filter(p => role.permissions.includes(p.id));
      res.json({
        ...role,
        permissionDetails: permissions
      });
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
    return;
  }

  // Get all roles with permission counts
  if (req.url === '/api/roles' && req.method === 'GET') {
    const rolesWithDetails = db.roles.map(role => {
      const userCount = db.users.filter(u => u.roleId === role.id).length;
      const permissions = db.permissions.filter(p => role.permissions.includes(p.id));
      
      return {
        ...role,
        userCount: userCount,
        permissionCount: permissions.length,
        permissionDetails: permissions
      };
    });
    res.json(rolesWithDetails);
    return;
  }

  // Create role
  if (req.url === '/api/roles' && req.method === 'POST') {
    const newRole = {
      id: Math.max(...db.roles.map(r => r.id)) + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      isSystem: false
    };
    
    db.roles.push(newRole);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    const permissions = db.permissions.filter(p => newRole.permissions.includes(p.id));
    res.status(201).json({
      ...newRole,
      userCount: 0,
      permissionCount: permissions.length,
      permissionDetails: permissions
    });
    return;
  }

  // Update role
  if (req.url.match(/^\/api\/roles\/\d+$/) && req.method === 'PUT') {
    const roleId = parseInt(req.url.split('/').pop());
    const roleIndex = db.roles.findIndex(r => r.id === roleId);
    
    if (roleIndex !== -1) {
      db.roles[roleIndex] = {
        ...db.roles[roleIndex],
        ...req.body,
        id: roleId // Ensure ID doesn't change
      };
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      
      const userCount = db.users.filter(u => u.roleId === roleId).length;
      const permissions = db.permissions.filter(p => db.roles[roleIndex].permissions.includes(p.id));
      
      res.json({
        ...db.roles[roleIndex],
        userCount: userCount,
        permissionCount: permissions.length,
        permissionDetails: permissions
      });
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
    return;
  }

  // Delete role
  if (req.url.match(/^\/api\/roles\/\d+$/) && req.method === 'DELETE') {
    const roleId = parseInt(req.url.split('/').pop());
    const roleIndex = db.roles.findIndex(r => r.id === roleId);
    
    if (roleIndex !== -1) {
      const usersWithRole = db.users.filter(u => u.roleId === roleId);
      if (usersWithRole.length > 0) {
        res.status(400).json({ 
          message: 'Cannot delete role. Users are assigned to this role.',
          userCount: usersWithRole.length
        });
        return;
      }
      
      if (db.roles[roleIndex].isSystem) {
        res.status(400).json({ message: 'Cannot delete system role' });
        return;
      }
      
      db.roles.splice(roleIndex, 1);
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      res.json({ message: 'Role deleted successfully' });
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
    return;
  }

  // Continue to json-server
  next();
};