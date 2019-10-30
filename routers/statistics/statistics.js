const statisticsRouter = require("express").Router();


const myQuery = require('../../db/mongooseQuery');
const authutility = require('../../authorization/authUtility');
const moment = require('jalali-moment');


// have no query parameter
statisticsRouter.get('/total', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        console.log("Wrong token string");
        res.status(401).send("Wrong token string");
    } else {
        myQuery.getTotalStatisticsMonth().exec().then((months) => {
            myQuery.getTotalStatisticsWeek().exec().then((days) => {
                console.log("Ok in send", months, days);
                res.status(200).send({
                    months,
                    days
                });
            }).catch((err) => {
                console.log("Some error " + err);
                res.status(501).send(err);
            })
        }).catch((err) => {
            console.log("Some error " + err);
            res.status(501).send(err);
        })
    }
});

// query parameter is userId
statisticsRouter.get('/managment', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        console.log("Wrong token string");
        res.status(401).send("Wrong token string");
    } else {
        myQuery.getManagmentStatisticsMonth().exec().then((months) => {
            myQuery.getManagmentStatisticsWeek().exec().then((days) => {
                myQuery.getUsersFromOrder({
                    months,
                    days
                }).then((docs) => {
                    console.log("Ok in send", docs);
                    res.status(200).send(docs);
                }).catch((err) => {
                    console.log("Some error " + err);
                    res.status(501).send(err);
                });
            }).catch((err) => {
                console.log("Some error " + err);
                res.status(501).send(err);
            })
        }).catch((err) => {
            console.log("Some error " + err);
            res.status(501).send(err);
        });
    }
});

statisticsRouter.get('/user', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        console.log("Wrong token string");
        res.status(401).send("Wrong token string");
    } else {
        const user = req.query.userId;
        if(user){
            console.log("user ",user);
            myQuery.getUserStatisticsMonth(user).exec().then((months) => {
                myQuery.getUserStatisticsWeek(user).exec().then((days) => {
                    myQuery.getUsersFromOrder({
                        months,
                        days
                    }).then((docs) => {
                        console.log("Ok in send", docs);
                        res.status(200).send(docs);
                    }).catch((err) => {
                        console.log("Some error " + err);
                        res.status(501).send(err);
                    });
                }).catch((err) => {
                    console.log("Some error " + err);
                    res.status(501).send(err);
                })
            }).catch((err) => {
                console.log("Some error " + err);
                res.status(501).send(err);
            });
        }
        else{
            console.log("Wrong Query pramater");
            res.status(401).send("Wrong Query pramater");
        }
    }
});
module.exports = statisticsRouter;