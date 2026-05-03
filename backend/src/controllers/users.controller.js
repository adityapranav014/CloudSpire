import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getIndex = catchAsync(async (req, res, next) => {
    console.log('[USERS] GET /users — User:', req.user, 'Query:', req.query);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find().skip(skip).limit(limit),
        User.countDocuments(),
    ]);

    console.log('[USERS] getIndex success — users:', users.length, 'total:', total, 'page:', page);
    res.status(200).json({
        success: true,
        data: { users, total, page, limit },
        error: null,
    });
});

export const getUserById = catchAsync(async (req, res, next) => {
    console.log('[USERS] GET /users/:id — Params:', req.params, 'User:', req.user);

    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        console.log('[USERS] getUserById error: User not found — id:', id);
        throw new AppError('User not found', 404);
    }

    console.log('[USERS] getUserById success — userId:', user._id, 'email:', user.email);
    res.status(200).json({
        success: true,
        data: user,
        error: null,
    });
});

export const createUser = catchAsync(async (req, res, next) => {
    console.log('[USERS] POST /users — User:', req.user, 'Body:', { name: req.body.name, email: req.body.email, role: req.body.role });

    const { name, email, role, password } = req.body;

    if (!password) {
        console.log('[USERS] createUser error: Missing password');
        return next(new AppError('Password is required.', 400, 'MISSING_FIELDS'));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const created = await User.create({
        name,
        email,
        role,
        password: hashedPassword,
        teamId: req.user.teamId,
    });

    created.password = undefined;

    console.log('[USERS] createUser success — userId:', created._id, 'email:', email);
    res.status(201).json({
        success: true,
        data: created,
        error: null,
    });
});
