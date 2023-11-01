const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express()
const port = process.env.port || 5000;

// //
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json())
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s79pxyc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middleware

 const verifyToken = async(req,res,next) =>{
      const token = req.cookies?.token;
      if(!token){
        return res.status(401).send({message : 'Unauthorized Access'})
      }
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded) =>{
        if(err){
          console.log(err);
          return res.status(401).send({message : 'Unauthorized'})
        }
        req.user = decoded;
        next();
      })
    }
    

    // 
    // 

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("carDoctorDB")
    const serviceCollection = database.collection("services")
    const orderCollection = database.collection("orders")

    // auth api

  //   app.post('/jwt', async (req, res) => {
  //     const user = req.body;
  //     console.log(user);

  //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
  //         expiresIn: '1h'
  //     });

  //     res
  //         .cookie('token', token, {
  //             httpOnly: true,
  //             secure: false
  //         })
  //         .send({ success: true })
  // })
  // 

    app.post('/jwt', async(req,res) =>{
      const user = req.body;
      console.log('user for token : ',user);
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'1h'
      })
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false,
        // sameSite:'none'
      })
      .send({success:true})
    })

    app.post('/logout', async(req,res) =>{
      const user = req.body;
      console.log('logging out ', user);
      res.clearCookie('token',{maxAge: 0}).send({success: true})
    })

   
    app.get('/services',async(req,res) =>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/services/:id', async(req,res) =>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const options = {
            projection : {title:1, price:1, img:1, description: 1, facility: 1, _id:1}
        }
        const result = await serviceCollection.findOne(query,options)
        res.send(result)
    })

    
    app.get('/myOrders',verifyToken, async(req,res) =>{
      console.log(req.query?.clientEmail);
      console.log('user in the valid token', req.user);

      if(req.query?.clientEmail !== req.user?.email){
        return res.status(403).send({message: 'Forbidden Access'})
      }

      let query = {}
      // console.log('tok tok token',req.cookies?.token);
      if(req.query?.clientEmail){
        query = {
          clientEmail : req?.query?.clientEmail
        }
      }
      const cursor = orderCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/myOrders/:id',verifyToken, async(req,res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await orderCollection.findOne(query)
      res.send(result)
    })

    app.post('/myOrders', async(req,res) =>{
      const newOrder = req.body;
      console.log('new order', newOrder);
      const result = await orderCollection.insertOne(newOrder)
      res.send(result)
      
    })

    app.delete('/myOrders/:id', async(req, res) =>{
      const id = req.params.id;
      console.log(id);
      const query = {_id : new ObjectId(id)}
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })




    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Car Doctor Server ${port}`)
})