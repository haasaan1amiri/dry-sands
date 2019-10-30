const roleRouter = require("express").Router();
const Joi = require('joi');

const myQuery = require('../../db/mongooseQuery');
const authutility = require('../../authorization/authUtility');


const checkPost = (input) => {
    const schema = {
        text: Joi.string().min(1).required()
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}

roleRouter.get('/', (req, res, next) => {
    authutility.tokenBaseAuth("both", req, res, next)
}, (req, res, next) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        myQuery.getRoles().exec((err, roles) => {
            if (err) {
                console.log(err);
                res.status(501).send("server failed ");
            } else {
                res.status(200).send(roles);
            }
        });
    }

});
roleRouter.post('/new', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res, next) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else if (req.body == undefined) {
        res.status(401).send('Post param not excited');
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const postParam = req.body;
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                var temp = checkPost(postParam);
                console.log(temp);
                if (temp == "OK") {
                    myQuery.addnewRole(postParam, (err, role) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(role);
                        }
                    });
                } else {
                    res.status(401).send("post param is not valid" + temp);
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
module.exports = roleRouter;