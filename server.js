const express = require('express');

const mysql = require('mysql');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "invoices"
});

db.connect((err) => {
    if(err) throw err;
    console.log("mysql connected...")
})

const app = express();

app.use(express.json()); 
app.use(express.urlencoded({extended: false}));
//need if CORSE blocks client from accessing ... directly? I think? I don't really understand what it's for
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


//#############################
app.get("/api/invoices", (request, response) => {
    const sql = `
        SELECT orders.ORD_NUM, 
            orders.ORD_DATE, 
            orders.ORD_AMOUNT, 
            orders.ORD_DESCRIPTION,
            customer.CUST_NAME,
            customer.CUST_COUNTRY,
            customer.CUST_CITY,
            customer.PHONE_NO 
        FROM orders, customer
        WHERE orders.CUST_CODE=customer.CUST_CODE;
    `  
    db.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result);
        response.send(result);
    });
});

app.post("/api/invoices/add", (request, response) => {
    const invoice = request.body;//.invoice;
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~" + request.body.invoice)
    const ordersSql = `
        INSERT INTO orders(
            ORD_NUM,
            ORD_AMOUNT,
            ADVANCE_AMOUNT, 
            ORD_DATE,
            CUST_CODE,
            AGENT_CODE,
            ORD_DESCRIPTION
        )
        VALUES(
            ${invoice.order},
            ${invoice.amount},
            0,
            ${invoice.date},
            "C00000",
            "A000",
            "${invoice.status}"
        );
    `;
    const customerSql = `
        INSERT INTO customer(
            CUST_CODE,	
            CUST_NAME,	
            CUST_CITY,	
            WORKING_AREA,	
            CUST_COUNTRY,	
            GRADE,	
            OPENING_AMT,	
            RECEIVE_AMT,	
            PAYMENT_AMT,	
            OUTSTANDING_AMT,	
            PHONE_NO,	
            AGENT_CODE
        )
        VALUES(
            "C00000",
            "${invoice.name}",
            "${invoice.city}",
            "n/a",
            "${invoice.country}",
            10,
            0,
            0,
            0,
            0,
            ${invoice.phone},
            "A000"
        );
    `;

    console.log("############################\n##################################\n###################################\n" + ordersSql);
    db.query(ordersSql, (err, result) => {
        if(err) throw err;
        response.send(result)
    });
    db.query(customerSql, (err, result) => {
        if(err) throw err;
        response.send(result)
    });
    // orders.ORD_DATE = ${invoice.date}
    // orders.ORD_AMOUNT = ${invoice.amount}
    // orders.ORD_DESCRIPTION = ${invoice.status}
    // customer.CUST_NAME = ${invoice.name} 
    // customer.CUST_COUNTRY = ${invoice.country} 
    // customer.CUST_CITY = ${invoice.city} 
    // customer.PHONE_NO = ${invoice.phone}

});


app.listen(5003, () => console.log("started on port 5003"));