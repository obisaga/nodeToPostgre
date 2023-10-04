import express from 'express';
import pool from '../db/pool.js'
import { body, validationResult } from 'express-validator';

const ordersRouter = express.Router();


const orderValidator = [
body('price').isLength({ min: 1 }).isInt(),
body('date').isLength({ min: 20 }).isString(),
body('user_id').isLength({ min: 1 }).isInt()
];

const orderValidatorPut = [
    body('price').isLength({ min: 1 }).isInt().optional(),
    body('date').isLength({ min: 20 }).isString().optional(),
    body('user_id').isLength({ min: 1 }).isInt().optional()
    ];




ordersRouter.get("/", async (req, res) => {
    try {
    const {rows} = await pool.query('SELECT * FROM orders');
    res.json(rows)
    } catch(err){
        res.status(500).json(err)
    }
})

ordersRouter.get("/:id", async (req, res) => {
    const {id} = req.params;
    try {
    const {rows} = await pool.query(`SELECT * FROM orders WHERE id=$1;`, [id]);
    if (rows[0] === undefined) {
        res.status(404).json({message: 'Order not found'})
    } else {
        res.json(rows[0])
    }
  
    } catch(err){
        res.status(500).json(err)
    }
})

ordersRouter.post("/", orderValidator, async (req, res) => {
        
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

    const {price, date, user_id} = req.body;
    try {
        const {rows} = await pool.query('INSERT INTO orders(price, date, user_id) VALUES($1, $2, $3) RETURNING *;', [price, date, user_id]);
        res.json(rows[0])

    } catch(err){
        res.status(500).json(err)
    }
})


ordersRouter.put("/:id", orderValidatorPut, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
   
    const {price, date, user_id} = req.body;
    const {id} = req.params;
    let setClauses= [];
    let values = [];

    if (price !== undefined) {
        setClauses.push(`price = $${values.length + 1}`);
        values.push(price);
    }

    if (date !== undefined) {
        setClauses.push(`date = $${values.length + 1}`);
        values.push(date);
    }

    if (user_id !== undefined) {
        setClauses.push(`user_id = $${values.length + 1}`);
        values.push(user_id);
    }
    if (!setClauses.length) {
        return res.status(400).json({message: "No changes to update"});
    }

    values.push(id);
   
    const query = `UPDATE orders SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`;
    console.log(query, 'query');

    try {
        const {rows} = await pool.query(query, values);
        if (!rows.length) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(rows[0]);

    } catch(err){
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
})



ordersRouter.delete("/:id", async (req, res) => {
    const {id} = req.params;
    try {
        const {rows} = await pool.query('DELETE FROM orders WHERE id=$1 RETURNING *;', [id]);
        if (rows[0] === undefined) {
            res.status(404).json({message: 'Order not found exist'})
        } else {
            res.json({ message: 'Order cancelled', data: rows[0] })}
        
    } catch(err){
        res.status(500).json(err)
    }
})




export default ordersRouter;
