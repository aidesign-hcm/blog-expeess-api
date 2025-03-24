const verifyAdmin = function(req, res, next){
    var isAdmin = req.user.rule 
    if (isAdmin == 'admin') {
        return next();
    }
    else {
        // if user is not admin
        // return an error
        var err =  new Error ('You are not autorized to perform this operation!');
        err.status =  403;
        return next(err);
    }
}
const verifyManager = function(req, res, next){
    var isAdmin = req.user.rule 
    if (isAdmin == 'admin' || isAdmin == 'manager') {
        return next();
    }
    else {
        // if user is not admin
        // return an error
        var err =  new Error ('You are not autorized to perform this operation!');
        err.status =  403;
        return next(err);
    }
}

module.exports = { verifyAdmin, verifyManager }