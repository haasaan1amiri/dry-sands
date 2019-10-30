const userRouter = require("express").Router();
const Joi = require('joi');

const myQuery = require('../../db/mongooseQuery');
const authutility = require('../../authorization/authUtility');
const timeConvertor = require("../../config/getIranTime");
const getByRank = require('./getRank');

const Userschema = {
    name: Joi.string().min(2).max(20).required(),
    family: Joi.string().min(2).max(20).required(),
    address: Joi.string().min(5).max(150).required(),
    phoneNumber: Joi.string().min(11).max(11).required(),
    mobileNumber: Joi.string().min(11).max(11).required(),
    requestDay: Joi.object({
        year: Joi.number().min(1397).max(1450).required(),
        month: Joi.number().min(1).max(12).required(),
        daymonth: Joi.number().min(1).max(31).required()
    }),
    rank: Joi.number().required().positive(),
    debt: Joi.number().required().positive(),
    userName: Joi.string().min(4).max(20).required(),
    password: Joi.string().min(8).max(20).required(),
    registerDay: Joi.object({
        year: Joi.number().min(1397).max(1450).required(),
        month: Joi.number().min(1).max(12).required(),
        daymonth: Joi.number().min(1).max(31).required()
    }),
    isNewOrder: Joi.boolean().required(),
    isShowPrice: Joi.boolean().required(),
    haveAccess: Joi.boolean().required(),
    activity: Joi.boolean().required(), // 0 is removed, 1 is accepted and registered, 2 is not accepted and register is pending
    dayliBuyCeil: Joi.number().required().positive()
};

const setUserNameAndAcceptRegister = (user, cb) => {
    console.log("Passed user to setUsername");
    console.log(user)
    myQuery.removeFromTemp(user.unRegisterId, (err) => {
        if (err) {
            console.log("Error in removing from temp user because" + err);
            cb(err, null);
        } else {
            console.log("After delete from temp");
            console.log(user)
            user.password = authutility.hash(user.password);
            myQuery.addUserFromTemp(user, cb);
        }
    });

};
const addUserCheck = (input) => {
    const schema = {
        name: Joi.string().min(2).max(20).required(),
        family: Joi.string().min(2).max(20).required(),
        address: Joi.string().min(5).max(150).required(),
        phoneNumber: Joi.string().min(11).max(11).required(),
        mobileNumber: Joi.string().min(11).max(11).required(),
        requestDay: Joi.object({
            year: Joi.number().min(1397).max(1450).required(),
            month: Joi.number().min(1).max(12).required(),
            daymonth: Joi.number().min(1).max(31).required()
        })
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}
const acceptUserCheck = (input) => {
    const schema = {
        username: Joi.string().min(4).max(20).required(),
        password: Joi.string().min(8).max(20).required(),
        name: Joi.string().min(2).max(20).required(),
        family: Joi.string().min(2).max(20).required(),
        address: Joi.string().min(5).max(150).required(),
        phoneNumber: Joi.string().min(11).max(11).required(),
        mobileNumber: Joi.string().min(11).max(11).required(),
        requestDay: Joi.object({
            year: Joi.number().min(1397).max(1450).required(),
            month: Joi.number().min(1).max(12).required(),
            daymonth: Joi.number().min(1).max(31).required()
        }),
        unRegisterId: Joi.string().min(24).max(24).required()
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return {
            err: result.error.details[0].message,
            user: null
        };
    } else {
        input.rank = -1;
        input.debt = 0;
        input.registerDay = {
            year: timeConvertor.getPersianDate().newYear,
            month: timeConvertor.getPersianDate().newMonth,
            daymonth: timeConvertor.getPersianDate().newDay
        };
        input.isNewOrder = false;
        input.isShowPrice = false;
        input.haveAccess = false;
        input.activity = true; // 0 is removed, 1 is accepted and registered, 2 is not accepted and register is pending
        input.dayliBuyCeil = 100;
        return {
            err: null,
            user: input
        };
    }
}
const limitCheck = (input) => {
    const schema = {
        NewOrder: Joi.boolean().required(),
        ShowPrice: Joi.boolean().required(),
        haveAccess: Joi.boolean().required(),
        DayliBuyCeil: Joi.number().required().positive()
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}
const updateCheck = (input) => {
    const schema = {
        user: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        NewOrder: Joi.boolean().required(),
        ShowPrice: Joi.boolean().required(),
        haveAccess: Joi.boolean().required()
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}
const checkForUserRedun = (user, cb) => {
    myQuery.getOneUserForLogin(user.username).exec((err, users) => {
        if (err) cb(err);
        else if (users.length == 0) {
            cb(null);
        } else if (users.length != 0) {
            cb("UserName duplicated");
        }
    });
}
const delStroCheck = (input) => {
    const schema = {
        userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }
    const result = Joi.validate(input, schema);
    if (result.error) return result.error.details[0].message;
    else return "OK";
}
userRouter.get('/', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const sortBy = req.query.sortBy;
        const activity = req.query.activity;
        console.log(sortBy);
        console.log(activity);
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                if (sortBy != undefined && activity == undefined) {
                    console.log("sortby");
                    getByRank.getUserByRank((err, users) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(users);
                        }
                    });
                    // myQuery.getUsersByActivity(1).sort({
                    //     rank: sortBy
                    // }).exec((err, users) => {
                    //     if (err) {
                    //         console.log(err);
                    //         res.status(501).send("server failed ");
                    //     } else {
                    //         res.status(200).send(users);
                    //     }
                    // });
                } else if (activity != undefined && sortBy == undefined) {
                    console.log("activitty");
                    myQuery.getNotRegisterd().exec((err, users) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(users);
                        }
                    });
                } else if (sortBy == undefined && activity == undefined) {
                    console.log("normal");
                    myQuery.getUsersByActivity(true).exec((err, users) => {
                        console.log("Returnen");
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(users);
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

userRouter.get('/global', (req, res, next) => {
    authutility.tokenBaseAuth("both", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const userId = req.query.userId;
        myQuery.getUserGlobalInfo(userId).exec((err, Info) => {
            if (err) {
                console.log(err);
                res.status(501).send("server failed ");
            } else {
                if(Info.length == 0)
                {
                    res.status(401).send("No User");
                }else{
                    res.status(200).send(Info[0]);
                }
               
            }
        });
    }
})
userRouter.post('/checkregister/', (req, res) => {
    if (req.body == undefined) {
        res.status(401).send('Post param not excited');
    } else {
        const postParam = req.body;
        //{'code':'some thing'}
        if (postParam.code == undefined) {
            res.status(401).send('Post param dont contain code');
        } else {
            myQuery.checkUnRegister(postParam.code).exec((err, user) => {
                if (err) {
                    console.log(err);
                    res.status(501).send("server failed ");
                } else if (user.length == 1) {
                    res.status(200).send(user);
                } else {
                    res.status(300).send(user);
                }
            });
        }

    }

});
userRouter.post('/newuser/add', (req, res) => {
    if (req.body == undefined) {
        res.status(401).send('Post param not excited');
    } else {
        const postParam = req.body;
        var temp = addUserCheck(postParam);
        console.log(temp);
        if (temp == "OK") {
            myQuery.registerUser(postParam, (err, user) => {
                if (err) {
                    console.log(err);
                    res.status(501).send("server failed ");
                } else {
                    res.status(200).send(user);
                }
            });
        } else {
            res.status(401).send("post param is not valid");
        }
    }
});
userRouter.post('/newuser/accept', (req, res, next) => {
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
                var temp = acceptUserCheck(postParam);
                console.log(temp);
                if (temp.err == null) {
                    checkForUserRedun(temp.user, (err) => {
                        if (err) {
                            res.status(401).send("Error: " + err);
                        } else {
                            setUserNameAndAcceptRegister(temp.user, (err, user) => {
                                if (err) {
                                    console.log(err);
                                    res.status(501).send("server failed ");
                                } else {
                                    console.log("When send");
                                    console.log(user)
                                    res.status(200).send(user);
                                }
                            });
                        }
                    });
                } else {
                    res.status(401).send("Wrong User object" + temp.err);
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
userRouter.post('/newuser/reject', (req, res, next) => {
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
                    myQuery.removeFromTemp(postParam.userId, (err) => {
                        if (err) {
                            res.status(501).send(err);
                        } else {
                            res.status(200).send("Deleted successfully");
                        }
                    });
                } else {
                    res.status(401).send("Error in post param " + result);
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
userRouter.post('/limit', (req, res, next) => {
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
                if (limitCheck(postParam) == "OK") {
                    myQuery.applyLimitToAll(postParam).exec((err, user) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(user);
                        }
                    });
                } else {
                    res.status(401).send("Wrong Limit object");
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
userRouter.post('/update', (req, res, next) => {
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
                if (updateCheck(postParam) == "OK") {
                    myQuery.applyLimitToOne(postParam.user, postParam.NewOrder, postParam.ShowPrice, postParam.haveAccess).exec((err, user) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            console.log(user);
                            res.status(200).send(user);
                        }
                    });
                } else {
                    res.status(401).send("Wrong update object");
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
userRouter.post('/delete', (req, res, next) => {
    tokenBaseAuth("admin", req, res, next)
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
                if (acceptUserCheck(postParam) == "OK") {
                    myQuery.deleteUser(postParam, 0).exec((err, user) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            res.status(200).send(user);
                        }
                    });
                } else {
                    res.status(401).send("Wrong post Object");
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
module.exports = userRouter;