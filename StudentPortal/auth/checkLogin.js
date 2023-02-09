module.exports = (req, res, next) => {
    // kiểm tra đăng nhập bằng username, password
    if (req.session.user) {
        return next()
    }
    res.redirect('/')
}
