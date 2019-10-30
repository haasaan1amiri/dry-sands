const loginRouter = require("express").Router();
const myQuery = require('../../db/mongooseQuery');
const authutility = require('../../authorization/authUtility');

const TAG = "login ";
const checkForUserLogin = (username) => {
    var promise = new Promise((resolve, reject) => {
        myQuery.getOneUserForLogin(username).exec().then((users) => {
            if (users.length == 0 || users.length > 1) {
                var message = "User " + users.length == 0 ? "not found" : "is duplicated";
                reject(message);
            } else if (users.length == 1) {
                resolve(users[0]);
            }
        }).catch((err) => {
            reject(err);
        });
    });
    return promise;
}
loginRouter.post('/', (req, res) => {
    if (req.body == undefined) {
        console.log(TAG + "Post param not excited");
        res.status(401).send('Post param not excited');
    } else {
        const username = req.body.username;
        const password = req.body.password;
        if (username != null && password != null) {
            if (username == "android" && password == "admin123") {
                res.status(200).send(authutility.generateToken(username, password, "admin"));
            } else if (username === "android" && password != "admin123") {
                console.log(TAG + "Password is wrong");
                res.status(403).send('Password is wrong');
            } else if (username != "android" && password == "admin123") {
                console.log(TAG + 'Username is wrong');
                res.status(403).send('Username is wrong');
            } else {
                checkForUserLogin(username).then((user) => {
                    if (authutility.compareHash(password, user.password)) {
                        var sendObj = {
                            token: authutility.generateToken(username, password, "myUser"),
                            userId: user._id
                        }
                        res.status(200).send(sendObj);
                    } else {
                        console.log(TAG + "Password is wrong");
                        res.status(403).send('Password is wrong');
                    }
                }).catch((err) => {
                    console.log(TAG + "Some error in getUser for login " + err);
                    res.status(501).send(err);
                })
            }
        } else {
            console.log(TAG + 'Post param is not ok');
            res.status(403).send('Post param is not ok');
        }
    }
});
module.exports = loginRouter;