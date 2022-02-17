const { request } = require("express");
const express = require("express");
const { v4: uuidV4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find(cos => cos.cpf === cpf);

    if (!customer) {
        return res.status(400).json({ message: "User not found" })
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acm, operation) => {
        if (operation.type === 'credit') {
            return acm + operation.ammount;
        } else {
            return acm - operation.ammount;
        }
    }, 0);

    return balance
}

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some(cos => cos.cpf === cpf);

    if (customerAlreadyExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    customers.push({
        id: uuidV4(),
        name,
        cpf,
        statement: []
    });

    return res.status(201).json({ message: "Created" });
});

app.put('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body
    const { customer } = req

    customer.name = name;

    return res.status(201).send();
})

app.get('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    return res.status(200).json(customer);
})

app.delete('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req

    customers.splice(customer, 1);

    return res.status(200).json(customers);
})

// app.use(verifyIfExistsAccountCPF);

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req

    return res.status(200).json(customer.statement);
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00").toDateString();


    const statement = customer.statement.filter(statement => {
        console.log('Date Statement: ', statement.created_at.toDateString());
        console.log('DateFormat:     ', dateFormat);

        return statement.created_at.toDateString() === dateFormat
    })

    return res.status(200).json(statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req
    const { description, ammount } = req.body

    const statementOperation = {
        description,
        ammount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation);

    return res.status(201).json({ message: "Deposit with successful" })
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
    const { ammount, } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

    if (balance < ammount) {
        return res.status(400).json({ error: "Insufficient funds" })
    }

    const statementOperation = {
        ammount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation);

    return res.status(201).json({ message: "Withdraw with successful" })

})

app.get('/balance', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req
    const balance = getBalance(customer.statement);

    return res.json(balance);
})

app.listen(3333);