const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken"); // You'll need to install this: npm install jsonwebtoken

const app = express();
const PORT = 3001;
const JWT_SECRET = "your-secret-key"; // In production, use environment variable

// Middleware
app.use(cors());
app.use(express.json());

// Read database
const getDB = () => {
  const dbPath = path.join(__dirname, "mock-server", "db.json");
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
};

const saveDB = (data) => {
  const dbPath = path.join(__dirname, "mock-server", "db.json");
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Role hierarchy helper function
const canAccessUser = (currentUser, targetUser, targetRole) => {
  // Super admin can access everyone
  if (currentUser.isSuperAdmin) {
    return true;
  }

  // Regular users cannot access super admin accounts
  if (targetUser.isSuperAdmin) {
    return false;
  }

  // Get current user's role priority
  const currentUserRole = currentUser?.roleId
    ? getDB().roles.find((r) => r.id === currentUser.roleId)
    : currentUser?.role;
  const currentUserPriority = currentUserRole?.priority;
  const targetUserPriority = targetRole?.priority;

  // Users can only access users with equal or lower priority (higher number)
  // Priority 1 = highest (Super Admin), Priority 4 = lowest (Viewer)
  return currentUserPriority <= targetUserPriority;
};

// Role hierarchy helper function
const canAccessRole = (currentUser, targetRole) => {
  // Super admin can access all roles
  if (currentUser.isSuperAdmin) {
    return true;
  }

  // Get current user's role priority
  const currentUserRole = currentUser?.roleId
    ? getDB().roles.find((r) => r.id === currentUser.roleId)
    : currentUser?.role;
  const currentUserPriority = currentUserRole?.priority;
  const targetRolePriority = targetRole?.priority;

  // Users can only access roles with equal or lower priority (higher number)
  // Priority 1 = highest (Super Admin), Priority 4 = lowest (Viewer)
  return currentUserPriority <= targetRolePriority;
};

// Filter users based on role hierarchy
const filterUsersByHierarchy = (currentUser, users, roles) => {
  return users.filter((user) => {
    const userRole = roles.find((r) => r.id === user.roleId);
    return canAccessUser(currentUser, user, userRole);
  });
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    // For mock token, extract user info differently
    if (token.startsWith("mock-jwt-token-")) {
      // In a real app, you'd verify the JWT properly
      // For now, we'll get user from the token and validate against DB
      const db = getDB();
      const tokenUser = req.headers["x-user-id"]; // You'd include this in your client requests
      const rawId = tokenUser;
      const userId = /^\d+$/.test(rawId) ? Number(rawId) : rawId;
      const user = db.users.find((u) => u.id === userId && u.isActive);

      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid token or user not found" });
      }

      const role = db.roles.find((r) => r.id === user.roleId);
      const permissions = db.permissions.filter((permission) =>
        role.permissions.find(
          (rolePermission) => rolePermission.id === permission.id
        )
      );

      req.user = { ...user, role, permissions };
      next();
    } else {
      return res.status(401).json({ message: "Invalid token format" });
    }
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Role-based authorization middleware
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Super admin can access everything
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Check if user has required role
    const userRole = req.user.role.name.toLowerCase();
    const hasRequiredRole = requiredRoles.some(
      (role) => userRole === role.toLowerCase()
    );

    if (!hasRequiredRole) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${requiredRoles.join(
          ", "
        )}. Your role: ${req.user.role.name}`,
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Super admin can access everything
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Check if user has required permissions
    const userPermissions = req.user.permissions.map((p) =>
      p.name.toLowerCase()
    );
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission.toLowerCase())
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        message: `Access denied. Required permission(s): ${requiredPermissions.join(
          ", "
        )}`,
      });
    }

    next();
  };
};

// Enhanced resource ownership check with hierarchy
const checkResourceOwnership = (req, res, next) => {
  const rawId = req.params.id;
  // Check if it's purely numeric (e.g., '34'), then convert to number
  const resourceUserId = /^\d+$/.test(rawId) ? Number(rawId) : rawId;
  const currentUserId = req.user.id;
  const db = getDB();

  // Find the target user and their role
  const targetUser = db.users.find((u) => u.id === resourceUserId);

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const targetRole = db.roles.find((r) => r.id === targetUser.roleId);

  // Check if current user can access target user based on hierarchy
  if (canAccessUser(req.user, targetUser, targetRole)) {
    return next();
  }

  // Allow users to access their own resources
  if (resourceUserId === currentUserId) {
    return next();
  }

  return res.status(403).json({
    message:
      "Access denied. You can only access users within your role hierarchy or your own resources.",
  });
};

// Enhanced login with proper token
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const user = db.users.find(
    (u) => u.username === username && u.password === password && u.isActive
  );

  if (user) {
    const role = db.roles.find((r) => r.id === user.roleId);
    const permissions = db.permissions.filter((permission) =>
      role.permissions.find(
        (rolePermission) => rolePermission.id === permission.id
      )
    );

    // Create a more structured token (in production, use proper JWT)
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        role: role,
        permissions: permissions,
      },
    });
  } else {
    res.status(401).json({
      message: "Invalid username or password",
    });
  }
});

app.post("/auth/logout", authenticateToken, (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// Protected Users endpoints - with hierarchy filtering
app.get(
  "/users",
  authenticateToken,
  requireRole(["Manager", "Admin"]),
  (req, res) => {
    const db = getDB();

    // Get users associated to the logged in user
    const tokenUser = req.headers["x-user-id"];
    const rawId = tokenUser;
    const currentUser = db.users.find((u) => u.id === Number(rawId));
    const isSuperAdmin = currentUser?.isSuperAdmin ?? false;

    const accessibleUsers = isSuperAdmin
      ? db.users
      : db.users.filter((user) => user.createdBy?.id === Number(rawId));

    const usersWithRoles = accessibleUsers.map((user) => {
      const role = db.roles.find((r) => r.id === user.roleId);
      return { ...user, role };
    });

    res.json(usersWithRoles);
  }
);

// Get specific user - with hierarchy check
app.get("/users/:id", authenticateToken, checkResourceOwnership, (req, res) => {
  const db = getDB();
  const user = db.users.find(
    (u) => u.id === parseInt(req.params.id) && u.createdBy === req.user.id
  );
  if (user) {
    const role = db.roles.find((r) => r.id === user.roleId);
    const permissions = role
      ? db.permissions.filter((p) =>
          role.permissions.some((rp) => rp.id === p.id)
        )
      : [];
    res.json({ ...user, role, permissions });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// Create user - with hierarchy restrictions
app.post(
  "/users",
  authenticateToken,
  requireRole(["Manager", "Admin"]),
  (req, res) => {
    const db = getDB();

    // Prevent non-super-admins from creating super admin users
    if (req.body.isSuperAdmin && !req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Only super admins can create super admin users" });
    }

    // Check if user can create users with the specified role
    if (req.body.roleId) {
      const targetRole = db.roles.find((r) => r.id === req.body.roleId);
      if (targetRole) {
        // Users can only create users with roles at their level or below
        if (
          req.user.role.priority > targetRole.priority &&
          !req.user.isSuperAdmin
        ) {
          return res.status(403).json({
            message: `You cannot create users with ${targetRole.name} role. You can only create users with roles at your level or below.`,
          });
        }
      }
    }

    const existingUser = db.users.find((u) => u.username === req.body.username);
    if (existingUser) {
      return res
        .status(400)
        .json({
          message: `Username '${req.body.username}' is already in use.`,
        });
    }

    const newUser = {
      id: Math.max(...db.users.map((u) => u.id)) + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      isActive: true,
      isSuperAdmin: req.body.isSuperAdmin || false,
      createdBy: req.user,
    };

    db.users.push(newUser);
    saveDB(db);

    const role = db.roles.find((r) => r.id === newUser.roleId);
    res.status(201).json({ ...newUser, role });
  }
);

// Update user - with hierarchy check
app.put("/users/:id", authenticateToken, checkResourceOwnership, (req, res) => {
  const db = getDB();
  const rawId = req.params.id;
  // Check if it's purely numeric (e.g., '34'), then convert to number
  const userId = /^\d+$/.test(rawId) ? Number(rawId) : rawId;
  const userIndex = db.users.findIndex((u) => u.id === userId);

  if (userIndex !== -1) {
    const existingUser = db.users[userIndex];

    // Prevent non-super-admins from modifying super admin status
    if ("isSuperAdmin" in req.body && !req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Only super admins can modify super admin status" });
    }

    // Check role change permissions
    if (req.body.roleId && req.body.roleId !== existingUser.roleId) {
      const newRole = db.roles.find((r) => r.id === req.body.roleId);
      const existingRole = db.roles.find((r) => r.id === existingUser.roleId);

      if (newRole && !req.user.isSuperAdmin) {
        // Users can only assign roles at their level or below
        if (req.user.role.priority > newRole.priority) {
          return res.status(403).json({
            message: `You cannot assign ${newRole.name} role. You can only assign roles at your level or below.`,
          });
        }

        // Users cannot modify roles above their level
        if (req.user.role.priority > existingRole.priority) {
          return res.status(403).json({
            message: `You cannot modify users with ${existingRole.name} role.`,
          });
        }
      }

      // Prevent users from escalating their own privileges
      if (userId === req.user.id && newRole.priority < req.user.role.priority) {
        return res
          .status(403)
          .json({ message: "You cannot elevate your own role" });
      }
    }

    // Remove user name from update
    const { username, ...updatedUser } = req.body;
    db.users[userIndex] = {
      ...db.users[userIndex],
      ...updatedUser,
      id: userId,
    };
    saveDB(db);

    const role = db.roles.find((r) => r.id === db.users[userIndex].roleId);
    res.json({ ...db.users[userIndex], role });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// Delete user - with hierarchy restrictions
app.delete(
  "/users/:id",
  authenticateToken,
  requireRole(["Manager", "Admin"]),
  (req, res) => {
    const db = getDB();
    const rawId = req.params.id;
    // Check if it's purely numeric (e.g., '34'), then convert to number
    const userId = /^\d+$/.test(rawId) ? Number(rawId) : rawId;

    const userIndex = db.users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
      const targetUser = db.users[userIndex];
      const targetRole = db.roles.find((r) => r.id === targetUser.roleId);

      // Cannot delete super admin
      if (targetUser.isSuperAdmin) {
        return res
          .status(400)
          .json({ message: "Cannot delete super admin user" });
      }

      // Prevent users from deleting themselves
      if (userId === req.user.id) {
        return res
          .status(400)
          .json({ message: "You cannot delete your own account" });
      }

      // Check hierarchy permissions
      if (!canAccessUser(req.user, targetUser, targetRole)) {
        return res.status(403).json({
          message: "You can only delete users within your role hierarchy",
        });
      }

      db.users.splice(userIndex, 1);
      saveDB(db);
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  }
);

// Protected Roles endpoints - filter roles based on hierarchy
app.get(
  "/roles",
  authenticateToken,
  requireRole(["Manager", "Admin"]),
  (req, res) => {
    const db = getDB();

    // Filter roles based on user's hierarchy level
    let accessibleRoles = db.roles;

    if (!req.user.isSuperAdmin) {
      // Users can only see roles at their level or below
      accessibleRoles = db.roles.filter(
        (role) => req.user.role.priority <= role.priority
      );
    }

    const rolesWithDetails = accessibleRoles.map((role) => {
      const userCount = db.users.filter((u) => u.roleId === role.id).length;
      const permissions = db.permissions.filter((p) =>
        role.permissions.some((rp) => rp.id === p.id)
      );
      return {
        ...role,
        userCount,
        permissionCount: permissions.length,
        permissionDetails: permissions,
      };
    });

    res.json(rolesWithDetails);
  }
);

app.get(
  "/api/roles",
  authenticateToken,
  requireRole(["Manager", "Admin"]),
  (req, res) => {
    const db = getDB();

    // Filter roles based on user's hierarchy level
    let accessibleRoles = db.roles;

    if (!req.user.isSuperAdmin) {
      // Users can only see roles at their level or below
      accessibleRoles = db.roles.filter(
        (role) => req.user.role.priority <= role.priority
      );
    }

    const rolesWithDetails = accessibleRoles.map((role) => {
      const userCount = db.users.filter((u) => u.roleId === role.id).length;
      const permissions = db.permissions.filter((p) =>
        role.permissions.some((rp) => rp.id === p.id)
      );
      return {
        ...role,
        userCount,
        permissionCount: permissions.length,
        permissionDetails: permissions,
      };
    });

    res.json(rolesWithDetails);
  }
);

// Delete role - Managers and Admins only
app.delete(
  "/roles/:id",
  authenticateToken,
  requireRole(["Manager", "Admin"]),
  (req, res) => {
    const db = getDB();
    const rawId = req.params.id;
    const roleId = /^\d+$/.test(rawId) ? Number(rawId) : rawId;

    const roleIndex = db.roles.findIndex((r) => r.id === roleId);

    if (roleIndex !== -1) {
      const targetRole = db.roles[roleIndex];

      // Prevent users from deleting super admin role
      if (targetRole.name === "Super Admin") {
        return res
          .status(400)
          .json({ message: "Cannot delete Super Admin role" });
      }

      // Check hierarchy permissions
      if (!canAccessUser(req.user, targetRole, targetRole)) {
        return res.status(403).json({
          message: "You can only delete roles within your role hierarchy",
        });
      }

      db.roles.splice(roleIndex, 1);
      saveDB(db);
      res.json({ message: "Role deleted successfully" });
    } else {
      res.status(404).json({ message: "Role not found" });
    }
  }
);

// Create role - Managers and Admins only
app.post(
  "/roles",
  authenticateToken,
  requireRole(["Manager", "Admin"]),
  (req, res) => {
    const db = getDB();

    // Only super admins can create roles with priority 1 (which is itself)
    if (req.body.priority === 1 && !req.user.isSuperAdmin) {
      return res.status(403).json({
        message:
          "Only super admins can create roles with priority 1 (which is itself)",
      });
    }

    // Users can only create roles at their level or below
    if (
      req.body.priority &&
      req.body.priority < req.user.role.priority &&
      !req.user.isSuperAdmin
    ) {
      return res.status(403).json({
        message:
          "You can only create roles at your level or below in the hierarchy",
      });
    }

    const newRole = {
      id: Math.max(...db.roles.map((r) => r.id)) + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      isSystem: false,
    };

    db.roles.push(newRole);
    saveDB(db);

    const permissions = db.permissions.filter((p) =>
      newRole.permissions.some((rp) => rp.id === p.id)
    );
    res.status(201).json({
      ...newRole,
      userCount: 0,
      permissionCount: permissions.length,
      permissionDetails: permissions,
    });
  }
);

// Update role - with hierarchy restrictions
app.put(
  "/roles/:id",
  authenticateToken,
  requireRole(["Manager", "Admin"]),
  (req, res) => {
    const db = getDB();
    const rawId = req.params.id;
    // Check if it's purely numeric (e.g., '34'), then convert to number
    const roleId = /^\d+$/.test(rawId) ? Number(rawId) : rawId;

    const roleIndex = db.roles.findIndex((r) => r.id === roleId);

    if (roleIndex === -1) {
      return res.status(404).json({ message: "Role not found" });
    }

    const targetRole = db.roles[roleIndex];
    const targetRolePermissions = targetRole.permissions || [];
    // Prevent non-super-admins from modifying super admin roles
    if (
      targetRole.isSystem &&
      !req.user.isSuperAdmin &&
      req.body.priority === 1
    ) {
      return res.status(403).json({
        message: "Only super admins can modify super admin roles",
      });
    }

    // Check hierarchy permissions
    if (!canAccessRole(req.user, targetRole)) {
      return res.status(403).json({
        message:
          "You can only modify roles within your role hierarchy. Your role: " +
          req.user.role.name,
      });
    }

    // Prevent users from escalating their own privileges
    if (
      roleId === req.user.roleId &&
      req.body.priority < req.user.role.priority
    ) {
      return res.status(403).json({
        message: "You cannot elevate your own role",
      });
    }

    // Update role
    db.roles[roleIndex] = { ...db.roles[roleIndex], ...req.body, id: roleId };
    saveDB(db);

    const rolePermissions = db.permissions.filter((p) =>
      db.roles[roleIndex].permissions.some((rp) => rp.id === p.id)
    );
    res.json({
      ...db.roles[roleIndex],
      permissionCount: rolePermissions.length,
      permissionDetails: rolePermissions,
    });
  }
);

// Permissions endpoints - accessible by authenticated users
app.get("/permissions", authenticateToken, (req, res) => {
  const db = getDB();
  res.json(db.permissions);
});

app.get("/api/permissions", authenticateToken, (req, res) => {
  const db = getDB();
  res.json(db.permissions);
});

// Profile endpoint - users can view their own profile
app.get("/profile", authenticateToken, (req, res) => {
  res.json({
    user: req.user,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Mock RBAC API Server with Role Hierarchy",
    endpoints: [
      "POST /auth/login",
      "POST /auth/logout (requires auth)",
      "GET /users (requires Manager/Admin role, filtered by hierarchy)",
      "GET /roles (requires Manager/Admin role, filtered by hierarchy)",
      "GET /permissions (requires auth)",
      "GET /profile (requires auth)",
    ],
    hierarchy:
      "Users can only see and manage users/roles at their level or below in the hierarchy",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(
    `Mock server with role hierarchy running on http://localhost:${PORT}`
  );
  console.log("Role Hierarchy:");
  console.log("1. Super Admin (priority 1) - Can access everyone");
  console.log("2. Manager (priority 2) - Can access Manager, Employee, Viewer");
  console.log("3. Employee (priority 3) - Can access Employee, Viewer");
  console.log("4. Viewer (priority 4) - Can access only Viewer");
  console.log("\nSample request headers for authenticated requests:");
  console.log("Authorization: Bearer mock-jwt-token-{userId}-{timestamp}");
  console.log("x-user-id: {userId}");
});
