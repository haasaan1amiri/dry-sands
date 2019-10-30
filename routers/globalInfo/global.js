const globalRouter = require("express").Router();
const Joi = require('joi');

const myQuery = require('../../db/mongooseQuery');
const authutility = require('../../authorization/authUtility');

const TAG = "globalRouter ";
const check = (input) => {
    const globalSchema = {
        globalNewOrder: Joi.boolean().required(),
        globalShowPrice: Joi.boolean().required(),
        globalHaveAccess: Joi.boolean().required(),
        globalDayliBuyCeil: Joi.number().min(0).required()
    }
    const result = Joi.validate(input, globalSchema);
    if (result.error) {
        return result.error.details[0].message;
    } else {
        return "OK";
    }
}

globalRouter.get('/', (req, res, next) => {
    authutility.tokenBaseAuth("both", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        console.log(TAG + "Wrong token string");
        res.status(401).send("Wrong token string");
    } else {
        myQuery.getGlobalInfo().exec((err, info) => {
            if (err) {
                console.log(TAG + "Error in getGlobalInfo " + err);
                res.status(501).send("server failed ");
            } else {
                res.status(200).send(info);
            }
        });
    }

});

globalRouter.post('/new', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        console.log(TAG + "Wrong token string");
        res.status(401).send("Wrong token string");
    } else if (req.body == undefined) {
        console.log(TAG + "Post param not excited");
        res.status(401).send('Post param not excited');
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const postParam = req.body;
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                if (check(postParam) == "OK") {
                    myQuery.addGlobalInfo(postParam, (err, info) => {
                        if (err) {
                            console.log(TAG + "Error in add global info " + err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(info);
                        }
                    });
                } else {
                    console.log(TAG + "post param is not valid");
                    res.status(401).send("post param is not valid");
                }
            } else {
                console.log(TAG + "post param is not valid");
                res.status(401).send("Wrong username and password");
            }
        } else {
            console.log(TAG + "post param is not valid");
            res.status(401).send("Not username and password");
        }
    }
});
module.exports = globalRouter;