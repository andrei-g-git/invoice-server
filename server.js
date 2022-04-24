const express = require('express');

const mysql = require('mysql');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "invoices",
    multipleStatements: true //allows multiple operations in the same query, disabled by default for security reasons
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
            customer.PHONE_NO,
            customer.CUST_CODE 
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
    const invoice = request.body;

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
            "${invoice.date}",
            "${invoice.customerCode}",
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
            "${invoice.customerCode}",
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

    console.log("############################\n##################################\n###################################\n" + ordersSql + customerSql);

    db.query(ordersSql + customerSql, (err, result) => {
        if(err) throw err;
        response.send(result);
    });

});

app.post("/api/invoices/edit", (request, response) =>{
    const invoice = request.body;

    sql=`
        UPDATE orders
        SET ORD_NUM = ${invoice.order},
            ORD_AMOUNT = ${invoice.amount},
            ORD_DATE = "${invoice.date}",
            CUST_CODE = "${invoice.customerCode}",
            ORD_DESCRIPTION = "${invoice.status}"
        WHERE 
            ORD_NUM = ${invoice.order}
        ;
        UPDATE customer
        SET CUST_CODE = "${invoice.customerCode}",	
            CUST_NAME = "${invoice.name}",	
            CUST_CITY = "${invoice.city}",	
            CUST_COUNTRY = "${invoice.country}",	
            PHONE_NO = "${invoice.phone}"	
        WHERE
            CUST_CODE = "${invoice.customerCode}"
        ;
    `;

    db.query(sql, (err, result) => {
        if(err) throw err;
        response.send(result);
    });
});

app.post("/api/invoices/delete", (request, response) =>{
    const order = request.body;

    const sql = `
        DELETE
        FROM orders
        WHERE ORD_NUM = ${order}
        ;
    `;

    db.query(sql, (err, result) => {
        if(err) throw err;
        response.send(result);
    })
})

app.listen(5003, () => console.log("started on port 5003"));