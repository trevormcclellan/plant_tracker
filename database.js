const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

const userName = process.env.MONGOUSER;
const password = process.env.MONGOPASSWORD;
const hostname = process.env.MONGOHOSTNAME;

if (!userName || !password || !hostname) {
    throw Error('Database not configured. Set environment variables');
}

const url = `mongodb+srv://${userName}:${password}@${hostname}`;

const client = new MongoClient(url);
const userCollection = client.db('startup').collection('user');
const plantCollection = client.db('startup').collection('plant');

function getUser(username) {
    return userCollection.findOne({ username: username });
}

function getUserByToken(token) {
    return userCollection.findOne({ token: token });
}

async function createUser(username, password) {
    // Hash the password before we insert it into the database
    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
        username: username,
        password: passwordHash,
        token: uuid.v4(),
    };
    await userCollection.insertOne(user);

    return user;
}

async function addPlant(plant) {
    plantCollection.insertOne(plant);
}

function getPlantById(id) {
    return plantCollection.findOne({ _id: new ObjectId(id) });
}

async function addActionToPlant(id, type) {
    const action = { type: type, time: new Date() };
    const query = { _id: new ObjectId(id) };
    const update = { $push: { actions: action } };
    await plantCollection.updateOne(query, update);
    return plantCollection.findOne(query);
}

function getPlants(username) {
    const query = { owner: username };
    const cursor = plantCollection.find(query);
    return cursor.toArray();
}

function deletePlant(id) {
    const query = { _id: new ObjectId(id) };
    return plantCollection.deleteOne(query);
}

function updatePlant(id, plant) {
    const query = { _id: new ObjectId(id) };
    return plantCollection.updateOne(query, { $set: plant });
}

async function flagPlant(id, flag) {
    const query = { _id: new ObjectId(id) };
    await plantCollection.updateOne(query, { $set: { flagged: flag } });
    return plantCollection.findOne(query);
}

async function searchPlants(query, owner, maxEdits) {
    if (!maxEdits) {
        maxEdits = 1;
    }

    let pipeline = [
        {
            $search: {
                "index": "name",
                "text": {
                    "query": query,
                    "path": "name",
                    "fuzzy": {
                        "maxEdits": maxEdits
                    }
                }
            }
        },
        {
            $match: {
                "owner": owner
            }
        }
    ];

    let aggCursor = plantCollection.aggregate(pipeline);
    let array = await aggCursor.toArray();

    if (!array.length && maxEdits === 1) {
        console.log("Trying with maxEdits = 2");
        pipeline[0].$search.text.fuzzy.maxEdits = 2;
        aggCursor = plantCollection.aggregate(pipeline);
        array = aggCursor.toArray();
    }

    return array;
}

module.exports = {
    getUser,
    getUserByToken,
    createUser,
    addPlant,
    addActionToPlant,
    getPlantById,
    getPlants,
    deletePlant,
    updatePlant,
    flagPlant,
    searchPlants,
};
