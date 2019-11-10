const orderRouter = require("express").Router();
const Joi = require('joi');

const myQuery = require('../../db/mongooseQuery');
const authutility = require('../../authorization/authUtility');
const orderCount = require('./checkAmountMiddleWare');
const orderAccept = require('./acceptOrderMiddleWare');

const getIranTime = require('../../config/getIranTime');

// const Userschema = Joi.object().keys({
//     name: Joi.string().min(2).max(20).required(),
//     family: Joi.string().min(2).max(20).required(),
//     address: Joi.string().min(5).max(150).required(),
//     phoneNumber: Joi.string().min(11).max(11).required(),
//     mobileNumber: Joi.string().min(11).max(11).required(),
//     requestDay: Joi.object({
//         year: Joi.number().min(1397).max(1450).required(),
//         month: Joi.number().min(1).max(12).required(),
//         daymonth: Joi.number().min(1).max(31).required()
//     }),
//     rank: Joi.number().required().positive(),
//     debt: Joi.number().required().positive(),
//     userName: Joi.string().min(4).max(20).required(),
//     password: Joi.string().required(),
//     registerDay: Joi.object({
//         year: Joi.number().min(1397).max(1450).required(),
//         month: Joi.number().min(1).max(12).required(),
//         daymonth: Joi.number().min(1).max(31).required()
//     }),
//     isNewOrder: Joi.boolean().required(),
//     isShowPrice: Joi.boolean().required(),
//     haveAccess: Joi.boolean().required(),
//     activity: Joi.boolean().required(), // 0 is removed, 1 is accepted and registered, 2 is not accepted and register is pending
//     dayliBuyCeil: Joi.number().required().positive()
// });
var acceptOrderCheck = (input) => {


    // const orderDaySchema = Joi.object().keys({
    //     year: Joi.number().min(1397).max(1450).required(),
    //     month: Joi.number().min(1).max(13).required(),
    //     daymonth: Joi.number().min(1).max(31).required()
    // });
    // const schema = {
    //     user: Joi.any(),
    //     products: Joi.array().items(Joi.object({
    //         productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    //         productName: Joi.string().required(),
    //         count: Joi.number().min(1).required(),
    //         amount: Joi.number().positive().required()
    //     })),
    //     orderDay: orderDaySchema,
    //     totalAmount: Joi.number().positive().required(),
    //     unRegisterId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    // };
    // const result = Joi.validate(input, schema);
    // if (result.error) {
    //     console.log(result.error);
    //     return {
    //         err: result.error.details[0].message,
    //         order: null
    //     };
    // } else {
    var _order = input.toObject();
    _order.payedAmount = 0;
    _order.isPayed = false;
    _order.action = true;
    _order.weekNumber = getIranTime.getMiladiWeek(_order.orderDay);
    console.log(_order);
    return {
        err: null,
        order: _order
    };
};
const delStroCheck = (input) => {
    const schema = {
        unRegisterId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }
    const result = Joi.validate(input, schema);
    if (result.error) return result.error.details[0].message;
    else return "OK";
}

const deleteCheck = (input) => {
    const orderDaySchema = Joi.object().keys({
        year: Joi.number().min(1397).max(1450).required(),
        month: Joi.number().min(1).max(13).required(),
        daymonth: Joi.number().min(1).max(31).required()
    });
    const schema = {
        user: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        products: Joi.array().items(Joi.object({
            productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            count: Joi.number().min(1).required(),
            amount: Joi.number().positive().required()
        })),
        orderDay: orderDaySchema,
        totalAmount: Joi.number().positive().required(),
        unRegisterId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    };
    const result = Joi.validate(input, schema);
    if (result.error) return result.error.details[0].message;
    else return "OK";
}

const acceptOrderDB = (order) => {
    const acceptPromise = new Promise((resolve, reject) => {
        myQuery.removeTempOrder(order, (err) => {
            if (err) {
                reject("Error in removing from temp order because " + err);
            }
        });
        // console.log("add to main order");
        // console.log(order);
        myQuery.addOrder(order, (err, newOrder) => {
            if (err) {
                reject("Error in add to main collection because " + err);
            } else {
                myQuery.changeProductCount(newOrder.products, (err, r) => {
                    if (err) {
                        reject("Error in change product count because " + err);
                    } else {
                        console.log(r.matchedCount);
                        console.log(r.modifiedCount);
                        var debt = newOrder.totalAmount - newOrder.payedAmount;
                        myQuery.addDebtToUser(newOrder.user, debt).exec().then((user) => {
                            myQuery.getOrderUserExpand(newOrder._id).exec().then((orderNew)=>{
                                resolve(orderNew[0]);
                            }).catch((err)=>{
                                reject("Error in get order form db " + err);
                            })
                        }).catch((err) => {
                            reject("Error in change user debt because " + err);
                        })
                    }
                });
            }
        });
    });
    return acceptPromise;
};
//have req.param is isaccepted and is payed
orderRouter.get('/', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const isAccepted = req.query.isAccepted;
        const isPayed = req.query.isPayed;
        console.log(isAccepted);
        console.log(isPayed);
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                if (isAccepted != undefined && isPayed == undefined) {
                    console.log("isAccepted");
                    //if is accepted is 1 we get accepted orders.
                    // if is accepted is 0 we get unaccepted orders
                    myQuery.selectNotAccptedOrders(isAccepted).exec((err, orders) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(orders);
                        }
                    });
                } else if (isPayed != undefined && isAccepted == undefined) {
                    console.log("isPayed");
                    myQuery.getAllPayedOrders(isPayed).exec((err, orders) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(orders);
                        }
                    });
                } else if (isAccepted == undefined && isPayed == undefined) {
                    console.log("normal Orders");
                    myQuery.getOrders().exec((err, orders) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(orders);
                        }
                    });
                } else {
                    res.status(401).send("Wrong Query pramater");
                }

            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }

});



orderRouter.get('/myOrders', (req, res, next) => {
    authutility.tokenBaseAuth("myUser", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const id = req.query.id;
        if (username != null && password != null) {
            if (id != undefined) {
                myQuery.getMyOrders(id).exec((err, orders) => {
                    if (err) {
                        console.log(err);
                        res.status(501).send("server failed ");
                    } else {
                        res.status(200).send(orders);
                    }
                });
            } else {
                res.status(401).send("Wrong Query pramater");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }

});
orderRouter.post('/neworder/add', (req, res, next) => {
    authutility.tokenBaseAuth("myUser", req, res, next)
}, (req, res, next) => {
    orderCount.check(req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else if (req.body == undefined) {
        res.status(401).send('Post param not excited');
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const postParam = req.body;
        if (username != null && password != null) {
            myQuery.addTempOrder(postParam, (err, order) => {
                if (err) {
                    res.status(501).send("Error in add order");
                } else {
                    res.status(200).send(order);
                }
            });
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
orderRouter.post('/neworder/accept', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res, next) => {
    orderAccept.acceptMiddleWare(req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else if (req.body == undefined) {
        res.status(401).send('Post param not excited');
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        var postParam = req.order;

        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                var result = acceptOrderCheck(postParam);
                if (result.err == undefined) {
                    console.log("Main order: ");
                    // console.log(result.order);
                    const acceptPromise = acceptOrderDB(result.order);
                    acceptPromise.then((newOrder) => {
                        res.status(200).send(newOrder);
                    }).catch((message) => {
                        res.status(501).send(message);
                    });
                } else {
                    res.status(403).send("Error in post param " + result.err);
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});


orderRouter.post('/neworder/reject', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        console.log('Wrong tokn');
        res.status(401).send("Wrong token string");
    } else if (req.body == undefined) {
        console.log('Wrong Postparam');
        res.status(401).send('Post param not excited');
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const postParam = req.body;
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                var result = delStroCheck(postParam);
                if (result == "OK") {
                    myQuery.rejectOrder(postParam.unRegisterId, (err) => {
                        if (err) {
                            console.log('error in server' + err);
                            res.status(501).send(err);
                        } else {
                            console.log('Deleted');
                            res.status(200).send("Deleted successfully");
                        }
                    });
                } else {
                    console.log("Error in post param " + result);
                    res.status(401).send("Error in post param " + result);
                }
            } else {
                console.log("username and password is incorrect");
                res.status(401).send("Wrong username and password");
            }
        } else {
            console.log("username and password is null");
            res.status(401).send("Not username and password");
        }
    }
});

orderRouter.post('/checkorder/', (req, res, next) => {
    authutility.tokenBaseAuth("myUser", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else if (req.body == undefined) {
        res.status(401).send('Post param not excited');
    } else {
        const postParam = req.body;
        if (postParam.code == undefined) {
            res.status(401).send('Post param dont contain code');
        } else {
            myQuery.checkUnregiserOrder(postParam.code).exec((err, order) => {
                if (err) {
                    console.log(err);
                    res.status(501).send("server failed ");
                } else if (order.length == 1) {
                    res.status(200).send(order);
                } else {
                    res.status(300).send(order);
                }
            });
        }
    }
});

orderRouter.post('/checkorder/user', (req, res, next) => {
    authutility.tokenBaseAuth("myUser", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else if (req.body == undefined) {
        res.status(401).send('Post param not excited');
    } else {
        const postParam = req.body;
        if (postParam.code == undefined) {
            res.status(401).send('Post param dont contain code');
        } else {
            myQuery.getMyTempOrder(postParam.code).exec((err, order) => {
                if (err) {
                    console.log(err);
                    res.status(501).send("server failed ");
                } else {
                    res.status(200).send(order);
                }
            });
        }
    }
});
/**
 * use for delete unregistered order from temp collection
 */
orderRouter.post('/delete/unregisterd', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
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
                var temp = deleteCheck(postParam);
                if (temp != "OK") {
                    res.status(401).send("Wrong post Object " + temp);
                } else if (temp == "OK") {
                    myQuery.removeTempOrder(postParam, (err) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send("Removed successfuly");
                        }
                    });
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});

/**
 * use for delete registered order from main collection
 */
orderRouter.post('/delete/formstorage', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
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
                var result = delStroCheck(postParam);
                if (result == "OK") {
                    myQuery.deleteOrderFromStore(postParam.orderId, false).exec().then((newOrder) => {
                        res.status(200).send("Deleted successfully");
                    }).catch((message) => {
                        res.status(501).send(message);
                    });
                } else {
                    res.status(403).send("Error in post param " + result);
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
module.exports = orderRouter;