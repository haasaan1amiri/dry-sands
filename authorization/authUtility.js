const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const myQuery = require('../db/mongooseQuery')

const SALT_WORK_FACTOR = 10;

const TAG = "authUtilty ";

var gethash = (inputString) => {
    var salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
    return bcrypt.hashSync(inputString, salt);
}
var cpmHash = (inputString, hashedValue) => {
    return bcrypt.compareSync(inputString, hashedValue); //true or false
}


const tokenBase = (userType, req, res, next) => {
    try {
        //const tokenString = authutility.decrypt(req.get('token'));
        const tokenString = (req.get('token'));
        if (!tokenString) {
            console.log(TAG + "Forbidden no Token");
            return res.status(403).send("Forbidden no Token");
        }
        var decoded = jwt.verify(tokenString, process.env.JWT_KEY);
        if (decoded.username != undefined && decoded.password != undefined && decoded.usertype != undefined) {
            if (userType === "myUser") {
                if (decoded.usertype == userType) {
                    myQuery.getOneUserForLogin(decoded.username).exec((err, user) => {
                        if (err) {
                            console.log(TAG + "Forbidden userName");
                            res.status(403).send("Forbidden userName");
                        } else if (user.length == 1) {
                            if (cpmHash(decoded.password, user[0].password) == true) {
                                console.log(TAG + "Password is correct");
                                req.userData = decoded;
                                next();
                            } else {
                                console.log(TAG + "Password is not correct");
                                res.status(403).send("Forbidden password");
                            }
                        } else if (user.length != 1) {
                            console.log(TAG + "User not found");
                            res.status(403).send("Forbidden user not find");
                        }
                    });
                } else {
                    console.log(TAG + "User Type Error");
                    res.status(403).send("Forbidden userType");
                }
            } else if (userType === "admin") {
                if (decoded.usertype == userType) {
                    if (decoded.username != "android") {
                        console.log(TAG + "Forbidden userName");
                        res.status(403).send("Forbidden userName");
                    } else {
                        if (decoded.password === "admin123") {
                            console.log(TAG + "Password is correct");
                            req.userData = decoded;
                            next();
                        } else {
                            console.log(TAG + "Password is not correct");
                            res.status(403).send("Forbidden password");
                        }
                    }
                } else {
                    console.log(TAG + "Forbidden userType");
                    res.status(403).send("Forbidden userType");
                }
            } else if (userType === "both") {
                if (decoded.usertype == "admin") {
                    if (decoded.username != "android") {
                        console.log(TAG + "Forbidden username");
                        res.status(403).send("Forbidden userName");
                    } else {
                        if (decoded.password === "admin123") {
                            console.log(TAG + "Password is ok");
                            req.userData = decoded;
                            next();
                        } else {
                            console.log(TAG + "Password is not ok");
                            res.status(403).send("Forbidden password");
                        }
                    }
                } else if (decoded.usertype == "myUser") {
                    myQuery.getOneUserForLogin(decoded.username).exec((err, user) => {
                        if (err) {
                            console.log(TAG + "Forbidden userName");
                            res.status(403).send("Forbidden userName");
                        } else if (user.length == 1) {
                            if (cpmHash(decoded.password, user[0].password) == true) {
                                console.log(TAG + "Password is ok");
                                req.userData = decoded;
                                next();
                            } else {
                                console.log(TAG + "Password is not ok");
                                res.status(403).send("Forbidden password");
                            }
                        } else if (user.length != 1) {
                            console.log(TAG + "User not found " + user.length);
                            res.status(403).send("Forbidden user not find");
                        }
                    });
                } else {
                    console.log(TAG + "User Type Error");
                    res.status(403).send("Forbidden userType");
                }
            }
        } else {
            console.log(TAG + "Wrong token");
            res.status(403).send("Forbidden Wrong Token");
        }
    } catch (error) {
        console.log(TAG + "Some error in server" + error);
        res.status(403).send("Forbidden Catch");
    }
}

const getToken = (userName, Password, userType) => {
    return jwt.sign({
        username: userName,
        password: Password,
        usertype: userType
    }, process.env.JWT_KEY);
}
module.exports = {
    hash: gethash,
    compareHash: cpmHash,
    tokenBaseAuth: tokenBase,
    generateToken: getToken
}
