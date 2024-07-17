
const express = require('express')
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 8000;

// middleware
app.use(cors())
app.use(express.json())




// const uri = "mongodb+srv://<username>:<password>@cluster0.c5gs6mm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c5gs6mm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const userCollection = client.db('mobileDB').collection('user');

        // auth related api
        app.post('/jwt', async (req, res) => {
            const userInfo = req.body.userInfo
            console.log('jwt', userInfo)
            const token = jwt.sign({
                data: userInfo
            }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token })

        })

        app.post('/is-login', async (req, res) => {
            try {
                const token = req.body.token
                console.log(token)
                var decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
                const email = decoded.data
                const existingUser = await userCollection.findOne({ email: email });
                if (existingUser) {
                    res.send({ message: 'user is Logged in', user: existingUser })
                }
                else {
                    res.sendStatus(404)
                }
            } catch (error) {
                console.error('Error fetching user:', error)
                res.sendStatus(500)
            }
        })

        app.post('/signIn', async (req, res) => {
            const { email, pin } = req.body;
            try {
                const user = await userCollection.findOne({ email: email });
                if (!user) {
                    return res.status(400).send({ message: 'invaalid email' })
                }
                const isMatch = await bcrypt.compare(pin, user.pin);
                if (!isMatch) {
                    return res.status(400).send({ message: 'invalid pin' })
                }
                res.send({ message: 'login successfull', user })
                console.log(email)
            }
            catch (error) {
                console.error('Error fetching user:', error)
                res.sendStatus(500)
            }
        })

        app.post('/addUser', async (req, res) => {
            const user = req.body;
            console.log('all ', user)
            const result = await userCollection.insertOne(user)
            res.send(result)
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('mobile is runing')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})