import express from 'express';
import usersRouter from './routers/users.js';
import ordersRouter from './routers/orders.js';

import 'dotenv/config';


const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);
  



const port = process.env.PORT || 8080;

app. listen(port, () => {
console.log(`Server listening on port ${port}`)
})













// app.get("/time", async (req, res) => {
//     try {
//     const {rows} = await pool.query('SELECT NOW()');
//     res.json(rows[0])
//     } catch(err){
//         res.status(500).json(err)
//     }

// })


// app.get("/time", (req, res) => {
//     pool.query('SELECT NOW(')
//         .then(data => res.json(data.rows[0]))
//         .catch(err => res.status(500).json(err))
// })


