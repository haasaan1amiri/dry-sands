const moment = require("jalali-moment");

var getDate = () => {
    var date = new Date();
    year = date.getFullYear();
    month = date.getMonth() + 1;
    dt = date.getDate();
    if (dt < 10) {
        dt = '0' + dt;
    }
    if (month < 10) {
        month = '0' + month;
    }
    temp = year + '/' + month + '/' + dt;
    var NewDate = moment(temp, 'YYYY/MM/DD').locale('fa');
    var newYear = NewDate.format('YYYY');
    var newMonth = NewDate.format('MM');
    var newDay = NewDate.format('DD');
    return {
        newYear,
        newMonth,
        newDay
    };
}


var getInDash = (input) => {
    var year = input.year;
    var month = input.month;
    var daymonth = input.daymonth;
    if (daymonth < 10) {
        daymonth = '0' + daymonth;
    }
    if (month < 10) {
        month = '0' + month;
    }
    var temp = year + '-' + month + '-' + daymonth;
    var NewDate = moment(temp, 'YYYY-MM-DD').format("w");
    return NewDate;
}
module.exports = {
    getPersianDate: getDate,
    getMiladiWeek: getInDash
}