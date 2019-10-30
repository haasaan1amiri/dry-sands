const myQuery = require('../../db/mongooseQuery');
const getUsersPromise = () => {
    var promise = new Promise((resolve, reject) => {
        myQuery.getUsersByActivity(1).exec((err, users) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(users);
            }
        });
    });
    return promise;
}
const getOrdersGroup = () => {
    var promise = new Promise((resolve, reject) => {
        myQuery.getOrdersGroup().sort({
            totalAmount: 1
        }).exec((err, orders) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(orders);
            }
        });
    });
    return promise;
}
module.exports.getUserByRank = (callback) => {
    getUsersPromise().then((usersB) => {
        getOrdersGroup().then((usersA) => {
            console.log(typeof usersA);
            var count = 1;
            var allUsers = [];
            for (let index = 0; index < usersA.length; index++) {
                const x = usersA[index];
                console.log("userA  %s",x._id.user);
                for (let i = 0; i < usersB.length; i++) {
                    var y = usersB[i];
                    console.log("UserB  %s",y._id);
                    if (y._id.equals(x._id.user)) {
                        console.log("Go to if");
                        y.rank = count;
                        count++;
                        allUsers.push(y);
                        break;
                    }
                }
            }
            for (let i = 0; i < usersB.length; i++) {
                var y = usersB[i];
                if (y.rank == -1) {
                    y.rank = count;
                    count++;
                    allUsers.push(y);
                }
            }
            callback(null, allUsers);
        }).catch((error) => {
            callback(error, null);
        });
    }).catch((error) => {
        callback(error, null);
    });
}