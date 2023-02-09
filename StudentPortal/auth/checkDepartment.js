module.exports = (req, res, next) => {
    // kiểm tra đăng nhập bằng username, password
    if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'department')) {
        return next()
    }
    res.redirect('/')
}