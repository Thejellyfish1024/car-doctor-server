const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.port || 5000;

// //
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s79pxyc.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const database = client.db("carDoctorDB")
    const serviceCollection = database.collection("services")
    const orderCollection = database.collection("orders")

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

    
    app.get('/myOrders', async(req,res) =>{
      let query = {}
      if(req.query?.clientEmail){
        query = {
          clientEmail : req?.query?.clientEmail
        }
      }
      const cursor = orderCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.post('/myOrders', async(req,res) =>{
      const newOrder = req.body;
      console.log('new order', newOrder);
      const result = await orderCollection.insertOne(newOrder)
      res.send(result)
      
    })




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
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Car Doctor Server ${port}`)
})