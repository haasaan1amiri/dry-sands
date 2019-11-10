const paymentRouter = require("express").Router();
const Joi = require('joi');

const myQuery = require('../../db/mongooseQuery');
const authutility = require('../../authorization/authUtility');



const addNewPaymentCheck = (input) => {
    const schema = {
        orderNumber: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        amount: Joi.number().positive().required(),
        information: Joi.string()
    }
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}

const findOrder = (id) => {
    var promise = new Promise((resolve, reject) => {
        myQuery.getOrderById(id).exec().then((order) => {
            if (order.length != 0)
                resolve(order);
            else
                reject("Order Not Find");
        }).catch((err) => {
            reject(err);
        });
    });
    return promise;
}

const decreaseDebt = (id ,amount) => {
    var promise = new Promise((resolve, reject) => {
        myQuery.addDebtToUser(id,amount*(-1)).exec().then((user) => {
            if (user)
                resolve(user);
            else
                reject("user not find");
        }).catch((err) => {
            reject(err);
        });
    });
    return promise;
}

const changeOrder = (id,amount,isPayed)=>{
    var promise = new Promise((resolve, reject) => {
        myQuery.increasePayedOrder(id,amount,isPayed).exec().then((order) => {
            console.log(order);
            if (order)
                resolve(order);
            else
                reject("order not find");
        }).catch((err) => {
            reject(err);
        });
    });
    return promise;
    
}

paymentRouter.get('/', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const orderId = req.query.orderId;
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                if (orderId == undefined) {
                    console.log("orderId");
                    myQuery.getPayments().exec((err, payments) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(payments);
                        }
                    });
                } else if (orderId != undefined) {
                    console.log("normal");
                    myQuery.getPaymentsForOrder(orderId).exec((err, payment) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(payment);
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


/**
 * reduce debt from user and changed is payed for order if is payed is true.
 * increase payedAmout for order
 */
paymentRouter.post('/newpayment/add', (req, res, next) => {
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
                if (addNewPaymentCheck(postParam) == "OK") {
                    findOrder(postParam.orderNumber).then((_order)=>{
                        var order = _order[0].toObject();
                        if(postParam.amount <=(order.totalAmount - order.payedAmount)){
                            if(postParam.amount == (order.totalAmount - order.payedAmount)){
                                order.isPayed =true;
                            }
                            order.payedAmount = order.payedAmount + postParam.amount;
                            decreaseDebt(order.user._id,postParam.amount).then((users)=>{
                                changeOrder(order._id,postParam.amount,order.isPayed).then((order)=>{
                                    myQuery.addPayment(postParam, (err, payment) => {
                                        if (err) {
                                            console.log(err);
                                            res.status(501).send("server failed ");
                                        } else {
                                            res.status(200).send(payment);
                                        }
                                    })
                                }).catch((message)=>{
                                    console.log('some error order payment '+ message);
                                    res.status(501).send('some error order payment '+ message);
                                })
                                
                            }).catch((message)=>{
                                console.log('some error user '+ message);
                                res.status(501).send('some error user'+ message);
                            })
                        }
                        else{
                            console.log("amount is high"+(order.totalAmount - order.payedAmount))
                            res.status(401).send("amount is high");
                        }
                        
                    }).catch((message)=>{
                        console.log('some error order '+ message);
                        res.status(501).send('some error order'+ message);
                    })
                    
                } else {
                    res.status(401).send("Wrong post object");
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
module.exports = paymentRouter;