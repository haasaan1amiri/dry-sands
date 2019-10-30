const express = require('express');
const app = express();
var server = require('http').createServer(app);


const routers = require('./routers');
const config = require('./config/config');

// Using JSON format for request and respons
app.use(express.json());

//use reouter.userRoute for user routing
app.use('/users', routers.userRoute);

//use reouter.productRuter for product routing
app.use('/products', routers.productRoute);

//use reouter.orderRoute for order routing
app.use('/orders', routers.orderRoute);

//use reouter.roleRoute for role routing
app.use('/roles', routers.roleRoute);

//use reouter.roleRoute for role routing
app.use('/global', routers.globalRouter);

//use reouter.paymantRoute for payment routing
app.use('/payments', routers.paymantRoute);

app.use('/login', routers.loginRoute);

app.use('/statistics',routers.statisticsRouter);

app.use('/uploads', express.static(__dirname + '/uploads'));
/**
 * Find port and listen to this port ...
 */
const port = process.env.PORT || config.serverPort;
server.listen(port, () => {
   console.log(`Listening port ${port}`);
});

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/temp/index.html');
});