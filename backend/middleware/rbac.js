function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Action requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is: ${req.user.role}`
            });
        }

        next();
    };
}

const requireAdmin = requireRole('admin');
const requireSeller = requireRole('seller', 'admin');
const requireBuyer = requireRole('buyer', 'seller', 'admin');

module.exports = {
    requireRole,
    requireAdmin,
    requireSeller,
    requireBuyer
};
