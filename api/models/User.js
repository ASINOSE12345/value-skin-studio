// Modelo de Usuario Administrador - Supabase + Fallback en memoria
const bcrypt = require('bcryptjs');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// ============================================
// ALMACENAMIENTO EN MEMORIA (FALLBACK)
// ============================================
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);

let memoryUsers = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'admin',
    password: ADMIN_PASSWORD_HASH,
    email: 'admin@valueskinstudio.com',
    first_name: 'Admin',
    last_name: 'Sistema',
    avatar: null,
    role: 'superadmin',
    permissions: ['*'],
    active: true,
    last_login: null,
    refresh_token: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ============================================
// CLASE USER
// ============================================
class User {
  // Obtener todos los usuarios
  static async getAll() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, username, email, first_name, last_name, avatar, role, permissions, active, last_login, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    return memoryUsers.map(u => {
      const { password, refresh_token, password_reset_token, password_reset_expires, ...userWithoutSensitive } = u;
      return userWithoutSensitive;
    });
  }

  // Buscar por ID
  static async findById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryUsers.find(u => u.id === id);
  }

  // Buscar por username
  static async findByUsername(username) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryUsers.find(u => u.username === username);
  }

  // Buscar por email
  static async findByEmail(email) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryUsers.find(u => u.email === email);
  }

  // Crear usuario
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      first_name: userData.firstName || userData.first_name || null,
      last_name: userData.lastName || userData.last_name || null,
      avatar: userData.avatar || null,
      role: userData.role || 'admin',
      permissions: userData.permissions || [],
      active: userData.active !== undefined ? userData.active : true
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(newUser)
        .select('id, username, email, first_name, last_name, avatar, role, permissions, active, created_at')
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const memoryUser = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newUser,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryUsers.push(memoryUser);

    const { password, ...userWithoutPassword } = memoryUser;
    return userWithoutPassword;
  }

  // Actualizar usuario
  static async update(id, updateData) {
    const updates = {};

    if (updateData.username !== undefined) updates.username = updateData.username;
    if (updateData.email !== undefined) updates.email = updateData.email;
    if (updateData.password) updates.password = await bcrypt.hash(updateData.password, 10);
    if (updateData.firstName !== undefined) updates.first_name = updateData.firstName;
    if (updateData.lastName !== undefined) updates.last_name = updateData.lastName;
    if (updateData.first_name !== undefined) updates.first_name = updateData.first_name;
    if (updateData.last_name !== undefined) updates.last_name = updateData.last_name;
    if (updateData.avatar !== undefined) updates.avatar = updateData.avatar;
    if (updateData.role !== undefined) updates.role = updateData.role;
    if (updateData.permissions !== undefined) updates.permissions = updateData.permissions;
    if (updateData.active !== undefined) updates.active = updateData.active;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, username, email, first_name, last_name, avatar, role, permissions, active, created_at, updated_at')
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback en memoria
    const index = memoryUsers.findIndex(u => u.id === id);
    if (index === -1) return null;

    memoryUsers[index] = {
      ...memoryUsers[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { password, ...userWithoutPassword } = memoryUsers[index];
    return userWithoutPassword;
  }

  // Eliminar usuario
  static async delete(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryUsers.findIndex(u => u.id === id);
    if (index === -1) return false;

    memoryUsers.splice(index, 1);
    return true;
  }

  // Validar password
  static async validatePassword(username, inputPassword) {
    const user = await this.findByUsername(username);

    if (!user || !user.password) {
      return null;
    }

    if (!user.active) {
      return null;
    }

    const isValid = await bcrypt.compare(inputPassword, user.password);
    if (!isValid) return null;

    // Actualizar last_login
    await this.updateLastLogin(user.id);

    const { password, refresh_token, password_reset_token, password_reset_expires, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  }

  // Actualizar ultimo login
  static async updateLastLogin(id) {
    if (isSupabaseConfigured()) {
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id);
    } else {
      const index = memoryUsers.findIndex(u => u.id === id);
      if (index !== -1) {
        memoryUsers[index].last_login = new Date().toISOString();
      }
    }
  }

  // Guardar refresh token
  static async updateRefreshToken(id, refreshToken) {
    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ refresh_token: refreshToken })
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    const index = memoryUsers.findIndex(u => u.id === id);
    if (index === -1) return false;

    memoryUsers[index].refresh_token = refreshToken;
    return true;
  }

  // Buscar por refresh token
  static async findByRefreshToken(refreshToken) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('refresh_token', refreshToken)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryUsers.find(u => u.refresh_token === refreshToken);
  }

  // Generar y guardar token de reset de password
  static async setPasswordResetToken(email, token, expires) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          password_reset_token: token,
          password_reset_expires: expires.toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const index = memoryUsers.findIndex(u => u.email === email);
    if (index === -1) return null;

    memoryUsers[index].password_reset_token = token;
    memoryUsers[index].password_reset_expires = expires.toISOString();
    return memoryUsers[index];
  }

  // Buscar por token de reset
  static async findByResetToken(token) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('password_reset_token', token)
        .gt('password_reset_expires', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    return memoryUsers.find(u =>
      u.password_reset_token === token &&
      new Date(u.password_reset_expires) > new Date()
    );
  }

  // Resetear password
  static async resetPassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          password: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null
        })
        .eq('id', id)
        .select('id, username, email')
        .single();

      if (error) throw error;
      return data;
    }

    const index = memoryUsers.findIndex(u => u.id === id);
    if (index === -1) return null;

    memoryUsers[index].password = hashedPassword;
    memoryUsers[index].password_reset_token = null;
    memoryUsers[index].password_reset_expires = null;

    return { id: memoryUsers[index].id, username: memoryUsers[index].username, email: memoryUsers[index].email };
  }

  // Cambiar password
  static async changePassword(id, currentPassword, newPassword) {
    const user = await this.findById(id);
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return { success: false, message: 'Contraseña actual incorrecta' };

    await this.resetPassword(id, newPassword);
    return { success: true };
  }

  // Contar usuarios
  static async count() {
    if (isSupabaseConfigured()) {
      const { count, error } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count;
    }

    return memoryUsers.length;
  }

  // ============================================
  // ALIAS METHODS (compatibilidad con seeds)
  // ============================================
  static async getByEmail(email) {
    return this.findByEmail(email);
  }

  static async getById(id) {
    return this.findById(id);
  }

  static async getByUsername(username) {
    return this.findByUsername(username);
  }
}

module.exports = User;
