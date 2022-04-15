const mysql =require('mysql');

const connection =mysql.createConnection({
    host:'localhost',
    port:3306,
    database:'ecommerce',
    user:'root',
    password:'07022003'
});
connection.connect(function (err) {
    if(err){
        console.log(err.message);
    }
    else{
        console.log("connection created with Mysql successfully");
    }
 });
 module.exports = connection;

 