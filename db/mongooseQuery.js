const userModel = require('./../models/user');
const orderModel = require('./../models/order');
const productModel = require('./../models/product');
const paymentModel = require('./../models/payment');
const rolesModel = require('./../models/roels');
const tempUserModel = require('./../models/unRegisterdUser')
const tempOrderModel = require('./../models/unRegisteredOrder')
const infoModel = require('./../models/globalInfo')
const ObjectId = require('mongoose').Types.ObjectId;

/**
 * User section
 */
var addNewUser = (user, cb) => {
    userModel.create(user, cb);
};
var getUsersActivity = (inputActivity) => {
    return userModel.find({
        activity: inputActivity
    });
};
var changeUserActivity = (user, ourActivity) => {
    return userModel.findOneAndUpdate({
        _id: user._id
    }, {
        activity: ourActivity
    }, {
        new: true
    });
};
var limitToAll = (postParam) => {
    const NewOrder = postParam.NewOrder;
    const ShowPrice = postParam.ShowPrice;
    const haveAccess = postParam.haveAccess;
    const DayliBuyCeil = postParam.DayliBuyCeil;
    return userModel.updateMany({}, {
        globalNewOrder: NewOrder,
        globalShowPrice: ShowPrice,
        globalHaveAccess: haveAccess,
        globalDayliBuyCeil: DayliBuyCeil
    });
};
var limitToOne = (user, NewOrder, ShowPrice, haveAccess) => {
    return userModel.findOneAndUpdate({
        _id: user
    }, {
        isNewOrder: NewOrder,
        isShowPrice: ShowPrice,
        haveAccess: haveAccess
    }, {
        new: true
    });
};
var getOneUser = (userName) => {
    return userModel.find({
        username: userName
    });
}
var acceptOneUser = (user) => {
    return userModel.updateOne({
        _id: user._id
    }, {
        activity: 1,
        rank: user.rank,
        debt: user.debt,
        username: user.username,
        password: user.password,
        registerDay: user.registerDay,
        isNewOrder: user.isNewOrder,
        isShowPrice: user.isShowPrice,
        haveAccess: user.haveAccess,
        globalNewOrder: user.globalNewOrder,
        globalShowPrice: user.globalShowPrice,
        globalHaveAccess: user.globalHaveAccess,
        globalDayliBuyCeil: user.globalDayliBuyCeil
    });
}
var checkUnregisert = (id) => {
    return userModel.find({
        unRegisterId: id
    })
}
var getUByID = (id) => {
    return userModel.findById(id)
};
var addDebt = (userId, Debt) => {
    return userModel.findOneAndUpdate({
        _id: userId
    }, {
        $inc: {
            "debt": Debt
        }
    }, {
        new: true
    });
}

var getGUInfo = (userId) => {
    return userModel.find({
        _id: userId
    }, {
        isNewOrder: 1,
        isShowPrice: 1,
        haveAccess: 1,
        dayliBuyCeil: 1,
        _id: 0
    })
}


var getUsersOrder = (result) => {
    var opts = [{
            path: 'months._id.user'
        },
        {
            path: 'days._id.user'
        }
    ];

    return userModel.populate(result, opts);
}

/**
 * Order Section
 */
var getAllOrders = () => {
    return orderModel.find({
        action: true
    }, {
        weekNumber: 0
    }).populate('user');
};

var populateOrder = (id)=>{
    return orderModel.find({
        _id: id
    }, {
        weekNumber: 0
    }).populate('user');
}
var getMyOrder = (myId) => {
    return orderModel.find({
        action: true,
        user: myId
    }, {
        weekNumber: 0
    }).populate('user');
}
var selectNotAccptedOrders = (isacc) => {
    if (isacc == 1) {
        return orderModel.find({
            action: isacc
        }, {
            weekNumber: 0
        }).populate('user');
    } else if (isacc == 0) {
        return tempOrderModel.find({}).populate('user');
    }

};
var addNewOrder = (order, cb) => {
    orderModel.create(order, cb);
};
var getAllPayedOrder = (_isPayed) => {
    if (_isPayed == 0) {
        return orderModel.find({
            isPayed: false
        }, {
            weekNumber: 0
        }).populate('user');
    } else if (_isPayed == 1) {
        return orderModel.find({
            isPayed: true
        }, {
            weekNumber: 0
        }).populate('user');
    }
};
var changeOrderActivity = (id, ourAction) => {
    return orderModel.findOneAndUpdate({
        _id: id
    }, {
        action: ourAction
    }, {
        new: true
    });
};
var getMainAmount = (idUser, date) => {
    return orderModel.aggregate([{
            $unwind: "$products"
        },
        {
            $match: {
                $and: [{
                    user: idUser
                }, {
                    orderDay: date
                }]
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$products.count"
                }
            }
        }
    ]);
}
var getTodayMain = (date) => {
    return orderModel.aggregate([{
            $unwind: "$products"
        },
        {
            $match: {
                orderDay: date
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$products.count"
                }
            }
        }
    ]);
}
var getMainOById = (idArray) => {
    return orderModel.aggregate([{
            $unwind: "$products"
        },
        {
            $group: {
                _id: "$products.productId",
                count: {
                    $sum: "$products.count"
                }
            }
        },
        {
            $match: {
                _id: {
                    $in: idArray
                }
            }
        }
    ]);
}
var checkUnregiserOr = (id) => {
    return orderModel.find({
        unRegisterId: id
    }, {
        weekNumber: 0
    })
}


var getMyTOrder = (id) => {
    return tempOrderModel.find({
        user: id
    }, {
        weekNumber: 0
    });
}
var totalStaMonth = () => {
    return orderModel.aggregate([{
            $group: {
                _id: {
                    year: "$orderDay.year",
                    month: "$orderDay.month",
                },
                monthCount: {
                    "$sum": 1
                },
                monthAmount: {
                    "$sum": "$totalAmount"
                },

            }
        },
        {
            $group: {
                _id: "$_id.year",
                months: {
                    "$push": {
                        month: "$_id.month",
                        count: "$monthCount",
                        amount: "$monthAmount"
                    },
                },
                totalAmount: {
                    "$sum": "$monthAmount"
                }
            }
        }
    ])
}

var totalStaWeek = () => {
    return orderModel.aggregate([{
            $group: {
                _id: {
                    year: "$orderDay.year",
                    month: "$orderDay.month",
                    day: "$orderDay.daymonth",
                    week: "$weekNumber"
                },
                dayCount: {
                    "$sum": 1
                },
                dayAmount: {
                    "$sum": "$totalAmount"
                }
            }
        },
        {
            $group: {
                _id: {
                    year: "$_id.year",
                    month: "$_id.month",
                    week: "$_id.week"
                },
                days: {
                    "$push": {
                        day: "$_id.day",
                        count: "$dayCount",
                        amount: "$dayAmount"
                    },
                },
                totalAmount: {
                    "$sum": "$dayAmount"
                }
            }
        }
    ]);
}


var managmentStaMonth = () => {
    return orderModel.aggregate([{
            $group: {
                _id: {
                    year: "$orderDay.year",
                    month: "$orderDay.month",
                    user: "$user"
                },
                monthCount: {
                    "$sum": 1
                },
                monthAmount: {
                    "$sum": "$totalAmount"
                },

            }
        },
        {
            $group: {
                _id: {
                    year: "$_id.year",
                    user: "$_id.user"
                },
                months: {
                    "$push": {
                        month: "$_id.month",
                        count: "$monthCount",
                        amount: "$monthAmount"
                    },
                },
                totalAmount: {
                    "$sum": "$monthAmount"
                }
            }
        }
    ])
}

var managmentStaWeek = () => {
    return orderModel.aggregate([{
            $group: {
                _id: {
                    year: "$orderDay.year",
                    month: "$orderDay.month",
                    day: "$orderDay.daymonth",
                    week: "$weekNumber",
                    user: "$user"
                },
                dayCount: {
                    "$sum": 1
                },
                dayAmount: {
                    "$sum": "$totalAmount"
                }
            }
        },
        {
            $group: {
                _id: {
                    year: "$_id.year",
                    month: "$_id.month",
                    week: "$_id.week",
                    user: "$_id.user"
                },
                days: {
                    "$push": {
                        day: "$_id.day",
                        count: "$dayCount",
                        amount: "$dayAmount"
                    },
                },
                totalAmount: {
                    "$sum": "$dayAmount"
                }
            }
        }
    ]);
}

var userStaWeek = (input) => {
    var temp = [];
    temp.push(input);
    temp = temp.map(function (el) {
        return ObjectId(el)
    })
    return orderModel.aggregate([{
            "$match": {
                user: {
                    "$in": temp
                }
            }
        }, {
            $group: {
                _id: {
                    year: "$orderDay.year",
                    month: "$orderDay.month",
                    day: "$orderDay.daymonth",
                    week: "$weekNumber",
                },
                dayCount: {
                    "$sum": 1
                },
                dayAmount: {
                    "$sum": "$totalAmount"
                }
            }
        },
        {
            $group: {
                _id: {
                    year: "$_id.year",
                    month: "$_id.month",
                    week: "$_id.week",
                },
                days: {
                    "$push": {
                        day: "$_id.day",
                        count: "$dayCount",
                        amount: "$dayAmount"
                    },
                },
                totalAmount: {
                    "$sum": "$dayAmount"
                }
            }
        }
    ]);
}

var userStaMonth = (input) => {
    var temp = [];
    temp.push(input);
    temp = temp.map(function (el) {
        return ObjectId(el)
    })
    return orderModel.aggregate([{
            "$match": {
                user: {
                    "$in": temp
                }
            }
        }, {
            $group: {
                _id: {
                    year: "$orderDay.year",
                    month: "$orderDay.month",
                },
                monthCount: {
                    "$sum": 1
                },
                monthAmount: {
                    "$sum": "$totalAmount"
                },

            }
        },
        {
            $group: {
                _id: {
                    year: "$_id.year",
                    user: "$_id.user"
                },
                months: {
                    "$push": {
                        month: "$_id.month",
                        count: "$monthCount",
                        amount: "$monthAmount"
                    },
                },
                totalAmount: {
                    "$sum": "$monthAmount"
                }
            }
        }

    ])
}

var getOrderId = (id) => {
    return orderModel.find({
        _id: id
    }, {
        weekNumber: 0
    });
}

var setPayed = (id, payed, isPa) => {
    return orderModel.findOneAndUpdate({
        _id: id
    }, {
        $inc: {
            "payedAmount": payed
        },
        isPayed: isPa
    }, {
        new: true
    });
}


var orderRank = () => {
    return orderModel.aggregate([{
        $group: {
            _id: {
                user: "$user"
            },
            totalAmount: {
                "$sum": "$totalAmount"
            }
        }
    }]);
}

/**
 * Temp order section
 */
var getTempAmount = (idUser, date) => {
    return tempOrderModel.aggregate([{
            $unwind: "$products"
        },
        {
            $match: {
                $and: [{
                    user: idUser
                }, {
                    orderDay: date
                }]
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$products.count"
                }
            }
        }
    ]);
}
var getToday = (date) => {
    return tempOrderModel.aggregate([{
            $unwind: "$products"
        },
        {
            $match: {
                orderDay: date
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$products.count"
                }
            }
        }
    ]);
}
var getTempOById = (idArray) => {
    return tempOrderModel.aggregate([{
            $unwind: "$products"
        },
        {
            $group: {
                _id: "$products.productId",
                count: {
                    $sum: "$products.count"
                }
            }
        },
        {
            $match: {
                _id: {
                    $in: idArray
                }
            }
        }
    ]);
}
var addTOrder = (tOrder, cb) => {
    tempOrderModel.create(tOrder, cb);
};
var findOrderT = (id) => {
    return tempOrderModel.findById(id).populate('user');
}
var removeTOrder = (order, cb) => {
    var query = {
        user: order.user,
        products: order.products,
        orderDay: order.orderDay,
        totalAmount: order.totalAmount,
    };
    tempOrderModel.deleteOne(query, cb);
}

var deleteTOrder = (id, cb) => {
    tempOrderModel.deleteOne({
        _id: id
    }, cb);
}

/**
 * Product section
 */
var getAllProducts = () => {
    return productModel.find({});
};
var addNewProduct = (product, cb) => {
    productModel.create(product, cb);
};
var changePrice = (product, newPrice) => {
    return productModel.findOneAndUpdate({
        _id: product._id
    }, {
        price: newPrice
    }, {
        new: true
    });
};
var changeAllProWithPic = (newProduct) => {
    var updateQuery = {
        name: newProduct.name,
        $push: {
            imageUrls: newProduct.imageUrls
        },
        information: newProduct.information,
        buyCeiling: newProduct.buyCeiling,
        available: newProduct.available,
        price: newProduct.price
    }
    return productModel.findOneAndUpdate({
        _id: newProduct._id
    }, updateQuery, {
        new: true
    });
};
var changeAllProWithoutPic = (newProduct) => {
    var updateQuery = {
        name: newProduct.name,
        information: newProduct.information,
        buyCeiling: newProduct.buyCeiling,
        available: newProduct.available,
        price: newProduct.price
    }
    return productModel.findOneAndUpdate({
        _id: newProduct._id
    }, updateQuery, {
        new: true
    });
};
var getProByIDS = (idArray) => {
    return productModel.find({
        _id: {
            $in: idArray
        }
    });
}

var deleteProduct = (id, cb) => {
    productModel.deleteOne({
        _id: id
    }, cb);
}


var updateCount = (productArray, cb) => {
    var bulkOps = [];
    productArray.forEach(element => {
        bulkOps.push({
            updateOne: {
                filter: {
                    _id: element.productId
                },
                update: {
                    $inc: {
                        'available': -element.count
                    }
                }
            }
        });
    });
    productModel.bulkWrite(bulkOps, {
        "ordered": true,
        w: 1
    }, cb);
}


/**
 * Payment section
 */
var getAllPayments = () => {
    return paymentModel.find({});
};
var getPaymentOrder = (orderId) => {
    return paymentModel.find({
        orderNumber: orderId
    });
};
var addNewPayment = (payment, cb) => {
    paymentModel.create(payment, cb);
};

/**
 * Role section
 */
var getAllRoles = () => {
    return rolesModel.find({});
};
var addNewRole = (role, cb) => {
    rolesModel.create(role, cb);
};

/**
 * Temp users Sections
 */

var addRegister = (user, cb) => {
    tempUserModel.create(user, cb);
};
var getUnRegister = () => {
    return tempUserModel.find({});
};
var removeTemp = (userId, cb) => {
    var query = {
        _id: userId
    }
    return tempUserModel.deleteOne(query, cb);
}

var getInfo = () => {
    return infoModel.findOne().sort({
        '_id': -1
    }).limit(1);
}
var addInfo = (info, cb) => {
    infoModel.create(info, cb);
}


module.exports = {
    getOrders: getAllOrders,
    getProducts: getAllProducts,
    getPayments: getAllPayments,
    addUser: acceptOneUser,
    addOrder: addNewOrder,
    addPayment: addNewPayment,
    addProduct: addNewProduct,
    selectNotAccptedOrders: selectNotAccptedOrders,
    getUsersByActivity: getUsersActivity,
    getRoles: getAllRoles,
    getAllPayedOrders: getAllPayedOrder,
    deleteUser: changeUserActivity,
    getPaymentsForOrder: getPaymentOrder,
    applyLimitToAll: limitToAll,
    applyLimitToOne: limitToOne,
    getOneUserForLogin: getOneUser,
    deleteOrderFromStore: changeOrderActivity,
    setNewPriceToProduct: changePrice,
    changeProductWithPic: changeAllProWithPic,
    changeProductWithoutPic: changeAllProWithoutPic,
    addnewRole: addNewRole,
    registerUser: addRegister,
    getNotRegisterd: getUnRegister,
    addUserFromTemp: addNewUser,
    removeFromTemp: removeTemp,
    checkUnRegister: checkUnregisert,
    mainAmount: getMainAmount,
    tempAmount: getTempAmount,
    getUserById: getUByID,
    addTempOrder: addTOrder,
    addGlobalInfo: addInfo,
    getGlobalInfo: getInfo,
    findTempOrder: findOrderT,
    getDayBuy: getToday,
    getMainDayBuy: getTodayMain,
    getMainOrdersById: getMainOById,
    getTempOrdersById: getTempOById,
    getPorducstByIds: getProByIDS,
    removeTempOrder: removeTOrder,
    changeProductCount: updateCount,
    addDebtToUser: addDebt,
    checkUnregiserOrder: checkUnregiserOr,
    rejectOrder: deleteTOrder,
    removeProduct: deleteProduct,
    getTotalStatisticsMonth: totalStaMonth,
    getTotalStatisticsWeek: totalStaWeek,
    getManagmentStatisticsMonth: managmentStaMonth,
    getManagmentStatisticsWeek: managmentStaWeek,
    getOrderById: getOrderId,
    increasePayedOrder: setPayed,
    getOrdersGroup: orderRank,
    getUsersFromOrder: getUsersOrder,
    getUserStatisticsWeek: userStaWeek,
    getUserStatisticsMonth: userStaMonth,
    getMyOrders: getMyOrder,
    getMyTempOrder: getMyTOrder,
    getUserGlobalInfo: getGUInfo,
    getOrderUserExpand:populateOrder
};