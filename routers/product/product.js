const productRouter = require("express").Router();
const Joi = require('joi');
const multer = require("multer");
Joi.objectId = require('joi-objectid')(Joi);

const formidable = require('formidable');
const path = require('path');

const myQuery = require('../../db/mongooseQuery');
const authutility = require('../../authorization/authUtility');
const uploadPath = path.join(__dirname + "../../../uploads/");
const addProductCheck = (input) => {
    const schema = {
        name: Joi.string().min(3).max(30).required(),
        information: Joi.string().required(),
        buyCeiling: Joi.number().positive().required(),
        available: Joi.number().min(0).required(),
        price: Joi.number().positive().required()
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}
const chanhgePriceProductCheck = (input) => {
    const productSchema = Joi.object().keys({
        name: Joi.string().min(3).max(30).required(),
        imageUrls: Joi.array().items(Joi.string()),
        information: Joi.string().required(),
        buyCeiling: Joi.number().positive().required(),
        available: Joi.number().min(0).required(),
        price: Joi.number().positive().required(),
        _id: Joi.objectId()
    });
    const schema = {
        price: Joi.number().positive().required(),
        product: productSchema
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}
const changeProductCheck = (input) => {
    const schema = {
        name: Joi.string().min(3).max(30).required(),
        information: Joi.string().required(),
        buyCeiling: Joi.number().positive().required(),
        available: Joi.number().min(0).required(),
        price: Joi.number().positive().required(),
        imageUrls: Joi.array().items(Joi.string()),
        _id: Joi.objectId()
    };
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}

const deleteProductCheck = (input) => {
    const schema = {
        _id: Joi.objectId()
    }
    const result = Joi.validate(input, schema);
    if (result.error) {
        return result.error.details[0].message;
    }
    return "OK";
}

productRouter.get('/', (req, res, next) => {
    authutility.tokenBaseAuth("both", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        myQuery.getProducts().exec((err, products) => {
            if (err) {
                console.log(err);
                res.status(501).send("server failed ");
            } else {
                res.status(200).send(products);
            }
        });
    }

});

productRouter.post('/newproduct', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {

    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                var form = new formidable.IncomingForm();
                form.encoding = 'utf-8';
                form.multiples = true;
                form.parse(req, function (err, fields, files) {
                    console.log(fields);
                    console.log(files);
                    console.log(err);

                    if (err) {
                        res.status(501).json({
                            error: err
                        });
                        return;
                    } else if (files.photos == undefined) {
                        console.log('Photo missed');
                        res.status(401).json({
                            error: "Photo missed"
                        });
                        return;
                    } else if (fields.data == undefined) {
                        console.log('Photo missed');
                        res.status(401).json({
                            error: "data is missed"
                        });
                        return;
                    } else {
                        var postParam = JSON.parse(fields.data);
                        var temp = addProductCheck(postParam);
                        if (temp == "OK") {
                            if (Array.isArray(files.photos)) {
                                postParam.imageUrls = new Array();
                                for (var index = 0; index < files.photos.length; index++) {
                                    postParam.imageUrls.push(files.photos[index].name);
                                }
                            } else {
                                postParam.imageUrls = new Array();
                                postParam.imageUrls.push(files.photos.name);
                            }
                            myQuery.addProduct(postParam, (err, pro) => {
                                if (err) {
                                    res.status(501).send("server failed " + err);
                                } else {
                                    console.log("Product added ");
                                    res.status(200).send(pro);
                                }
                            });
                        } else {
                            res.status(401).send("data is incorrect");
                        }
                        return;
                    }
                });
                form.onPart = function (part) {
                    if (!part.filename || part.filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
                        this.handlePart(part);
                    } else {
                        console.log(part.filename + ' is not allowed');
                    }
                }
                form.on('fileBegin', function (name, file) {
                    var arr = file.name.split(".");
                    file.name = file.name + '-' + Date.now() + "." + arr[arr.length - 1];
                    file.path = uploadPath + file.name;
                });
                form.on('error', (err) => {
                    res.status(501).send(err);
                    return;
                });
                form.on('aborted', () => {
                    res.status(401).send('aborted!!');
                    return;
                });
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});
productRouter.post('/update', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const postParam = req.body;
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                console.log(postParam);
                var temp = changeProductCheck(postParam);
                if (temp == "OK") {
                    myQuery.changeProductWithoutPic(postParam).exec((err, pro) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed ");
                        } else {
                            console.log("Product changed");
                            res.status(200).send(pro);
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


productRouter.post('/update/price', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const postParam = req.body;
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                if (chanhgePriceProductCheck(postParam) == "OK") {
                    myQuery.setNewPriceToProduct(postParam.product, postParam.price).exec((err, product) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed");
                        } else {
                            console.log("Product price changed");
                            res.status(200).send(product);
                        }
                    });
                } else {
                    res.status(401).send("Wrong change price object");
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});



productRouter.post('/delete', (req, res, next) => {
    authutility.tokenBaseAuth("admin", req, res, next)
}, (req, res) => {
    if (req.userData == undefined) {
        res.status(401).send("Wrong token string");
    } else {
        const username = req.userData.username;
        const password = req.userData.password;
        const postParam = req.body;
        console.log(postParam);
        if (username != null && password != null) {
            if (username === "android" && password === "admin123") {
                if (deleteProductCheck(postParam) == "OK") {
                    myQuery.removeProduct(postParam._id, (err) => {
                        if (err) {
                            console.log(err);
                            res.status(501).send("server failed");
                        } else {
                            console.log("Product removed succesfully ");
                            res.status(200).send("Product removed successfully");
                        }
                    });
                } else {
                    res.status(401).send("Wrong change price object");
                }
            } else {
                res.status(401).send("Wrong username and password");
            }
        } else {
            res.status(401).send("Not username and password");
        }
    }
});


module.exports = productRouter;