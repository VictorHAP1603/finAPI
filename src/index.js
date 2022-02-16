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

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some(cos => cos.cpf === cpf);

    if (customerAlreadyExists) {
        return res.status(400).json({message: "User already exists"});
    }

    customers.push({
        id: uuidV4(),
        name,
        cpf,
        statement: []
    });

    return res.status(201).json({ message: "Created" });
});

// app.use(verifyIfExistsAccountCPF);

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req
    return res.status(200).json(customer.statement);
});

app.listen(3333);