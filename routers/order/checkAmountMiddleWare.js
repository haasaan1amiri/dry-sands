var Joi = require('joi');

const myQuery = require('../../db/mongooseQuery');

const TAG = "Check Amount Middleware ";
const newOrderCheck = (input) => {
    const schema = {
        user: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        products: Joi.array().items(Joi.object({
            productId: Joi.objectId().required(),
            productName: Joi.string().required(),
            count: Joi.number().min(1).required(),
            amount: Joi.number().positive().required()
        })),
        orderDay: Joi.object({
            year: Joi.number().min(1397).max(1450).required(),
            month: Joi.number().min(1).max(12).required(),
            daymonth: Joi.number().min(1).max(31).required()
        }),
        totalAmount: Joi.number().positive().required()
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}

const qu = (idUser, date) => {
    var promise = new Promise((resolve, reject) => {
        var count = 0;
        myQuery.tempAmount(idUser, date).exec().then((co) => {
            console.log(co);
            if (co.length != 0)
                count += co[0].total;
            myQuery.mainAmount(idUser, date).exec().then((coun) => {
                console.log(coun);
                if (coun.length != 0)
                    count += coun[0].total;
                resolve(count);

            }).catch((err) => {
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        });
    });
    return promise;
}
const checkOrderAmount = (req, res, next) => {
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
            myQuery.getGlobalInfo().exec((err, info) => {
                if (err) {
                    console.log(TAG + "Info Query failed" + err);
                    res.status(501).send("info Query failed");
                } else {
                    if (info.globalHaveAccess == false) {
                        console.log(TAG + "Forbidden have access to all");
                        res.status(403).send("Forbidden have access to all ");
                    } else if (info.globalNewOrder == false) {
                        console.log(TAG + "Forbidden new order to all");
                        res.status(403).send("Forbidden new order to all ");
                    } else {
                        var ttemp = newOrderCheck(postParam);
                        if ( ttemp == "OK") {
                            var idUser = postParam.user;
                            var date = postParam.orderDay;
                            var promiseResult = qu(idUser, date);
                            promiseResult.then((val) => {
                                myQuery.getUserById(idUser).exec((err, user) => {
                                    if (err) {
                                        console.log(TAG + "User Query failed"+ err);
                                        res.status(501).send("User Query failed");
                                    } else {
                                        if (!user) {
                                            console.log(TAG + "User not found");
                                            res.status(403).send("User not found");
                                        } else if (user.haveAccess == false || user.isNewOrder == false) {
                                            var message = "User dont have " + user.haveAccess == true ? "total acces" : "new order access";
                                            console.log(TAG + message);
                                            res.status(403).send(message);
                                        } else {
                                            var temp = user.dayliBuyCeil;
                                            for (let i = 0; i < postParam.products.length; i++) {
                                                val += postParam.products[i].count;
                                            }
                                            if (val < temp) {
                                                next();
                                            } else {
                                                console.log(TAG + "Full dayli count, products: " +val +'<' +temp+' :user.dayliBuyCeil');
                                                res.status(403).send("Full dayli count");
                                            }
                                        }
                                    }
                                });
                            });
                            promiseResult.catch((message) => {
                                console.log(TAG + "Query failed"+message);
                                res.status(501).send("Query failed" + message);
                            });
                        } else {
                            console.log(TAG + "Wrong post Object " + ttemp);
                            res.status(401).send("Wrong post Object " +ttemp);
                        }
                    }
                }
            });

        } else {
            console.log(TAG + "Not username and password");
            res.status(401).send("Not username and password");
        }
    }
}
module.exports.check = checkOrderAmount;