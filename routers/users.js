import express from 'express';
import pool from '../db/pool.js'
import { body, validationResult } from 'express-validator';

const usersRouter = express.Router();


const userValidator = [
    body('first_name').isString().notEmpty(),
    body('last_name').isString().notEmpty(),
    body('age').isLength({ min: 1 }).isInt()
    ];
    
const userValidatorPut = [
    body('first_name').isString().notEmpty().optional(),
    body('last_name').isString().notEmpty().optional(),
    body('age').isLength({ min: 1 }).isInt().optional()
    ];


usersRouter.get("/", async (req, res) => {
    try {
    const {rows} = await pool.query('SELECT * FROM users');
    res.json(rows)
    } catch(err){
        res.status(500).json(err)
    }
})

// usersRouter.get("/:?sort=true", async (req, res) => {
//     try {
//     const {rows} = await pool.query('SELECT * FROM users ORDER BY id ASC');
//     res.json(rows)
//     } catch(err){
//         res.status(500).json(err)
//     }
// })
// usersRouter.get("/:?sort=true2", async (req, res) => {
//     try {
//     const {rows} = await pool.query('SELECT * FROM users ORDER BY id DESC');
//     res.json(rows)
//     } catch(err){
//         res.status(500).json(err)
//     }
// })



usersRouter.get("/:id", async (req, res) => {
    const {id} = req.params;
    try {
    const {rows} = await pool.query(`SELECT * FROM users WHERE id=$1;`, [id]);
    if (rows[0] === undefined) {
        res.status(404).json({message: 'User not found'})
    } else {
        res.json(rows[0])
    }
  
    } catch(err){
        res.status(500).json(err)
    }
})

usersRouter.post("/", userValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

    const {first_name, last_name, age} = req.body;
    try {
        const {rows} = await pool.query('INSERT INTO users(first_name, last_name, age) VALUES($1, $2, $3) RETURNING *;', [first_name, last_name, age]);
        res.json(rows[0])

    } catch(err){
        res.status(500).json(err)
    }
})


usersRouter.put("/:id", userValidatorPut, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
        
    const {first_name, last_name, age} = req.body;
    const {id} = req.params;
    let setClauses= [];
    let values = [];

    if (first_name !== undefined) {
        setClauses.push(`first_name = $${values.length + 1}`);
        values.push(first_name);
    }

    if (last_name !== undefined) {
        setClauses.push(`last_name = $${values.length + 1}`);
        values.push(last_name);
    }

    if (age !== undefined) {
        setClauses.push(`age = $${values.length + 1}`);
        values.push(age);
    }
    if (!setClauses.length) {
        return res.status(400).json({message: "No changes to update"});
    }

    values.push(id);
   
    const query = `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`;
    console.log(query, 'query');

    try {
        const {rows} = await pool.query(query, values);
        if (!rows.length) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(rows[0]);

    } catch(err){
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
})


usersRouter.delete("/:id", async (req, res) => {
    const {id} = req.params;
    try {
        const {rows} = await pool.query('DELETE FROM users WHERE id=$1 RETURNING *;', [id]);
        if (rows[0] === undefined) {
            res.status(404).json({message: `User doesn't exist`})
        } else {
            res.json({ message: 'User deleted', data: rows[0] })}
        
    } catch(err){
        res.status(500).json(err)
    }
})



usersRouter.get("/:id/orders", async (req, res) => {
    const {id} = req.params;
    try {
    const {rows} = await pool.query('SELECT * FROM orders WHERE user_id=$1', [id]);
    if (rows[0] === undefined) {
        const {rows} = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
            if (rows[0] === undefined) {
                res.status(404).json({message: `User doesn't exist`})
             } else {res.json({ message: 'User has no orders yet'})}
    } else {
        res.json(rows)}
    
    } catch(err){
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
})

usersRouter.put("/:id/check-inactive", async (req, res) => {
    const { id } = req.params;
    
    try {
        const orders = await pool.query('SELECT * FROM orders WHERE user_id=$1;', [id]);
        if (orders.rows.length === 0) {
            const { rows } = await pool.query('UPDATE users SET active=false WHERE id=$1 RETURNING *;', [id]);
            res.json(rows[0]);
        } else {
            res.status(400).json({ message: "User has active orders or orders history, cannot set to inactive" });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});


export default usersRouter;
