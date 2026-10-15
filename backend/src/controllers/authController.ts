import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getOne, QueryResult } from '../database/db';
import { JWT_SECRET } from '../middleware/auth';
import { IUser, ISellerProfile } from '../types/shared/user.types';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, phone, role = 'buyer', businessName, city = 'Mumbai', state = 'Maharashtra' } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const validRoles = ['buyer', 'seller'];
    const userRole = validRoles.includes(role) ? role : 'buyer';

    // Check if user already exists
    const existing = await getOne<{ id: number }>('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=002f34&color=fff&size=150`;

    const result = await query<QueryResult>(
      'INSERT INTO users (name, email, password_hash, phone, avatar_url, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, phone || null, avatarUrl, userRole, 'active']
    );

    const newUserId = result[0]?.insertId || (result as any).insertId;

    // If seller, create default seller profile
    if (userRole === 'seller') {
      await query(
        'INSERT INTO seller_profiles (user_id, business_name, bio, city, state, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [newUserId, businessName || `${name}'s Store`, 'Verified Classified Seller on NeighShop', city, state, 0]
      );
    }

    const token = jwt.sign(
      { id: newUserId, email: email.toLowerCase().trim(), role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        avatar_url: avatarUrl,
        role: userRole,
        status: 'active'
      }
    });
  } catch (err: any) {
    console.error('Error in register:', err);
    res.status(500).json({ success: false, message: 'Registration failed due to a server error.', error: err.message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    interface DBUser extends IUser {
      password_hash: string;
    }

    const user = await getOne<DBUser>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Account is suspended by an administrator.' });
      return;
    }

    if (user.status === 'deactivated') {
      res.status(403).json({ success: false, message: 'Account has been deactivated.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
      return;
    }

    // Fetch seller profile if seller
    let sellerProfile: ISellerProfile | null = null;
    if (user.role === 'seller') {
      sellerProfile = await getOne<ISellerProfile>('SELECT * FROM seller_profiles WHERE user_id = ?', [user.id]);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role: user.role,
        status: user.status
      },
      sellerProfile
    });
  } catch (err: any) {
    console.error('Error in login:', err);
    res.status(500).json({ success: false, message: 'Login failed due to a server error.', error: err.message });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await getOne<IUser>(
      'SELECT id, name, email, phone, avatar_url, role, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let sellerProfile: ISellerProfile | null = null;
    if (user.role === 'seller' || user.role === 'admin') {
      sellerProfile = await getOne<ISellerProfile>('SELECT * FROM seller_profiles WHERE user_id = ?', [user.id]);
    }

    const favCount = await getOne<{ count: number }>('SELECT count(*) as count FROM favourites WHERE user_id = ?', [user.id]);
    const adCount = await getOne<{ count: number }>('SELECT count(*) as count FROM advertisements WHERE seller_id = ?', [user.id]);

    res.json({
      success: true,
      user,
      sellerProfile,
      stats: {
        favouritesCount: favCount ? favCount.count : 0,
        myAdsCount: adCount ? adCount.count : 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: err.message });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, phone, avatar_url, businessName, bio, address, city, state } = req.body;
    const userId = req.user.id;

    await query(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
      [name, phone, avatar_url, userId]
    );

    if (req.user.role === 'seller') {
      const profile = await getOne<{ id: number }>('SELECT id FROM seller_profiles WHERE user_id = ?', [userId]);
      if (profile) {
        await query(
          'UPDATE seller_profiles SET business_name = COALESCE(?, business_name), bio = COALESCE(?, bio), address = COALESCE(?, address), city = COALESCE(?, city), state = COALESCE(?, state) WHERE user_id = ?',
          [businessName, bio, address, city, state, userId]
        );
      } else {
        await query(
          'INSERT INTO seller_profiles (user_id, business_name, bio, address, city, state) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, businessName || `${name}'s Store`, bio, address, city, state]
        );
      }
    }

    const updatedUser = await getOne<IUser>('SELECT id, name, email, phone, avatar_url, role, status FROM users WHERE id = ?', [userId]);
    const updatedSellerProfile = await getOne<ISellerProfile>('SELECT * FROM seller_profiles WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser,
      sellerProfile: updatedSellerProfile
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
  }
}

export async function switchRole(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { targetRole } = req.body;
    if (!['buyer', 'seller'].includes(targetRole)) {
      res.status(400).json({ success: false, message: 'Target role must be either buyer or seller.' });
      return;
    }

    if (targetRole === 'seller') {
      const profile = await getOne<{ id: number }>('SELECT id FROM seller_profiles WHERE user_id = ?', [req.user.id]);
      if (!profile) {
        await query(
          'INSERT INTO seller_profiles (user_id, business_name, bio, city, state) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, `${req.user.name}'s Classifieds`, 'Verified NeighShop Seller', 'Mumbai', 'Maharashtra']
        );
      }
    }

    await query('UPDATE users SET role = ? WHERE id = ?', [targetRole, req.user.id]);

    const newToken = jwt.sign(
      { id: req.user.id, email: req.user.email, role: targetRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Switched mode to ${targetRole}!`,
      token: newToken,
      role: targetRole
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Role switch failed', error: err.message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Logout failed', error: err.message });
  }
}

