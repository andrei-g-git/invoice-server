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

    const customerCheckSql = `
        SELECT CUST_CODE, CUST_NAME
        FROM customer
        ;
    `;

    db.query(customerCheckSql, (err, result) => {
        if(err) throw err;
        console.log("code and name: \n" +   JSON.stringify(result));

        const customerNamesAndCodes = result;

        let customerCode = "";
        const existingFilteredCustomer = customerNamesAndCodes.filter(customer => customer.CUST_NAME === invoice.CUST_NAME);
        if(existingFilteredCustomer.length){
            customerCode = existingFilteredCustomer[0].CUST_CODE;
        } else {
            const number = customerNamesAndCodes.length + 1;
            if(number <= 9){ 
                customerCode = "C0000" + number.toString();
            } else {
                if(number <= 99){ 
                    customerCode = "C000" + number.toString();
                } else {
                    if(number <= 999) customerCode = "C00" + number.toString();
                }
            }
            
            
        }

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
                ${invoice.ORD_NUM},
                ${invoice.ORD_AMOUNT},
                0,
                "${getSimpleDate()}",
                "${customerCode}",
                "A000",
                "${invoice.ORD_DESCRIPTION}"
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
                "${customerCode}",
                "${invoice.CUST_NAME}",
                "${invoice.CUST_CITY}",
                "n/a",
                "${invoice.CUST_COUNTRY}",
                10,
                0,
                0,
                0,
                0,
                "${invoice.PHONE_NO}",
                "A000"
            );
        `;

        console.log("############################\n##################################\n###################################\n" + ordersSql + customerSql);

        db.query(ordersSql + customerSql, (err, result) => {
            if(err) throw err;
            response.send(result);
        });
    });

});

app.post("/api/invoices/edit", (request, response) =>{
    const invoice = request.body;

    sql=`
        UPDATE orders
        SET ORD_NUM = ${invoice.ORD_NUM},
            ORD_AMOUNT = ${invoice.ORD_AMOUNT},
            ORD_DATE = "${getSimpleDate()}",
            CUST_CODE = "${invoice.CUST_CODE}",
            ORD_DESCRIPTION = "${invoice.ORD_DESCRIPTION}"
        WHERE 
            ORD_NUM = ${invoice.ORD_NUM}
        ;
        UPDATE customer
        SET CUST_CODE = "${invoice.CUST_CODE}",	
            CUST_NAME = "${invoice.CUST_NAME}",	
            CUST_CITY = "${invoice.CUST_CITY}",	
            CUST_COUNTRY = "${invoice.CUST_COUNTRY}",	
            PHONE_NO = "${invoice.PHONE_NO}"	
        WHERE
            CUST_CODE = "${invoice.CUST_CODE}"
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

const getSimpleDate = () => {
    const dateObject = new Date();
    const year = dateObject.getUTCFullYear();
    const month = dateObject.getUTCMonth() + 1; //starts from 0 
    const day = dateObject.getUTCDate(); //date actually gets the day...
    const date = year + "-" + month + "-" + day;
    console.log(date);
    return date;
}


app.listen(5003, () => console.log("started on port 5003"));