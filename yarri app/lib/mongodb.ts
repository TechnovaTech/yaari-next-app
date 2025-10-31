import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://72.60.218.7:27017/yarri'
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Extend global type to include _mongoClientPromise
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise

export default clientPromise