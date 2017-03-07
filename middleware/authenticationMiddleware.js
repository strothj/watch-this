function authenticationMiddleware (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.send({redirect: '/users/login'});
}

module.exports = authenticationMiddleware;
