require(`dotenv`).config()
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
const DB = require('./database');
const cors = require(`cors`)

// The service port. In production the application is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the application's static content
app.use(express.static('public'));
app.use(cors({
    origin: process.env.CLIENT_ORIGIN
}))

// Router for service endpoints
var apiRouter = express.Router();
app.use(`/api`, apiRouter);

// CreateAuth token for a new user
apiRouter.post('/auth/register', async (req, res) => {
    if (await DB.getUser(req.body.username)) {
        res.status(409).send({ msg: 'Existing user' });
    } else {
        const user = await DB.createUser(req.body.username, req.body.password);

        // Set the cookie
        // setAuthCookie(res, user.token);

        res.status(201).send({
            id: user._id,
            username: user.username,
            token: user.token,
        });
    }
});

// GetAuth token for the provided credentials
apiRouter.post('/auth/login', async (req, res) => {
    const user = await DB.getUser(req.body.username);
    if (user) {
        if (await bcrypt.compare(req.body.password, user.password)) {
            // setAuthCookie(res, user.token);
            res.send({ id: user._id, username: user.username, token: user.token });
            return;
        }
    }
    res.status(401).send({ msg: 'Unauthorized' });
});

// GetUser returns information about a user
apiRouter.get('/user/:username', async (req, res) => {
    const user = await DB.getUser(req.params.username);
    if (user) {
        const token = req.headers.authorization.split(' ')[1];
        res.send({ username: user.username, authenticated: token === user.token });
        return;
    }
    res.status(404).send({ msg: 'Unknown' });
});

var secureApiRouter = express.Router();
apiRouter.use(secureApiRouter);

secureApiRouter.use(async (req, res, next) => {
    authToken = req.headers.authorization.split(' ')[1];
    const user = await DB.getUserByToken(authToken);
    if (user) {
        next();
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

secureApiRouter.get('/plants', async (req, res) => {
    authToken = req.headers.authorization.split(' ')[1];
    const user = await DB.getUserByToken(authToken);
    const plants = await DB.getPlants(user.username);
    res.send(plants);
});

secureApiRouter.get('/plant/:id', async (req, res) => {
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        const plant = await DB.getPlantById(req.params.id);
        if (plant && user) {
            if (user.username !== plant.owner) {
                res.status(401).send({ msg: 'Unauthorized' });
                return;
            }
            res.send(plant);
            return;
        }
        res.status(404).send({ msg: 'Unknown' });
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

secureApiRouter.post('/plant/:id/water', async (req, res) => {
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        let plant = await DB.getPlantById(req.params.id);
        if (plant && user) {
            if (user.username !== plant.owner) {
                res.status(401).send({ msg: 'Unauthorized' });
                return;
            }
            plant = await DB.addActionToPlant(req.params.id, 'Watered');
            res.send(plant);
        }
        else {
            res.status(404).send({ msg: 'Unknown' });
        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

secureApiRouter.post('/plant/:id/fertilize', async (req, res) => {
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        let plant = await DB.getPlantById(req.params.id);
        if (plant && user) {
            if (user.username !== plant.owner) {
                res.status(401).send({ msg: 'Unauthorized' });
                return;
            }
            plant = await DB.addActionToPlant(req.params.id, 'Fertilized');
            res.send(plant);
        }
        else {
            res.status(404).send({ msg: 'Unknown' });
        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

secureApiRouter.post('/plant/:id/repot', async (req, res) => {
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        let plant = await DB.getPlantById(req.params.id);
        if (plant && user) {
            if (user.username !== plant.owner) {
                res.status(401).send({ msg: 'Unauthorized' });
                return;
            }
            plant = await DB.addActionToPlant(req.params.id, 'Repotted');
            res.send(plant);
        }
        else {
            res.status(404).send({ msg: 'Unknown' });
        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

secureApiRouter.post('/plant/:id/flag', async (req, res) => {
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        let plant = await DB.getPlantById(req.params.id);
        if (plant && user) {
            if (user.username !== plant.owner) {
                res.status(401).send({ msg: 'Unauthorized' });
                return;
            }
            let flagged = plant.flagged || false;
            plant = await DB.flagPlant(req.params.id, !flagged);
            res.send(plant);
        }
        else {
            res.status(404).send({ msg: 'Unknown' });
        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

// Add Plant
secureApiRouter.post('/plant', async (req, res) => {
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        let plant = { ...req.body }
        await DB.addPlant(plant);
        const plants = await DB.getPlants(user.username);
        res.status(201).send(plants);
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

// Delete Plant
secureApiRouter.delete('/plant/:id', async (req, res) => {
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        let plant = await DB.getPlantById(req.params.id);
        if (plant && user) {
            if (user.username !== plant.owner) {
                res.status(401).send({ msg: 'Unauthorized' });
                return;
            }
            await DB.deletePlant(req.params.id);
            const plants = await DB.getPlants(user.username);
            res.send(plants);
        }
        else {
            res.status(404).send({ msg: 'Unknown' });
        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

// Update Plant
secureApiRouter.put('/plant/:id', async (req, res) => {
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        let plant = await DB.getPlantById(req.params.id);
        if (plant && user) {
            if (user.username !== plant.owner) {
                res.status(401).send({ msg: 'Unauthorized' });
                return;
            }
            await DB.updatePlant(req.params.id, req.body);
            plant = await DB.getPlantById(req.params.id);
            res.send(plant);
        }
        else {
            res.status(404).send({ msg: 'Unknown' });
        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

secureApiRouter.post('/search', async (req, res) => { 
    try {
        authToken = req.headers.authorization.split(' ')[1];
        const user = await DB.getUserByToken(authToken);
        let plants = await DB.searchPlants(req.body.query, user.username, req.body.maxEdits);
        res.send(plants);
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
});

// Default error handler
app.use(function (err, req, res, next) {
    res.status(500).send({ type: err.name, message: err.message });
});

// Return the application's default page if the path is unknown
app.use((_req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

const httpService = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

// new PeerProxy(httpService);