var Joi = require('joi');

const myQuery = require('../../db/mongooseQuery');
const timeConvertor = require("../../config/getIranTime");

const TAG = "Accepet Order MiddleWare ";

const postCheck = (input) => {
    const schema = {
        unRegisterId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}

const findOrderFromTemp = (idOrder) => {
    var promise = new Promise((resolve, reject) => {
        myQuery.findTempOrder(idOrder).exec().then((order) => {
            if (order)
                resolve(order);
            else
                reject("Order Not Find");
        }).catch((err) => {
            reject(err);
        });
    });
    return promise;
}

const getTodayBuy = () => {
    var promise = new Promise((resolve, reject) => {
        var count = 0;
        var input = {
            year: timeConvertor.getPersianDate().newYear,
            month: timeConvertor.getPersianDate().newMonth,
            daymonth: timeConvertor.getPersianDate().newDay
        }
        myQuery.getDayBuy(input).exec().then((obj) => {
            if (obj.length != 0)
                count += obj.total;
            myQuery.getMainDayBuy(input).exec().then((obj1) => {
                if (obj1.length != 0)
                    count += obj1.total;
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

const getProductBuyCeiling = (idArray) => {
    var promise = new Promise((resolve, reject) => {
        myQuery.getMainOrdersById(idArray).exec().then((objs) => {
            var array = [];
            for (let index = 0; index < objs.length; index++) array.push(objs[index]);
            resolve(array);
        }).catch((err) => {
            reject(err);
        });

    });
    return promise;
}
const getProductsIds = (idArray) => {
    var promise = new Promise((resolve, reject) => {
        myQuery.getPorducstByIds(idArray).exec().then((objs) => {
            if (objs.length == 0)
                reject("Array empty");
            else
                resolve(objs);
        }).catch((err) => {
            reject(err);
        });
    });
    return promise;
}
const checkBuyCeiling = (orderProducts, allProducts, countedPorduct) => {
    for (let index = 0; index < orderProducts.length; index++) {
        const element = orderProducts[index];
        var x = {};
        for (let i = 0; i < allProducts.length; i++) {
            if (allProducts[i]._id == element.productId) {
                if (element.count > allProducts[i].available) {
                    console.log(TAG + "This element is no enough " + element.productName + "<" + allProducts[i].available);
                    return false;
                }
                x = allProducts[i];
                break;
            }
        }
        for (let i = 0; i < countedPorduct.length; i++) {
            if (countedPorduct[i]._id == element.productId) {
                if (countedPorduct[i].count + element.count > x.buyCeiling) {
                    console.log(TAG + "buyingCeiling is not enough for "+x.name+" :" + x.buyCeiling + " < " + countedPorduct[i].count + "+" + element.count);
                    return false;
                }

            }
        }
    }
    return true;
}

const checkOrderAmount = (req, res, next) => {
    if (req.userData == undefined) {
        console.log(TAG + 'Wrong token');
        res.status(401).send("Wrong token string");
    } else if (req.body == undefined) {
        console.log(TAG + 'Wrong param');
        res.status(401).send('Post param not excited');
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const postParam = req.body;
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                // post param is id of temp order
                var temp = postCheck(postParam);
                if (temp == "OK") {
                    // find order from temp order
                    var promiseOrder = findOrderFromTemp(postParam.unRegisterId);
                    promiseOrder.then((order) => {
                        // check for globalDayliBuyCeil
                        var todayPromise = getTodayBuy();
                        todayPromise.then((todaySum) => {
                            myQuery.getGlobalInfo().exec().then((info) => {
                                var val = todaySum;
                                var temp = info.globalDayliBuyCeil; //temp is global dayli Buy Ceil
                                for (let i = 0; i < order.products.length; i++) val += order.products[i].count;
                                if (val < temp) {
                                    // check for product buyCeiling
                                    var idArray = [];
                                    for (let index = 0; index < order.products.length; index++) {
                                        idArray.push(order.products[index].productId);
                                    }
                                    var productsPromise = getProductsIds(idArray);
                                    productsPromise.then((allProducts) => {
                                        var productCeilPromise = getProductBuyCeiling(idArray);
                                        productCeilPromise.then((products) => {
                                            // check for product available
                                            if (checkBuyCeiling(order.products, allProducts, products)) {
                                                order.unRegisterId = postParam.unRegisterId;
                                                req.order = order;
                                                next();
                                            } else {
                                                console.log(TAG + 'In request 403');
                                                res.status(403).send("Reques denied");
                                            }
                                        }).catch((err) => {
                                            console.log(TAG + "Error in get products count " + err);
                                            res.status(501).send("Error in get products count " + err);
                                        })

                                    }).catch((err) => {
                                        console.log(TAG + "Error in all products " + err);
                                        res.status(501).send("Error in all products " + err);
                                    })
                                } else {
                                    console.log(TAG + 'Full today');
                                    res.status(403).send("Full today");
                                }
                            }).catch((err) => {
                                console.log(TAG + "Error in get global info " + err);
                                res.status(501).send("Error in get global info " + err);
                            });

                        }).catch((err) => {
                            console.log(TAG + "Error in query " + err);
                            res.status(501).send("Error in query " + err);
                        })
                    }).catch((message) => {
                        console.log(TAG + "Some error is accourd " + message);
                        res.status(501).send("Some error is accourd " + message);
                    });
                } else {
                    console.log(TAG + 'Wrong input' + temp);
                    res.status(403).send("Wrong input object" + temp);
                }
            } else {
                console.log(TAG + 'Wrong username and password');
                res.status(401).send("Wrong username and password");
            }
        } else {
            console.log(TAG + 'Not username and password');
            res.status(401).send("Not username and password");
        }
    }
}
module.exports.acceptMiddleWare = checkOrderAmount;